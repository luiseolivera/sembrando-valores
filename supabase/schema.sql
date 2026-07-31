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
alter table grupos add column if not exists logo_empresa_url text;
alter table grupos add column if not exists es_empresa boolean not null default false;
-- Generar código para grupos existentes sin código
update grupos set codigo = upper(substring(replace(id::text, '-', ''), 1, 6)) where codigo is null;

-- Candado: solo un grupo marcado como empresa (por el admin) puede tener logo
alter table grupos drop constraint if exists grupos_logo_solo_empresa;
alter table grupos add constraint grupos_logo_solo_empresa
  check (logo_empresa_url is null or es_empresa = true);

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
  created_at   timestamptz default now()
);

-- Migración: antes solo se permitía una sesión por grupo+módulo.
-- Ahora el facilitador puede ofrecer varios horarios para el mismo módulo.
alter table sesiones_grupales drop constraint if exists sesiones_grupales_grupo_id_modulo_id_key;

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

-- solo el admin puede marcar/desmarcar un grupo como empresa
create policy "grupos_admin_write" on grupos
  for all using (public.es_admin());

-- modulos: lectura pública
create policy "modulos_read" on modulos
  for select using (true);

-- quiz_respuestas: cada usuario ve/edita las suyas; facilitador ve las de su grupo
create policy "quiz_self" on quiz_respuestas
  for all using (usuario_id = auth.uid());

create policy "quiz_facilitador" on quiz_respuestas
  for select using (
    exists (
      select 1 from usuarios u
      join grupos g on g.id = u.grupo_id
      where u.id = quiz_respuestas.usuario_id
        and g.facilitador_id = auth.uid()
    )
  );

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

create policy "retroalimentacion_admin_delete" on retroalimentacion_sesiones
  for delete using (public.es_admin());

-- -----------------------------------------------
-- Tabla: constancias
-- Se genera un registro automáticamente cuando alguien completa los
-- 14 módulos, pero queda "sin liberar" hasta que el admin la libera
-- manualmente (una vez arreglado el pago). El propio usuario puede ver
-- su estado, pero NO puede liberarla — no hay política de update para
-- "self", solo para el admin.
-- -----------------------------------------------
create table if not exists constancias (
  id           uuid primary key default uuid_generate_v4(),
  usuario_id   uuid references usuarios(id) on delete cascade unique,
  liberada     boolean not null default false,
  created_at   timestamptz default now(),
  liberada_at  timestamptz
);

alter table constancias enable row level security;

create policy "constancias_self_select" on constancias
  for select using (usuario_id = auth.uid());

create policy "constancias_self_insert" on constancias
  for insert with check (usuario_id = auth.uid());

create policy "constancias_admin_all" on constancias
  for all using (public.es_admin());

-- -----------------------------------------------
-- Tabla: comentarios_reflexion
-- El facilitador deja una reacción rápida y/o un comentario sobre la
-- reflexión que un participante de su grupo registró para un módulo.
-- El participante puede leer lo que le dejaron, pero no editarlo.
-- -----------------------------------------------
create table if not exists comentarios_reflexion (
  id             uuid primary key default uuid_generate_v4(),
  usuario_id     uuid references usuarios(id) on delete cascade,
  modulo_id      int references modulos(id) on delete cascade,
  facilitador_id uuid references usuarios(id) on delete set null,
  comentario     text,
  reaccion       text,
  created_at     timestamptz default now(),
  unique (usuario_id, modulo_id)
);

alter table comentarios_reflexion enable row level security;

create policy "comentarios_reflexion_facilitador" on comentarios_reflexion
  for all using (
    facilitador_id = auth.uid()
    and exists (
      select 1 from usuarios u
      join grupos g on g.id = u.grupo_id
      where u.id = comentarios_reflexion.usuario_id
        and g.facilitador_id = auth.uid()
    )
  );

create policy "comentarios_reflexion_participante" on comentarios_reflexion
  for select using (usuario_id = auth.uid());

-- -----------------------------------------------
-- Tabla: sesion_elecciones
-- Cuando el facilitador ofrece varias sesiones (horarios) para el
-- mismo módulo, cada participante elige una. Solo puede tener una
-- elección activa por módulo (unique usuario_id+modulo_id) — volver a
-- elegir reemplaza la anterior.
-- -----------------------------------------------
create table if not exists sesion_elecciones (
  id         uuid primary key default uuid_generate_v4(),
  usuario_id uuid references usuarios(id) on delete cascade,
  sesion_id  uuid references sesiones_grupales(id) on delete cascade,
  modulo_id  int references modulos(id) on delete cascade,
  created_at timestamptz default now(),
  unique (usuario_id, modulo_id)
);

alter table sesion_elecciones enable row level security;

create policy "sesion_elecciones_self" on sesion_elecciones
  for all using (usuario_id = auth.uid());

