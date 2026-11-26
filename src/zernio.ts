import { createHmac, timingSafeEqual } from "node:crypto"

const API = "https://zernio.com/api/v1"

// X-Zernio-Signature es el HMAC-SHA256 (hex) del cuerpo tal cual llegó.
export function firmaValida(cuerpo: string, firma: string | undefined, secreto: string): boolean {
  if (!firma || !secreto) return false
  const esperada = createHmac("sha256", secreto).update(cuerpo).digest("hex")
  const a = Buffer.from(esperada)
  const b = Buffer.from(firma.trim().toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

export class ErrorZernio extends Error {
  constructor(
    public estado: number,
    public detalle: string,
  ) {
    super(`Zernio respondió ${estado}: ${detalle}`)
  }
}

export async function zernio<T = unknown>(
  llave: string,
  ruta: string,
  opciones: { metodo?: "GET" | "POST" | "DELETE"; cuerpo?: unknown; idempotencia?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${llave}` }
  if (opciones.cuerpo !== undefined) headers["Content-Type"] = "application/json"
  if (opciones.idempotencia) headers["Idempotency-Key"] = opciones.idempotencia
  const r = await fetch(`${API}${ruta}`, {
    method: opciones.metodo ?? (opciones.cuerpo === undefined ? "GET" : "POST"),
    headers,
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  })
  const texto = await r.text()
  if (!r.ok) throw new ErrorZernio(r.status, texto.slice(0, 300))
  return (texto ? JSON.parse(texto) : {}) as T
}

export function enviarMensaje(llave: string, conversacion: string, cuenta: string, texto: string, idempotencia: string) {
  return zernio(llave, `/inbox/conversations/${encodeURIComponent(conversacion)}/messages`, {
    cuerpo: { accountId: cuenta, message: texto },
    idempotencia,
  })
}
