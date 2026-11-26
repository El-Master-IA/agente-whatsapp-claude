# Agente de WhatsApp con Claude

Tu negocio contestando WhatsApp solo, con tus precios, tu horario y tu tono. Escribes la ficha de tu negocio, lo despliegas en Railway y en unos minutos le escribes «hola» desde tu celular.

```
Tu cliente escribe por WhatsApp
        ↓
Zernio recibe el mensaje y avisa a tu app (webhook)
        ↓
Tu app en Railway le pasa la conversación y negocio.md a Claude
        ↓
Claude escribe la respuesta → Zernio la envía por WhatsApp
```

## Qué necesitas (10 minutos, antes de empezar)

| Cuenta | Para qué | Costo |
|---|---|---|
| [GitHub](https://github.com/signup) | Guardar tu copia del agente | Gratis |
| [Railway](https://railway.com) (entra **con GitHub**) | Que el agente esté prendido 24/7 | Prueba de US$5 sin tarjeta |
| [Consola de Anthropic](https://console.anthropic.com) | La llave para que Claude responda | Desde US$5 de crédito |
| [Zernio](https://zernio.com) | El canal de WhatsApp (sandbox gratis) | Gratis para probar |

Ojo: entra a Railway con GitHub. Sin esa verificación la cuenta queda en "Limited Trial" y la app no puede hablar con Claude ni con Zernio.

## Paso 1 · Tu copia
Toca **Use this template → Create a new repository** arriba en esta página. Ponle el nombre que quieras.

## Paso 2 · Tu negocio
Edita `negocio.md` en GitHub (ícono del lápiz) con la información de tu negocio. Si no sabes por dónde empezar, usa el [prompt 1](prompts/01-ficha-de-mi-negocio.md) en claude.ai o el comando `/crear-agente` en Claude Code.

## Paso 3 · Las llaves
- **Anthropic:** console.anthropic.com → API Keys → Create Key. Carga crédito en Billing.
- **Zernio:** zernio.com → Settings → API Keys → crea una.
- **Clave del webhook:** inventa una frase larga sin espacios, por ejemplo `mi-panaderia-2026-agente-xyz`. La vas a usar dos veces.

## Paso 4 · Railway
1. railway.com → **New Project → Deploy from GitHub repo** → elige tu copia.
2. En el servicio, **Variables** → agrega:
   - `ANTHROPIC_API_KEY`
   - `ZERNIO_API_KEY`
   - `ZERNIO_WEBHOOK_SECRET` (tu clave del webhook)
   - Opcional: `NOMBRE_AGENTE`, `MODEL`
3. **Settings → Networking → Generate Domain**. Te da algo como `https://mi-agente.up.railway.app`.
4. Abre `https://TU-DOMINIO/health`. Debe decir `"estado": "ok"`. Si dice `incompleto`, te dice qué variable falta.

## Paso 5 · Conecta tu WhatsApp
1. Abre `https://TU-DOMINIO/conectar`.
2. Escribe tu clave del webhook y tu número con código de país (`+57 300...`).
3. Te llega un WhatsApp del número del sandbox de Zernio: respóndelo con «ok» y guarda el contacto.
4. Toca **Ya respondí**. Te llega otro mensaje.
5. Contéstalo con una pregunta de tu negocio («¿cuánto cuesta…?»). Tu agente responde.

## Si algo falla

| Síntoma | Causa probable | Arreglo |
|---|---|---|
| `/health` dice `incompleto` | Falta una variable | Agrégala en Railway → Variables |
| No llega respuesta y en los logs dice `firma inválida` | La clave del webhook no coincide | Usa la misma en Railway y en `/conectar` |
| Logs: `401` o `authentication_error` de Anthropic | Llave mal copiada o sin crédito | Crea otra llave y carga crédito |
| Logs: `Zernio respondió 401` | Llave de Zernio mal copiada | Revisa `ZERNIO_API_KEY` |
| No pasa nada al escribir | No respondiste el mensaje de activación o pasaron 24 h | Repite `/conectar` |
| Railway no conecta con nada | Cuenta en "Limited Trial" | Entra a Railway con GitHub |
| Responde cosas que no son de tu negocio | La ficha está corta | Completa `negocio.md` y haz push |

Para ver los logs: Railway → tu servicio → **Deployments → View logs**.

## Límites del sandbox
El sandbox de Zernio es para probar: un número compartido, solo tu teléfono, 50 mensajes al día y la sesión dura 7 días. Para atender clientes reales conecta en Zernio tu propio número de WhatsApp Business.

## Nivel 2
- Memoria que no se borra con Supabase: [prompt 4](prompts/04-memoria-con-supabase.md).
- Personalidades listas (vendedor, citas, soporte): [prompt 2](prompts/02-personalidades.md).
- Claude Code como copiloto para desplegar y depurar: [prompt 3](prompts/03-claude-code-despliega-y-arregla.md).
- Modelo: por defecto `claude-opus-5-5`. Con `MODEL=claude-haiku-5-5` gastas mucho menos, con respuestas algo más simples.

## Cómo está hecho
Node 22, TypeScript y [Hono](https://hono.dev). El webhook verifica la firma de Zernio (`X-Zernio-Signature`), responde 200 de inmediato, ignora mensajes salientes y repetidos, y después llama a Claude. `npm test` cubre ese flujo.

## Créditos
Hecho por El Master IA para la clase en vivo «Claude desde cero». Ideas tomadas de [OpenWA](https://github.com/rmyndharis/OpenWA) (gateway de WhatsApp autohospedado) y de WhatsApp AgentKit de Todo de IA (agente creado por entrevista con Claude Code). Si quieres conectar WhatsApp sin la API oficial, mira OpenWA, [Evolution API](https://github.com/evolution-foundation/evolution-api) o [WAHA](https://github.com/devlikeapro/waha); ten en cuenta que usan WhatsApp Web y tu número puede ser bloqueado.

Licencia MIT.
