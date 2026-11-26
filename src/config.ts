// Lee las variables de entorno una sola vez y dice qué falta.

export type Config = {
  anthropicKey: string
  zernioKey: string
  webhookSecret: string
  model: string
  nombreAgente: string
  memoriaTurnos: number
  supabaseUrl: string
  supabaseKey: string
}

export function leerConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const limpio = (v: string | undefined) => (v ?? "").trim()
  const turnos = Number.parseInt(limpio(env.MEMORIA_TURNOS) || "12", 10)
  return {
    anthropicKey: limpio(env.ANTHROPIC_API_KEY),
    zernioKey: limpio(env.ZERNIO_API_KEY),
    webhookSecret: limpio(env.ZERNIO_WEBHOOK_SECRET),
    model: limpio(env.MODEL) || "claude-opus-5-5",
    nombreAgente: limpio(env.NOMBRE_AGENTE) || "Sofía",
    memoriaTurnos: Number.isFinite(turnos) && turnos > 0 ? Math.min(turnos, 40) : 12,
    supabaseUrl: limpio(env.SUPABASE_URL).replace(/\/+$/, ""),
    supabaseKey: limpio(env.SUPABASE_SECRET_KEY),
  }
}

export type Salud = { estado: "ok" | "incompleto"; faltan: string[]; memoria: "supabase" | "en-proceso"; modelo: string }

export function salud(c: Config): Salud {
  const faltan: string[] = []
  if (!c.anthropicKey) faltan.push("ANTHROPIC_API_KEY")
  if (!c.zernioKey) faltan.push("ZERNIO_API_KEY")
  if (!c.webhookSecret) faltan.push("ZERNIO_WEBHOOK_SECRET")
  return {
    estado: faltan.length ? "incompleto" : "ok",
    faltan,
    memoria: c.supabaseUrl && c.supabaseKey ? "supabase" : "en-proceso",
    modelo: c.model,
  }
}
