import { serve } from "@hono/node-server"
import { crearApp } from "./app.js"
import { leerConfig, salud } from "./config.js"

const config = leerConfig()
const estado = salud(config)
const port = Number(process.env.PORT) || 3000

serve({ fetch: crearApp({ config }).fetch, port }, () => {
  console.log(`Agente escuchando en el puerto ${port} · modelo ${config.model} · memoria ${estado.memoria}`)
  if (estado.faltan.length) console.warn(`Faltan variables: ${estado.faltan.join(", ")}`)
})
