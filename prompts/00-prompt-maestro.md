# Prompt maestro

Abre Claude Code (en la terminal o en la app de escritorio), pega todo el bloque de abajo y responde lo que te pida. Si se corta o cierras Claude, vuelve a pegarlo: retoma desde el paso que falte.

```text
Eres mi asistente para la clase «Claude desde cero». Vas a dejar listo en mi computador todo lo de la clase: mis programas, mi carpeta en el Escritorio, cinco skills para mi negocio, la ficha de mi negocio y mi agente de WhatsApp funcionando en internet. No programo: explícame cada paso en una frase sencilla, en español y de tú.

Cómo trabajas:
- Busca mi Escritorio (puede llamarse Desktop o Escritorio y, en Windows, estar dentro de OneDrive). Si ya existe clase-claude/PROGRESO.md, léelo y sigue desde el primer paso sin marcar. No repitas lo que ya está hecho.
- Haz tú todo lo que se pueda hacer con comandos. Cuando un paso necesite algo mío (crear una cuenta, entrar a una página, aceptar un permiso), abre tú la página en mi navegador, dime exactamente qué tocar y espera a que te escriba "listo".
- Antes de cada paso dime "Paso X de 10" y para qué sirve. Al terminarlo, márcalo en clase-claude/PROGRESO.md.
- Nunca me pidas mis llaves ni contraseñas y nunca las escribas en un archivo. Si pego una llave en este chat, dime que la borre en su página y cree otra.
- No uses sudo. Fuera de clase-claude solo instalas programas. Si un paso falla dos veces, explícame la causa en palabras simples, dime qué hacer y sigue con el siguiente si se puede.

Los pasos:

1. Programas. Revisa si tengo git y gh (GitHub CLI) y, si falta alguno, instálalo:
   - Windows: winget install --id Git.Git -e y winget install --id GitHub.cli -e. Si instalaste algo, dime que cierre y abra Claude Code y vuelva a pegar este prompt.
   - Mac: si falta git, corre xcode-select --install y dime que toque Instalar en la ventana que aparece. Si falta gh, descarga la última versión para macOS de https://github.com/cli/cli/releases y déjala en ~/.local/bin, sin sudo, agregándola a mi PATH.

2. Mi carpeta. Crea en el Escritorio:
   clase-claude/
     CLAUDE.md
     COMO-ABRIR.txt
     PROGRESO.md
     mi-negocio/
       contenido/
     agente-whatsapp/
   - Clona https://github.com/El-Master-IA/agente-whatsapp-claude dentro de clase-claude con el nombre agente-whatsapp. Borra su carpeta .git, haz git init y un primer commit, para que el agente sea mío y no quede conectado al original.
   - CLAUDE.md con estas reglas: soy dueño de un negocio y no programo; háblame en español, de tú y sin palabras técnicas; antes de responder sobre mi negocio lee mi-negocio/ficha-negocio.md; no inventes precios, horarios ni promociones; nunca me pidas mis llaves ni contraseñas.
   - COMO-ABRIR.txt con el comando exacto para abrir Claude Code dentro de clase-claude desde la terminal de mi computador.
   - PROGRESO.md con los 10 pasos de este prompt como casillas.

3. Mis skills. Mueve las carpetas de agente-whatsapp/clase/skills a clase-claude/.claude/skills (cada una con su SKILL.md), borra la carpeta clase del agente y haz commit. Dime en una línea para qué sirve cada skill.

4. La ficha de mi negocio. Si mi-negocio/ficha-negocio.md ya existe, muéstramela y pregúntame si la dejo así. Si no, entrevístame con una pregunta a la vez para llenar estas secciones: Quiénes somos, Horario, Dirección y envíos, Productos y precios, Cómo comprar, Preguntas frecuentes, Tono, Lo que el agente NO sabe o no debe hacer. Si respondo corto, pídeme un ejemplo. Lo que no sepa queda como "Pendiente: preguntar a una persona del equipo". Guárdala en mi-negocio/ficha-negocio.md.

5. Mi negocio en el agente. Reescribe agente-whatsapp/negocio.md con las mismas secciones del ejemplo de la panadería, usando solo los datos de mi ficha. No toques nada más del agente. Haz commit con el mensaje "Mi negocio" y propónme 3 mensajes de prueba.

6. Mis tres llaves. Las saco yo; tú solo abres las páginas y me guías:
   - Anthropic: https://console.anthropic.com → API Keys → Create Key. Que cargue crédito en Billing (US$5 alcanza).
   - Zernio: https://zernio.com → Settings → API Keys → crear una.
   - La clave del webhook: que invente una frase larga sin espacios, por ejemplo mi-negocio-agente-2026-xyz.
   Pídeme guardarlas en una nota mía y escribirte "listo" sin pegarlas aquí.

7. GitHub. Revisa gh auth status. Si no tengo sesión, pídeme abrir otra ventana de la terminal y escribir gh auth login --web --git-protocol https, y espera mi "listo". Antes de subir, revisa que no vayan llaves, contraseñas ni archivos .env. Crea en mi cuenta un repositorio PRIVADO llamado mi-agente-whatsapp con la carpeta agente-whatsapp, súbelo y dame el link.

8. Railway. Lo hago yo en la página; tú abres https://railway.com/new y me guías:
   - Entrar con GitHub → Deploy from GitHub repo → mi-agente-whatsapp. Si no aparece, Configure GitHub App y darle acceso.
   - En Variables pego ANTHROPIC_API_KEY, ZERNIO_API_KEY y ZERNIO_WEBHOOK_SECRET (y, si quiero, NOMBRE_AGENTE con el nombre de mi agente).
   - Settings → Networking → Generate Domain. Pídeme ese dominio (no es secreto) y revisa tú https://MI-DOMINIO/health. Si no dice "estado": "ok", dime qué falta según lo que responda.

9. WhatsApp. Abre https://MI-DOMINIO/conectar y guíame: escribo mi clave del webhook y mi número con código de país (+57…, +52…), respondo "ok" al WhatsApp del sandbox de Zernio, guardo el contacto y toco «Ya respondí». Luego le escribo al agente una pregunta de mi negocio. Si no responde, guíame a Railway → Deployments → View logs y ayúdame a leer el error.

10. Cierre. Muéstrame cómo quedó todo: la carpeta, el link de mi repositorio, el dominio de mi agente y las skills. Deja ese resumen en PROGRESO.md y recuérdame el comando de COMO-ABRIR.txt para volver.

Empieza ya por el primer paso que falte.
```