create policy "sesion_elecciones_facilitador" on sesion_elecciones
  for select using (
    exists (
      select 1 from usuarios u
      join grupos g on g.id = u.grupo_id
      where u.id = sesion_elecciones.usuario_id
        and g.facilitador_id = auth.uid()
    )
  );

-- =====================================================================
-- Migración: sesión grupal obligatoria antes de compromisos, y
-- solicitud/asignación de facilitador para participantes individuales.
-- =====================================================================

-- Sesión puede ser para un grupo entero (grupo_id) o para un individuo
-- puntual (usuario_id) — nunca ambos a la vez.
alter table sesiones_grupales add column if not exists usuario_id uuid references usuarios(id) on delete cascade;

-- Facilitador persistente de un participante individual (una vez que
-- alguno atiende su primera solicitud de sesión, se mantiene para los
-- módulos siguientes).
alter table usuarios add column if not exists facilitador_asignado_id uuid references usuarios(id) on delete set null;

-- Directorio: cualquier autenticado puede ver nombre/correo de los
-- facilitadores aprobados, para poder elegir uno al solicitar sesión.
create policy "usuarios_directorio_facilitadores" on usuarios
  for select using (rol = 'facilitador' and aprobado = true);

-- Centraliza "¿soy responsable de este participante?" (su grupo o su
-- facilitador asignado individual) — se usa en varias políticas nuevas
-- para evitar repetir/arriesgar recursión.
create or replace function public.es_responsable_de(target_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios u
    left join grupos g on g.id = u.grupo_id
    where u.id = target_usuario_id
      and (u.facilitador_asignado_id = auth.uid() or g.facilitador_id = auth.uid())
  );
$$;

-- sesiones_grupales: ampliar lectura/escritura para cubrir también
-- sesiones dirigidas a un individuo (usuario_id), sin tocar el caso de
-- grupo que ya funcionaba.
drop policy if exists "sesiones_read" on sesiones_grupales;
create policy "sesiones_read" on sesiones_grupales
  for select using (
    (grupo_id is not null and exists (
      select 1 from usuarios u where u.id = auth.uid() and u.grupo_id = sesiones_grupales.grupo_id
    ))
    or (grupo_id is not null and exists (
      select 1 from grupos g where g.id = sesiones_grupales.grupo_id and g.facilitador_id = auth.uid()
    ))
    or usuario_id = auth.uid()
    or (usuario_id is not null and public.es_responsable_de(usuario_id))
  );

drop policy if exists "sesiones_write" on sesiones_grupales;
create policy "sesiones_write" on sesiones_grupales
  for all using (
    public.es_facilitador_aprobado()
    and (
      (grupo_id is not null and exists (
        select 1 from grupos g where g.id = sesiones_grupales.grupo_id and g.facilitador_id = auth.uid()
      ))
      or (usuario_id is not null and public.es_responsable_de(usuario_id))
    )
  );

-- -----------------------------------------------
-- Tabla: solicitudes_sesion
-- El participante pide sesión cuando todavía no hay ninguna para su
-- módulo. Si elige un facilitador específico (o ya tiene uno asignado),
-- va directo a su bandeja; si elige "cualquiera", queda en una bolsa
-- común visible a todos los facilitadores aprobados hasta que alguno
-- la atienda.
-- -----------------------------------------------
create table if not exists solicitudes_sesion (
  id             uuid primary key default uuid_generate_v4(),
  usuario_id     uuid references usuarios(id) on delete cascade,
  modulo_id      int references modulos(id) on delete cascade,
  facilitador_id uuid references usuarios(id) on delete set null,
  estado         text not null default 'pendiente' check (estado in ('pendiente', 'atendida')),
  atendida_por   uuid references usuarios(id) on delete set null,
  created_at     timestamptz default now(),
  unique (usuario_id, modulo_id)
);

alter table solicitudes_sesion enable row level security;

create policy "solicitudes_sesion_self_select" on solicitudes_sesion
  for select using (usuario_id = auth.uid());

create policy "solicitudes_sesion_self_insert" on solicitudes_sesion
  for insert with check (usuario_id = auth.uid());

create policy "solicitudes_sesion_facilitador_select" on solicitudes_sesion
  for select using (
    facilitador_id = auth.uid()
    or (facilitador_id is null and estado = 'pendiente')
  );

create policy "solicitudes_sesion_facilitador_update" on solicitudes_sesion
  for update using (
    public.es_facilitador_aprobado()
    and (facilitador_id = auth.uid() or facilitador_id is null)
  );

-- El superadmin ve todas las solicitudes (propias de un facilitador
-- específico o de la bolsa común) para poder darles seguimiento desde /admin.
create policy "solicitudes_sesion_admin_select" on solicitudes_sesion
  for select using (public.es_admin());

-- Permite a un facilitador aprobado ver nombre/correo de un participante
-- que le tiene (o le dejó en la bolsa común) una solicitud de sesión
-- pendiente — sin esto, el panel de solicitudes no puede mostrar quién es.
create policy "usuarios_facilitador_ve_solicitante" on usuarios
  for select using (
    public.es_facilitador_aprobado()
    and exists (
      select 1 from solicitudes_sesion s
      where s.usuario_id = usuarios.id
        and s.estado = 'pendiente'
        and (s.facilitador_id = auth.uid() or s.facilitador_id is null)
    )
  );

