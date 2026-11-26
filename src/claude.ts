import Anthropic from "@anthropic-ai/sdk"

export type Turno = { rol: "user" | "assistant"; texto: string }

// La API pide que la conversación empiece con el cliente: se descartan respuestas sueltas al inicio.
export function armarMensajes(historial: Turno[]): Anthropic.MessageParam[] {
  const desde = historial.findIndex((t) => t.rol === "user")
  if (desde === -1) return []
  return historial.slice(desde).map((t) => ({ role: t.rol, content: t.texto }))
}

const RESPALDO = /^claude-(opus-5|sonnet-5-5|fable-5)/

export async function responder(opciones: {
  cliente: Anthropic
  model: string
  sistema: string
  historial: Turno[]
}): Promise<string> {
  const { cliente, model, sistema, historial } = opciones
  const base = {
    model,
    max_tokens: 2000,
    system: sistema,
    messages: armarMensajes(historial),
    output_config: { effort: "low" as const },
  }
  // En Opus 5.5 y Sonnet 5.5, si el modelo declina, la API reintenta sola con otro modelo (fallbacks "default").
  const respuesta = RESPALDO.test(model)
    ? await cliente.beta.messages.create({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
    : await cliente.messages.create(base)

  if (respuesta.stop_reason === "refusal") {
    return "Esa pregunta no la puedo responder por aquí. Si quieres, te paso con una persona del equipo."
  }
  const texto = respuesta.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim()
  return texto || "Perdona, no te entendí bien. ¿Me lo cuentas de otra forma?"
}
