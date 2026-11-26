# Prompt 4 · Nivel 2: memoria que no se borra (Supabase)

Por defecto el agente recuerda los últimos mensajes mientras la app no se reinicie. Para que la memoria sobreviva:

1. Crea un proyecto gratis en supabase.com (uno tuyo, solo para esto).
2. En SQL Editor pega el contenido de `supabase/mensajes.sql` y ejecútalo.
3. En Project Settings > API Keys copia la **secret key** (`sb_secret_...`) y la URL del proyecto.
4. En Railway agrega `SUPABASE_URL` y `SUPABASE_SECRET_KEY`. Al redesplegar, `/health` debe decir `"memoria": "supabase"`.

Si quieres que Claude Code lo haga contigo:

```text
Quiero activar la memoria en Supabase de mi agente (lee CLAUDE.md y src/memoria.ts). Guíame para crear la tabla con supabase/mensajes.sql, configurar SUPABASE_URL y SUPABASE_SECRET_KEY en Railway y comprobar en /health que la memoria quedó en "supabase". La llave secreta solo va en Railway: nunca en el código ni en el navegador.
```
