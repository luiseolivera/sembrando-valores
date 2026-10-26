# Operación de la app

Cómo se opera la infraestructura de `sembrando-valores`. Aquí se dice **dónde** están los secretos, nunca sus valores. **Este repositorio es público.**

## Servicios

| Servicio | Para qué | Dónde se administra |
|---|---|---|
| Supabase (ref `oxodgtprmkulcihfganw`) | Usuarios, grupos, avance, reflexiones y compromisos | Organización probable de MMT (*por confirmar*, ver `mi-contexto\proyectos\supabase.md`) |
| Vercel | Publica https://s-valores.vercel.app. *Por confirmar:* si publica solo con cada push a `master` | Equipo de Vercel de Luiso |
| GitHub | Código: `luiseolivera/sembrando-valores` (**público**) | — |

## Secretos (solo los nombres)

- **Vercel → Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicas por diseño; la seguridad depende de RLS).
- Las llaves las captura Luiso. No se piden, no se copian a archivos y no se escriben en el chat.

## Supabase

- Esquema e índices en `supabase/schema.sql`. Antes de cambiarlo o de modificar datos hay que tener la autorización de Luiso. Cada tabla nueva en `public` lleva su `grant` explícito.
- Plan gratis: vigilar el consumo de Disk IO (por eso se agregaron índices el 2026-09-11).
