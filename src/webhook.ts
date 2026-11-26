import type { Turno } from "./claude.js"
import type { Memoria } from "./memoria.js"

// Lo mínimo que usamos del evento message.received de Zernio.
export type EventoZernio = {
  id?: string
  event?: string
  message?: {
    id?: string
    conversationId?: string
    platform?: string
    direction?: string
    text?: string
    sender?: { id?: string; name?: string }
  }
  account?: { id?: string; accountId?: string }
}

export type Accion =
  | { tipo: "ignorar"; motivo: string }
  | { tipo: "responder"; conversacion: string; cuenta: string; texto: string; clave: string }

export function decidir(evento: EventoZernio): Accion {
  if (evento.event !== "message.received") return { tipo: "ignorar", motivo: "otro evento" }
  const m = evento.message
  if (!m || m.direction !== "incoming") return { tipo: "ignorar", motivo: "no es entrante" }
  const conversacion = m.conversationId
  const cuenta = evento.account?.accountId ?? evento.account?.id
  if (!conversacion || !cuenta) return { tipo: "ignorar", motivo: "faltan datos" }
  const clave = evento.id ?? m.id ?? `${conversacion}:${m.text ?? ""}`
  const texto = (m.text ?? "").trim()
  return { tipo: "responder", conversacion, cuenta, texto, clave }
}

// Zernio reintenta si tardamos: cada evento se atiende una sola vez.
export function deduplicador(max = 2000) {
  const vistos = new Set<string>()
  return (clave: string): boolean => {
    if (vistos.has(clave)) return false
    vistos.add(clave)
    if (vistos.size > max) {
      const primero = vistos.values().next().value
      if (primero !== undefined) vistos.delete(primero)
    }
    return true
  }
}

export const SOLO_TEXTO = "Por ahora solo leo mensajes de texto. ¿Me lo escribes, por favor?"

export async function atender(
  accion: Extract<Accion, { tipo: "responder" }>,
  deps: {
    memoria: Memoria
    pensar: (historial: Turno[]) => Promise<string>
    enviar: (conversacion: string, cuenta: string, texto: string, clave: string) => Promise<unknown>
  },
): Promise<string> {
  if (!accion.texto) {
    await deps.enviar(accion.conversacion, accion.cuenta, SOLO_TEXTO, `r-${accion.clave}`)
    return SOLO_TEXTO
  }
  const previo = await deps.memoria.leer(accion.conversacion)
  const historial: Turno[] = [...previo, { rol: "user", texto: accion.texto }]
  const respuesta = await deps.pensar(historial)
  await deps.enviar(accion.conversacion, accion.cuenta, respuesta, `r-${accion.clave}`)
  await deps.memoria.guardar(accion.conversacion, { rol: "user", texto: accion.texto })
  await deps.memoria.guardar(accion.conversacion, { rol: "assistant", texto: respuesta })
  return respuesta
}
