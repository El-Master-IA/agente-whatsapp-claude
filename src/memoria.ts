import type { Turno } from "./claude.js"

export interface Memoria {
  leer(conversacion: string): Promise<Turno[]>
  guardar(conversacion: string, turno: Turno): Promise<void>
}

// Nivel 1: memoria en el proceso. Se borra si Railway reinicia la app; para la clase basta.
export function memoriaEnProceso(turnos: number, maxConversaciones = 500): Memoria {
  const datos = new Map<string, Turno[]>()
  return {
    async leer(c) {
      return [...(datos.get(c) ?? [])]
    },
    async guardar(c, t) {
      const lista = datos.get(c) ?? []
      lista.push(t)
      datos.delete(c) // la más reciente queda al final
      datos.set(c, lista.slice(-turnos))
      if (datos.size > maxConversaciones) {
        const vieja = datos.keys().next().value
        if (vieja !== undefined) datos.delete(vieja)
      }
    },
  }
}

// Nivel 2: tabla «mensajes» en tu propio Supabase (ver supabase/mensajes.sql). Solo desde el servidor.
export function memoriaSupabase(url: string, llave: string, turnos: number): Memoria {
  const headers = { apikey: llave, "Content-Type": "application/json" }
  return {
    async leer(c) {
      const q = new URLSearchParams({
        select: "rol,texto",
        conversacion: `eq.${c}`,
        order: "creado_en.desc",
        limit: String(turnos),
      })
      const r = await fetch(`${url}/rest/v1/mensajes?${q}`, { headers })
      if (!r.ok) throw new Error(`Supabase respondió ${r.status} al leer`)
      const filas = (await r.json()) as { rol: Turno["rol"]; texto: string }[]
      return filas.reverse().map((f) => ({ rol: f.rol, texto: f.texto }))
    },
    async guardar(c, t) {
      const r = await fetch(`${url}/rest/v1/mensajes`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ conversacion: c, rol: t.rol, texto: t.texto }),
      })
      if (!r.ok) throw new Error(`Supabase respondió ${r.status} al guardar`)
    },
  }
}
