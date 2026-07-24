-- =============================================
-- SEMBRANDO VALORES DIGITAL — Schema Supabase
-- =============================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- -----------------------------------------------
-- Tabla: grupos
-- -----------------------------------------------
create table if not exists grupos (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  facilitador_id  uuid references auth.users(id) on delete set null,
  codigo          text unique,           -- código corto para que participantes se unan
  modulo_activo_id int,                  -- módulo que el facilitador activó para el grupo
  created_at      timestamptz default now()
);

-- Migración: agregar columnas si la tabla ya existe
alter table grupos add column if not exists codigo text unique;
alter table grupos add column if not exists modulo_activo_id int;
-- Generar código para grupos existentes sin código
update grupos set codigo = upper(substring(replace(id::text, '-', ''), 1, 6)) where codigo is null;

-- -----------------------------------------------
-- Tabla: usuarios (perfil extendido de auth.users)
-- -----------------------------------------------
create table if not exists usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  correo      text not null,
  rol         text not null check (rol in ('participante', 'facilitador')),
  grupo_id    uuid references grupos(id) on delete set null,
  aprobado    boolean not null default true,
  created_at  timestamptz default now()
);

-- Migración: agregar columna si la tabla ya existe (aprobación de facilitadores)
alter table usuarios add column if not exists aprobado boolean not null default true;

-- -----------------------------------------------
-- Trigger: crear el perfil en "usuarios" automáticamente al registrarse
-- Se ejecuta con privilegios elevados (security definer), por lo que
-- funciona aunque el correo todavía no esté confirmado y no haya sesión
-- activa — antes se intentaba insertar desde el navegador y RLS lo
-- bloqueaba en ese caso.
-- -----------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := coalesce(new.raw_user_meta_data->>'nombre', '');
  v_rol    text := coalesce(new.raw_user_meta_data->>'rol', 'participante');
begin
  insert into public.usuarios (id, nombre, correo, rol, grupo_id, aprobado)
  values (new.id, v_nombre, new.email, v_rol, null, v_rol <> 'facilitador')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------
-- Tabla: modulos (catálogo — se puede editar desde Supabase)
-- -----------------------------------------------
create table if not exists modulos (
  id                   serial primary key,
  numero               int not null,
  titulo               text not null,
  objetivo_general     text,
  objetivo_especifico  text,
  audio_url            text,
  activo               boolean default true,
  created_at           timestamptz default now()
);

-- -----------------------------------------------
-- Tabla: quiz_preguntas
-- -----------------------------------------------
create table if not exists quiz_preguntas (
  id           uuid primary key default uuid_generate_v4(),
  modulo_id    int references modulos(id) on delete cascade,
  pregunta     text not null,
  opcion_a     text not null,
  opcion_b     text not null,
  opcion_c     text not null,
  opcion_d     text not null,
  respuesta_correcta char(1) not null check (respuesta_correcta in ('a','b','c','d')),
  created_at   timestamptz default now()
);

-- -----------------------------------------------
-- Tabla: quiz_respuestas
-- -----------------------------------------------
create table if not exists quiz_respuestas (
  id           uuid primary key default uuid_generate_v4(),
  usuario_id   uuid references usuarios(id) on delete cascade,
  modulo_id    int references modulos(id) on delete cascade,
  puntaje      int not null,
  aprobado     boolean not null,
  created_at   timestamptz default now(),
  unique (usuario_id, modulo_id)
);

-- -----------------------------------------------
-- Tabla: reflexiones
-- -----------------------------------------------
create table if not exists reflexiones (
  id               uuid primary key default uuid_generate_v4(),
  usuario_id       uuid references usuarios(id) on delete cascade,
  modulo_id        int references modulos(id) on delete cascade,
  pregunta_numero  int not null,
  respuesta_texto  text not null,
  created_at       timestamptz default now(),
  unique (usuario_id, modulo_id, pregunta_numero)
);

-- -----------------------------------------------
-- Tabla: sesiones_grupales
-- -----------------------------------------------
create table if not exists sesiones_grupales (
  id           uuid primary key default uuid_generate_v4(),
  grupo_id     uuid references grupos(id) on delete cascade,
  modulo_id    int references modulos(id) on delete cascade,
  fecha        timestamptz,
  link_reunion text,
  created_at   timestamptz default now(),
  unique (grupo_id, modulo_id)
);

