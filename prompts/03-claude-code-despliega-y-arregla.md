# Prompt 3 · Que Claude Code te acompañe a desplegar y a arreglar errores

Abre la carpeta de tu repo en Claude Code y pega:

```text
Este repo es mi agente de WhatsApp (lee CLAUDE.md). Acompáñame a dejarlo funcionando en Railway, paso a paso y esperando mi confirmación en cada uno:

1. Revisa que npm test y npm run typecheck pasen. Si algo falla, explícame por qué en palabras simples y arréglalo.
2. Dime exactamente qué variables debo poner en Railway (Settings > Variables), cuáles son obligatorias y de dónde saco cada valor.
3. Cuando tenga el dominio de Railway, pídeme abrir /health y pegarte lo que dice. Si dice "incompleto", dime qué falta.
4. Guíame por /conectar.
5. Si el agente no responde, pídeme los logs de Railway (Deployments > View logs), léelos y dime la causa y el arreglo.

Nunca me pidas que pegue mis llaves en el chat: solo dime dónde ponerlas.
```