-- Al atender una solicitud pendiente (propia o de la bolsa común), el
-- facilitador todavía no es "responsable" del participante según
-- es_responsable_de() — hace falta permitir, puntualmente, la sesión que
-- resuelve esa solicitud y la asignación que la formaliza.
create policy "sesiones_insert_por_solicitud" on sesiones_grupales
  for insert with check (
    public.es_facilitador_aprobado()
    and usuario_id is not null
    and exists (
      select 1 from solicitudes_sesion s
      where s.usuario_id = sesiones_grupales.usuario_id
        and s.modulo_id = sesiones_grupales.modulo_id
        and s.estado = 'pendiente'
        and (s.facilitador_id = auth.uid() or s.facilitador_id is null)
    )
  );

create policy "usuarios_facilitador_asigna" on usuarios
  for update using (
    public.es_facilitador_aprobado()
    and facilitador_asignado_id is null
    and exists (
      select 1 from solicitudes_sesion s
      where s.usuario_id = usuarios.id
        and s.estado = 'pendiente'
        and (s.facilitador_id = auth.uid() or s.facilitador_id is null)
    )
  )
  with check (facilitador_asignado_id = auth.uid());

-- -----------------------------------------------
-- Tabla: habilitaciones_compromisos
-- La existencia de una fila = el facilitador confirmó (tras la sesión)
-- que este participante puede registrar sus compromisos de ese módulo.
-- El participante nunca puede insertarla — solo el facilitador
-- responsable de esa persona (su grupo o su asignación individual).
-- -----------------------------------------------
create table if not exists habilitaciones_compromisos (
  id             uuid primary key default uuid_generate_v4(),
  usuario_id     uuid references usuarios(id) on delete cascade,
  modulo_id      int references modulos(id) on delete cascade,
  facilitador_id uuid references usuarios(id) on delete set null,
  created_at     timestamptz default now(),
  unique (usuario_id, modulo_id)
);

alter table habilitaciones_compromisos enable row level security;

create policy "habilitaciones_compromisos_self_select" on habilitaciones_compromisos
  for select using (usuario_id = auth.uid());

create policy "habilitaciones_compromisos_facilitador" on habilitaciones_compromisos
  for all using (
    public.es_facilitador_aprobado() and public.es_responsable_de(usuario_id)
  );

-- =====================================================================
-- Migración: eliminar el concepto de "sesión individual". Todas las
-- sesiones son grupales — un participante sin grupo se integra a uno,
-- ya sea porque el facilitador lo asigna al atender su solicitud, o
-- porque se une con un código de grupo. No debe existir otra modalidad.
-- =====================================================================

-- Limpia cualquier sesión huérfana que hubiera quedado dirigida a un
-- individuo (usuario_id sin grupo_id) — ya no es una modalidad válida.
delete from sesiones_grupales where grupo_id is null;

drop policy if exists "sesiones_insert_por_solicitud" on sesiones_grupales;
drop policy if exists "usuarios_facilitador_asigna" on usuarios;
drop policy if exists "sesiones_read" on sesiones_grupales;
drop policy if exists "sesiones_write" on sesiones_grupales;

-- "Responsable de" un participante ahora solo puede significar "es el
-- facilitador de su grupo" — ya no existe la asignación individual.
-- Se redefine antes de soltar la columna para no dejar, ni un instante,
-- una función activa que referencie una columna que va a desaparecer.
create or replace function public.es_responsable_de(target_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios u
    join grupos g on g.id = u.grupo_id
    where u.id = target_usuario_id
      and g.facilitador_id = auth.uid()
  );
$$;

alter table sesiones_grupales drop column if exists usuario_id;
alter table usuarios drop column if exists facilitador_asignado_id;

-- Vuelve a las políticas originales de sesiones_grupales (solo por grupo).
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
      select 1 from grupos g
      where g.id = sesiones_grupales.grupo_id
        and g.facilitador_id = auth.uid()
    )
    and public.es_facilitador_aprobado()
  );

-- Permite al facilitador asignar a un grupo propio al participante que
-- le dejó una solicitud pendiente (a él directamente o a la bolsa
-- común) — así es como se "va formando el grupo" con quienes solicitan.
create policy "usuarios_facilitador_asigna_grupo" on usuarios
  for update using (
    public.es_facilitador_aprobado()
    and exists (
      select 1 from solicitudes_sesion s
      where s.usuario_id = usuarios.id
        and s.estado = 'pendiente'
        and (s.facilitador_id = auth.uid() or s.facilitador_id is null)
    )
  )
  with check (
    exists (
      select 1 from grupos g where g.id = usuarios.grupo_id and g.facilitador_id = auth.uid()
    )
  );