-- -----------------------------------------------
-- Tabla: compromisos
-- -----------------------------------------------
create table if not exists compromisos (
  id                uuid primary key default uuid_generate_v4(),
  grupo_id          uuid references grupos(id) on delete cascade,
  modulo_id         int references modulos(id) on delete cascade,
  compromiso_texto  text not null,
  facilitador_id    uuid references usuarios(id) on delete set null,
  created_at        timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table usuarios          enable row level security;
alter table grupos            enable row level security;
alter table quiz_respuestas   enable row level security;
alter table reflexiones       enable row level security;
alter table sesiones_grupales enable row level security;
alter table compromisos       enable row level security;
alter table modulos           enable row level security;

-- usuarios: cada quien ve su propio perfil; facilitadores ven su grupo
create policy "usuarios_self" on usuarios
  for all using (auth.uid() = id);

create policy "usuarios_grupo_facilitador" on usuarios
  for select using (
    exists (
      select 1 from grupos g
      where g.id = usuarios.grupo_id
        and g.facilitador_id = auth.uid()
    )
  );

-- Admin (luiso@rederac.com): ve y aprueba solicitudes de facilitador
-- Usa una función security definer para evitar que la política de "usuarios"
-- se consulte a sí misma (Postgres no lo permite: "infinite recursion
-- detected in policy for relation").
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and correo = 'luiso@rederac.com'
  );
$$;

drop policy if exists "usuarios_admin_write" on usuarios;
create policy "usuarios_admin_write" on usuarios
  for all using (public.es_admin());

-- grupos: cualquier autenticado puede leer; solo el facilitador modifica
create policy "grupos_read" on grupos
  for select using (auth.role() = 'authenticated');

create policy "grupos_facilitador_write" on grupos
  for all using (facilitador_id = auth.uid());

-- modulos: lectura pública
create policy "modulos_read" on modulos
  for select using (true);

-- quiz_respuestas: cada usuario ve/edita las suyas; facilitador ve las de su grupo
create policy "quiz_self" on quiz_respuestas
  for all using (usuario_id = auth.uid());

-- reflexiones: cada usuario ve/edita las suyas; facilitadores ven las de su grupo
create policy "reflexiones_self" on reflexiones
  for all using (usuario_id = auth.uid());

create policy "reflexiones_facilitador" on reflexiones
  for select using (
    exists (
      select 1 from usuarios u
      join grupos g on g.id = u.grupo_id
      where u.id = reflexiones.usuario_id
        and g.facilitador_id = auth.uid()
    )
  );

-- sesiones_grupales: miembros del grupo leen; facilitador escribe
create policy "sesiones_read" on sesiones_grupales
  for select using (
    exists (
      select 1 from usuarios u
      where u.id = auth.uid() and u.grupo_id = sesiones_grupales.grupo_id
    )
    or exists (
      select 1 from grupos g where g.id = sesiones_grupales.grupo_id and g.facilitador_id = auth.uid()
    )
  );

create policy "sesiones_write" on sesiones_grupales
  for all using (
    exists (
      select 1 from grupos g where g.id = sesiones_grupales.grupo_id and g.facilitador_id = auth.uid()
    )
  );

-- compromisos: todos en el grupo los ven; facilitador escribe
create policy "compromisos_read" on compromisos
  for select using (
    exists (
      select 1 from usuarios u where u.id = auth.uid() and u.grupo_id = compromisos.grupo_id
    )
    or facilitador_id = auth.uid()
  );

create policy "compromisos_write" on compromisos
  for insert with check (facilitador_id = auth.uid());

-- =============================================
-- Datos iniciales: 14 módulos
-- =============================================
insert into modulos (numero, titulo, objetivo_general, objetivo_especifico, audio_url) values
  (1,  'La Persona',               'Reconocer la dignidad intrínseca de cada persona como fundamento de la vida social.', 'Comprender que cada ser humano posee un valor único e irrepetible que debe ser respetado en todos los ámbitos de la vida.', ''),
  (2,  'La Centralidad de la Persona', 'Comprender que la persona debe ser el centro de toda organización social, económica y política.', 'Identificar cómo las estructuras de trabajo pueden estar al servicio del desarrollo integral de la persona.', ''),
  (3,  'La Familia',               'Valorar la familia como núcleo fundamental de la sociedad y apoyo esencial para la vida laboral.', 'Reconocer cómo el equilibrio entre familia y trabajo contribuye al bienestar integral.', ''),
  (4,  'El Amor',                  'Reconocer el amor como fuerza transformadora en las relaciones laborales y sociales.', 'Descubrir cómo el amor al prójimo se expresa en el servicio y la entrega generosa en el trabajo.', ''),
  (5,  'La Educación',             'Valorar la educación continua como camino de crecimiento personal y profesional.', 'Comprender que la formación integral es un derecho y una responsabilidad de toda persona.', ''),
  (6,  'La Participación',         'Promover la participación activa y responsable de todos los miembros del equipo.', 'Entender que la participación es un derecho y un deber que fortalece las organizaciones.', ''),
  (7,  'La Solidaridad',           'Fortalecer la unidad y fraternidad de la organización o equipo de trabajo.', 'Reconocer la importancia de la solidaridad en el desarrollo integral de cada persona, así como en la familia y en la vida laboral.', ''),
  (8,  'La Subsidiaridad',         'Promover que cada persona y grupo pueda resolver sus propios desafíos con autonomía.', 'Comprender el principio de subsidiaridad como garantía de la libertad y responsabilidad de las comunidades.', ''),
  (9,  'El Bien Común',            'Cultivar una visión compartida que oriente las decisiones hacia el beneficio de todos.', 'Identificar cómo el bien común es el horizonte que guía la organización y el trabajo en equipo.', ''),
  (10, 'La Verdad',                'Fortalecer la cultura de la honestidad y la transparencia en las relaciones de trabajo.', 'Reconocer la verdad como fundamento de la confianza y la justicia en los entornos laborales.', ''),
  (11, 'La Libertad',              'Valorar la libertad responsable como condición para el auténtico desarrollo humano.', 'Distinguir la libertad auténtica de la autonomía sin límites, y relacionarla con la responsabilidad.', ''),
  (12, 'La Justicia',              'Promover relaciones de trabajo fundamentadas en la justicia y el reconocimiento de los derechos de cada persona.', 'Identificar formas concretas de justicia en el ámbito laboral y proponer acciones para su promoción.', ''),
  (13, 'La Participación Ciudadana', 'Motivar el ejercicio activo de la ciudadanía como expresión del compromiso con el bien común.', 'Identificar los espacios de participación ciudadana y el papel de los trabajadores en la construcción de una sociedad más justa.', ''),
  (14, 'La Ecología Integral',     'Cultivar una relación responsable y respetuosa con la naturaleza como parte del compromiso con el bien común.', 'Reconocer la ecología integral como un llamado a cuidar nuestra casa común desde la vida cotidiana y el trabajo.', '')
on conflict do nothing;

-- -----------------------------------------------
-- Tabla: compromisos_personales (modo individual)
-- -----------------------------------------------
create table if not exists compromisos_personales (
  id               uuid primary key default uuid_generate_v4(),
  usuario_id       uuid references usuarios(id) on delete cascade,
  modulo_id        int references modulos(id) on delete cascade,
  compromiso_texto text not null,
  cumplido         boolean default false,
  created_at       timestamptz default now()
);

alter table compromisos_personales enable row level security;

create policy "compromisos_personales_self" on compromisos_personales
  for all using (usuario_id = auth.uid());

create policy "compromisos_personales_facilitador" on compromisos_personales
  for select using (
    exists (
      select 1 from usuarios u
      join grupos g on g.id = u.grupo_id
      where u.id = compromisos_personales.usuario_id
        and g.facilitador_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- Migración: aprobación de facilitadores
-- Solo un usuario con rol 'facilitador' Y aprobado = true puede
-- escribir grupos, sesiones o compromisos grupales. Antes de esto,
-- cualquier usuario autenticado (aunque fuera participante) podía
-- crear un grupo llamando directo a la API de Supabase, sin pasar
-- por la UI. Ejecutar este bloque reemplaza esas 3 políticas.
--
-- Usa una función security definer (en vez de un subquery directo a
-- "usuarios") porque estas políticas viven en grupos/sesiones_grupales/
-- compromisos, y "usuarios" tiene su propia política que consulta
-- "grupos" (usuarios_grupo_facilitador) -- un subquery directo aquí
-- forma un ciclo de dos tablas que Postgres rechaza con "infinite
-- recursion detected in policy for relation".
-- -----------------------------------------------
create or replace function public.es_facilitador_aprobado()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol = 'facilitador' and aprobado = true
  );
$$;

drop policy if exists "grupos_facilitador_write" on grupos;
create policy "grupos_facilitador_write" on grupos
  for all using (
    facilitador_id = auth.uid() and public.es_facilitador_aprobado()
  );

drop policy if exists "sesiones_write" on sesiones_grupales;
create policy "sesiones_write" on sesiones_grupales
  for all using (
    exists (
      select 1 from grupos g
      where g.id = sesiones_grupales.grupo_id
        and g.facilitador_id = auth.uid()
    )
    and public.es_facilitador_aprobado()
  );

drop policy if exists "compromisos_write" on compromisos;
create policy "compromisos_write" on compromisos
  for insert with check (
    facilitador_id = auth.uid() and public.es_facilitador_aprobado()
  );

-- -----------------------------------------------
-- Tabla: retroalimentacion_sesiones
-- El facilitador deja un comentario libre por grupo+módulo sobre cómo
-- fue la sesión y/o sugerencias para la app. Solo el propio facilitador
-- y el admin (luiso@rederac.com) pueden leerla.
-- -----------------------------------------------
create table if not exists retroalimentacion_sesiones (
  id             uuid primary key default uuid_generate_v4(),
  grupo_id       uuid references grupos(id) on delete cascade,
  modulo_id      int references modulos(id) on delete cascade,
  facilitador_id uuid references usuarios(id) on delete set null,
  comentario     text not null,
  created_at     timestamptz default now(),
  unique (grupo_id, modulo_id)
);

alter table retroalimentacion_sesiones enable row level security;

create policy "retroalimentacion_facilitador" on retroalimentacion_sesiones
  for all using (
    facilitador_id = auth.uid() and public.es_facilitador_aprobado()
  );

create policy "retroalimentacion_admin_read" on retroalimentacion_sesiones
  for select using (public.es_admin());
