-- Nivel 2: memoria que sobrevive a reinicios. Pégalo en Supabase > SQL Editor de TU proyecto.
create table if not exists public.mensajes (
  id bigint generated always as identity primary key,
  conversacion text not null,
  rol text not null check (rol in ('user', 'assistant')),
  texto text not null,
  creado_en timestamptz not null default now()
);

create index if not exists mensajes_conversacion_idx on public.mensajes (conversacion, creado_en desc);

-- RLS activo y sin políticas: nadie entra con la llave pública. Solo tu servidor, con la llave secreta.
alter table public.mensajes enable row level security;
