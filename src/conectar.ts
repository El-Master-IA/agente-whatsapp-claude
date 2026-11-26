import { zernio } from "./zernio.js"

// Pasos de conexión con el sandbox de WhatsApp de Zernio, para hacerlos desde el navegador.

type Sandbox = { phoneNumber: string; accountId: string; template: { name: string; language: string } }

export function soloDigitos(tel: string): string {
  return tel.replace(/\D/g, "")
}

export async function registrarWebhook(llave: string, secreto: string, url: string) {
  const actuales = await zernio<unknown>(llave, "/webhooks/settings").catch(() => null)
  if (actuales && JSON.stringify(actuales).includes(`"${url}"`)) return "ya-estaba"
  await zernio(llave, "/webhooks/settings", {
    cuerpo: { name: "agente-whatsapp-claude", url, events: ["message.received"], secret: secreto },
  })
  return "creado"
}

export async function leerSandbox(llave: string): Promise<Sandbox> {
  const r = await zernio<{ sandbox?: Sandbox }>(llave, "/phone-numbers")
  if (!r.sandbox) throw new Error("Tu cuenta de Zernio no tiene el sandbox de WhatsApp disponible.")
  return r.sandbox
}

export async function iniciarActivacion(llave: string, tel: string) {
  return zernio<{ session?: { status?: string }; sandboxNumber?: string }>(llave, "/whatsapp/sandbox/sessions", {
    cuerpo: { phone: `+${soloDigitos(tel)}` },
  })
}

export async function abrirConversacion(llave: string, sandbox: Sandbox, tel: string) {
  return zernio(llave, "/inbox/conversations", {
    cuerpo: {
      accountId: sandbox.accountId,
      participantId: soloDigitos(tel),
      templateName: sandbox.template.name,
      templateLanguage: sandbox.template.language,
      templateParams: [],
    },
  })
}
