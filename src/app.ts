import Anthropic from "@anthropic-ai/sdk"
import { Hono } from "hono"
import { responder } from "./claude.js"
import { leerConfig, salud, type Config } from "./config.js"
import { abrirConversacion, iniciarActivacion, leerSandbox, registrarWebhook, soloDigitos } from "./conectar.js"
import { memoriaEnProceso, memoriaSupabase, type Memoria } from "./memoria.js"
import { instrucciones, leerNegocio } from "./negocio.js"
import { atender, decidir, deduplicador, type EventoZernio } from "./webhook.js"
import { enviarMensaje, firmaValida } from "./zernio.js"
import { timingSafeEqual } from "node:crypto"

type Deps = {
  config?: Config
  memoria?: Memoria
  pensar?: (historial: Parameters<typeof responder>[0]["historial"]) => Promise<string>
  enviar?: (conversacion: string, cuenta: string, texto: string, clave: string) => Promise<unknown>
  esperar?: (tarea: Promise<unknown>) => void
}

export function crearApp(deps: Deps = {}) {
  const config = deps.config ?? leerConfig()
  const memoria =
    deps.memoria ??
    (config.supabaseUrl && config.supabaseKey
      ? memoriaSupabase(config.supabaseUrl, config.supabaseKey, config.memoriaTurnos)
      : memoriaEnProceso(config.memoriaTurnos))
  const sistema = instrucciones(config.nombreAgente, leerNegocio())
  const cliente = config.anthropicKey ? new Anthropic({ apiKey: config.anthropicKey }) : null
  const pensar =
    deps.pensar ??
    ((historial) => {
      if (!cliente) throw new Error("Falta ANTHROPIC_API_KEY")
      return responder({ cliente, model: config.model, sistema, historial })
    })
  const enviar =
    deps.enviar ?? ((c: string, a: string, t: string, k: string) => enviarMensaje(config.zernioKey, c, a, t, k))
  const esperar = deps.esperar ?? ((t: Promise<unknown>) => void t)
  const nuevo = deduplicador()

  const app = new Hono()

  app.get("/", (c) => c.html(pagina("Tu agente está vivo", `<p>Revisa <a href="/health">/health</a> y luego <a href="/conectar">conecta tu WhatsApp</a>.</p>`)))

  app.get("/health", (c) => {
    // Siempre 200: Railway usa esta ruta para saber si la app arrancó, aunque falten llaves.
    return c.json(salud(config))
  })

  app.post("/webhook", async (c) => {
    const cuerpo = await c.req.text()
    if (!firmaValida(cuerpo, c.req.header("X-Zernio-Signature"), config.webhookSecret)) {
      console.warn("[webhook] firma inválida: revisa que ZERNIO_WEBHOOK_SECRET sea el mismo en Railway y en /conectar")
      return c.text("firma inválida", 401)
    }
    let evento: EventoZernio
    try {
      evento = JSON.parse(cuerpo)
    } catch {
      return c.text("json inválido", 400)
    }
    const accion = decidir(evento)
    if (accion.tipo === "ignorar" || !nuevo(accion.clave)) return c.body(null, 200)

    // Respondemos 200 de una vez y Claude trabaja después: así Zernio no reintenta ni duplica.
    esperar(
      atender(accion, { memoria, pensar, enviar })
        .then(() => console.log("[webhook] respondido", accion.conversacion.slice(-6)))
        .catch((e: unknown) => console.error("[webhook] no se pudo responder:", e instanceof Error ? e.message : e)),
    )
    return c.body(null, 200)
  })

  app.get("/conectar", (c) =>
    c.html(
      pagina(
        "Conecta tu WhatsApp",
        `<p>1. Escribe tu clave (la misma de <code>ZERNIO_WEBHOOK_SECRET</code>) y tu número con código de país.</p>
<form method="post" action="/conectar">
<label>Clave<br><input name="clave" type="password" required autocomplete="off"></label>
<label>Tu WhatsApp<br><input name="tel" placeholder="+57 300 123 4567" required inputmode="tel"></label>
<button>Conectar</button></form>`,
      ),
    ),
  )

  app.post("/conectar", async (c) => {
    const form = await c.req.parseBody()
    const clave = String(form.clave ?? "")
    const tel = String(form.tel ?? "")
    if (!claveCorrecta(clave, config.webhookSecret)) return c.html(pagina("Clave incorrecta", volver()), 401)
    if (soloDigitos(tel).length < 8) return c.html(pagina("Número incompleto", volver()), 400)
    try {
      const base = urlPublica(c.req.header("x-forwarded-proto"), c.req.header("host"))
      const webhook = await registrarWebhook(config.zernioKey, config.webhookSecret, `${base}/webhook`)
      const sandbox = await leerSandbox(config.zernioKey)
      let aviso = ""
      try {
        await iniciarActivacion(config.zernioKey, tel)
      } catch (e) {
        aviso = `<p class="nota">Zernio dijo: ${escapar(e instanceof Error ? e.message : String(e))}. Si tu teléfono ya estaba activado, sigue al paso 3.</p>`
      }
      return c.html(
        pagina(
          "2. Responde el mensaje en tu WhatsApp",
          `<p>Webhook ${webhook === "creado" ? "registrado" : "ya estaba registrado"} en <code>${escapar(base)}/webhook</code>.</p>
<p>Te llegó un mensaje de <strong>${escapar(sandbox.phoneNumber)}</strong>. Respóndelo con cualquier cosa (por ejemplo «ok») y guarda ese número como contacto.</p>${aviso}
<p>3. Cuando hayas respondido, toca:</p>
<form method="post" action="/activar"><input type="hidden" name="clave" value="${escapar(clave)}"><input type="hidden" name="tel" value="${escapar(tel)}"><button>Ya respondí</button></form>`,
        ),
      )
    } catch (e) {
      return c.html(pagina("No se pudo conectar", `<p>${escapar(e instanceof Error ? e.message : String(e))}</p>${volver()}`), 502)
    }
  })

  app.post("/activar", async (c) => {
    const form = await c.req.parseBody()
    const clave = String(form.clave ?? "")
    const tel = String(form.tel ?? "")
    if (!claveCorrecta(clave, config.webhookSecret)) return c.html(pagina("Clave incorrecta", volver()), 401)
    try {
      const sandbox = await leerSandbox(config.zernioKey)
      await abrirConversacion(config.zernioKey, sandbox, tel)
      return c.html(
        pagina(
          "Listo: escríbele «hola» a tu agente",
          `<p>Te llegó otro mensaje de <strong>${escapar(sandbox.phoneNumber)}</strong>. Contéstalo con una pregunta de tu negocio y tu agente responde en segundos.</p>
<p class="nota">El sandbox es gratis: 50 mensajes al día, solo con tu número, por 7 días. Para atender clientes reales conecta un número propio en Zernio.</p>`,
        ),
      )
    } catch (e) {
      return c.html(
        pagina(
          "Todavía no",
          `<p>${escapar(e instanceof Error ? e.message : String(e))}</p><p>Asegúrate de haber respondido el mensaje del sandbox y vuelve a intentar.</p>${volver()}`,
        ),
        502,
      )
    }
  })

  return app
}

function claveCorrecta(dada: string, real: string): boolean {
  if (!real) return false
  const a = Buffer.from(dada)
  const b = Buffer.from(real)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function urlPublica(proto: string | undefined, host: string | undefined): string {
  const p = (proto ?? "https").split(",")[0].trim() || "https"
  return `${p}://${host ?? "localhost"}`
}

export function escapar(t: string): string {
  return t.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch)
}

const volver = () => `<p><a href="/conectar">Volver a intentar</a></p>`

function pagina(titulo: string, cuerpo: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapar(titulo)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#050705;color:#eef2ea}a{color:#a3e635}code{background:#141a14;padding:2px 6px;border-radius:6px}label{display:block;margin:12px 0}input{width:100%;padding:10px;border-radius:10px;border:1px solid #3a4537;background:#0c110c;color:inherit;font:inherit}button{margin-top:12px;padding:12px 20px;border-radius:999px;border:0;background:#a3e635;color:#050705;font-weight:600;font:inherit;cursor:pointer}.nota{opacity:.8;font-size:14px}</style></head>
<body><h1>${escapar(titulo)}</h1>${cuerpo}</body></html>`
}
