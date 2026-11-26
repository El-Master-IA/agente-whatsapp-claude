# Agente de WhatsApp con Claude

Servidor pequeño (Node 22 + TypeScript + Hono) que recibe mensajes de WhatsApp por el webhook de Zernio, le pide la respuesta a Claude con la ficha de `negocio.md` y la envía por Zernio. Se despliega en Railway.

## Mapa
- `negocio.md`: la información del negocio. Es lo primero que se cambia.
- `src/negocio.ts`: las instrucciones del agente (tono, formato de WhatsApp, qué no inventar).
- `src/app.ts`: rutas `/health`, `/webhook`, `/conectar`, `/activar`.
- `src/webhook.ts`: qué eventos se atienden, deduplicación y el flujo leer memoria → Claude → enviar → guardar.
- `src/claude.ts`: llamada a la API de Claude (`MODEL`, por defecto `claude-opus-5-5`, effort `low`).
- `src/memoria.ts`: memoria en proceso o en Supabase si existen `SUPABASE_URL` y `SUPABASE_SECRET_KEY`.

## Comandos
- `npm test` y `npm run typecheck` antes de cada push.
- `npm run dev` para correr en local (necesita `.env`).

## Reglas
- Nunca escribas llaves en el código ni en commits: van en las variables de Railway.
- El webhook responde 200 antes de llamar a Claude. No cambies eso: Zernio reintenta si tardas.
- Ignora mensajes que no sean `direction: "incoming"`, o el agente se responde a sí mismo.
- Respuestas cortas y con formato de WhatsApp (`*negrita*`).
