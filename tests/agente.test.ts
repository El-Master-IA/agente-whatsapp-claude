import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { crearApp, escapar, urlPublica } from "../src/app.js"
import { armarMensajes, type Turno } from "../src/claude.js"
import { leerConfig, salud } from "../src/config.js"
import { memoriaEnProceso } from "../src/memoria.js"
import { decidir, deduplicador } from "../src/webhook.js"
import { firmaValida } from "../src/zernio.js"

const SECRETO = "secreto-de-prueba"
const firmar = (cuerpo: string) => createHmac("sha256", SECRETO).update(cuerpo).digest("hex")

const evento = (extra: Record<string, unknown> = {}) => ({
  id: "evt_1",
  event: "message.received",
  message: { id: "m1", conversationId: "conv1", platform: "whatsapp", direction: "incoming", text: "¿Cuánto cuesta?", sender: { id: "57300", name: "Ana" } },
  account: { id: "acc1", accountId: "acc1" },
  ...extra,
})

function preparar() {
  const enviados: { conversacion: string; texto: string; clave: string }[] = []
  const vistos: Turno[][] = []
  const tareas: Promise<unknown>[] = []
  const config = { ...leerConfig({}), anthropicKey: "x", zernioKey: "z", webhookSecret: SECRETO }
  const app = crearApp({
    config,
    memoria: memoriaEnProceso(10),
    pensar: async (h) => {
      vistos.push(h)
      return `respuesta ${h.length}`
    },
    enviar: async (conversacion, _cuenta, texto, clave) => {
      enviados.push({ conversacion, texto, clave })
    },
    esperar: (t) => void tareas.push(t),
  })
  const post = (cuerpo: string, firma = firmar(cuerpo)) =>
    app.request("/webhook", { method: "POST", body: cuerpo, headers: { "X-Zernio-Signature": firma } })
  return { app, post, enviados, vistos, listo: () => Promise.all(tareas) }
}

describe("firma del webhook", () => {
  it("acepta la firma correcta y rechaza otra", () => {
    const cuerpo = JSON.stringify(evento())
    expect(firmaValida(cuerpo, firmar(cuerpo), SECRETO)).toBe(true)
    expect(firmaValida(cuerpo, firmar(cuerpo + " "), SECRETO)).toBe(false)
    expect(firmaValida(cuerpo, undefined, SECRETO)).toBe(false)
    expect(firmaValida(cuerpo, firmar(cuerpo), "")).toBe(false)
  })

  it("responde 401 si la firma no coincide y no contesta nada", async () => {
    const t = preparar()
    const r = await t.post(JSON.stringify(evento()), "mala")
    expect(r.status).toBe(401)
    await t.listo()
    expect(t.enviados).toHaveLength(0)
  })
})

describe("qué eventos atiende", () => {
  it("ignora mensajes salientes y otros eventos", () => {
    expect(decidir({ ...evento(), message: { ...evento().message, direction: "outgoing" } }).tipo).toBe("ignorar")
    expect(decidir({ ...evento(), event: "message.sent" }).tipo).toBe("ignorar")
    expect(decidir({ event: "message.received" }).tipo).toBe("ignorar")
  })

  it("usa account.id si no viene accountId", () => {
    const a = decidir({ ...evento(), account: { id: "solo-id" } })
    expect(a.tipo === "responder" && a.cuenta).toBe("solo-id")
  })

  it("el deduplicador deja pasar cada clave una vez", () => {
    const nuevo = deduplicador(2)
    expect(nuevo("a")).toBe(true)
    expect(nuevo("a")).toBe(false)
    expect(nuevo("b")).toBe(true)
    expect(nuevo("c")).toBe(true)
    expect(nuevo("a")).toBe(true) // salió por tamaño
  })
})

describe("flujo completo", () => {
  it("responde 200, contesta una sola vez aunque Zernio reintente y recuerda la conversación", async () => {
    const t = preparar()
    const cuerpo = JSON.stringify(evento())
    expect((await t.post(cuerpo)).status).toBe(200)
    expect((await t.post(cuerpo)).status).toBe(200) // reintento
    await t.listo()
    expect(t.enviados).toEqual([{ conversacion: "conv1", texto: "respuesta 1", clave: "r-evt_1" }])

    const segundo = JSON.stringify(evento({ id: "evt_2", message: { ...evento().message, id: "m2", text: "¿Y envíos?" } }))
    await t.post(segundo)
    await t.listo()
    expect(t.vistos[1].map((x) => x.rol)).toEqual(["user", "assistant", "user"])
    expect(t.enviados[1].texto).toBe("respuesta 3")
  })

  it("si llega audio o imagen sin texto, pide que escriban", async () => {
    const t = preparar()
    await t.post(JSON.stringify(evento({ message: { ...evento().message, text: "" } })))
    await t.listo()
    expect(t.vistos).toHaveLength(0)
    expect(t.enviados[0].texto).toMatch(/solo leo mensajes de texto/)
  })
})

describe("piezas sueltas", () => {
  it("la conversación para Claude empieza siempre con el cliente", () => {
    expect(armarMensajes([{ rol: "assistant", texto: "hola" }, { rol: "user", texto: "x" }])).toEqual([{ role: "user", content: "x" }])
    expect(armarMensajes([{ rol: "assistant", texto: "hola" }])).toEqual([])
  })

  it("la memoria guarda solo los últimos turnos", async () => {
    const m = memoriaEnProceso(2)
    for (const texto of ["1", "2", "3"]) await m.guardar("c", { rol: "user", texto })
    expect((await m.leer("c")).map((t) => t.texto)).toEqual(["2", "3"])
  })

  it("/health dice qué variable falta", async () => {
    expect(salud(leerConfig({})).faltan).toEqual(["ANTHROPIC_API_KEY", "ZERNIO_API_KEY", "ZERNIO_WEBHOOK_SECRET"])
    const app = crearApp({ config: leerConfig({}), memoria: memoriaEnProceso(2) })
    const r = await app.request("/health")
    expect(r.status).toBe(200)
    expect((await r.json()).estado).toBe("incompleto")
  })

  it("/conectar rechaza una clave equivocada", async () => {
    const t = preparar()
    const r = await t.app.request("/conectar", { method: "POST", body: new URLSearchParams({ clave: "otra", tel: "+573001234567" }) })
    expect(r.status).toBe(401)
  })

  it("arma la URL pública y escapa HTML", () => {
    expect(urlPublica("https,http", "mi-app.up.railway.app")).toBe("https://mi-app.up.railway.app")
    expect(escapar(`<b>"x"</b>`)).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt;")
  })
})
