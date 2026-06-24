# Sembrando Valores Digital — MMT

Aplicación web del programa **Sembrando Valores** de Misioneros en el Mundo del Trabajo (MMT). Permite a grupos de trabajo vivir el programa de 14 módulos de formación en valores de manera digital: ver videos, responder quizzes, escribir reflexiones personales y registrar compromisos grupales.

## Stack tecnológico

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend/Auth/DB:** Supabase
- **Íconos:** Lucide React
- **Ruteo:** React Router DOM v6

---

## Instalación local

### 1. Requisitos previos

- Node.js 18 o superior
- npm o yarn
- Cuenta en [supabase.com](https://supabase.com) (gratis)

### 2. Clonar e instalar

```bash
git clone <url-del-repo>
cd sembrando-valores-digital
npm install
```

### 3. Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Las credenciales las encuentras en: **Supabase Dashboard → Settings → API**.

### 4. Configurar Supabase

#### a) Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Espera que termine de inicializarse.

#### b) Ejecutar el schema

1. En el dashboard de Supabase, ve a **SQL Editor**.
2. Copia todo el contenido de `supabase/schema.sql`.
3. Pégalo en el editor y haz clic en **Run**.

Esto creará las 8 tablas, las políticas de Row Level Security y los 14 módulos iniciales.

#### c) Configurar Auth

En **Authentication → Settings**:

- Habilita **Email/Password** como proveedor.
- (Opcional) Desactiva la confirmación de correo para desarrollo: en **Auth → Settings → Email**, desactiva "Confirm email".

#### d) Agregar función automática de perfil (recomendado)

En **SQL Editor**, ejecuta esto para que el perfil se cree automáticamente al registrarse:

```sql
-- Esta función se ejecuta cuando un usuario se registra
-- Los datos de nombre y rol vienen de los metadatos del signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'participante')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

> **Nota:** Si usas este trigger, actualiza el método `registro` en `src/context/AuthContext.jsx` para pasar los datos en `options.data`:
> ```js
> await supabase.auth.signUp({
>   email: correo,
>   password: contrasena,
>   options: { data: { nombre, rol } }
> })
> ```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Estructura del proyecto

```
sembrando-valores-digital/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── supabase/
│   └── schema.sql          # Schema completo de la base de datos
└── src/
    ├── main.jsx
    ├── App.jsx              # Ruteo principal
    ├── index.css            # Estilos globales + Tailwind
    ├── lib/
    │   └── supabase.js      # Cliente de Supabase
    ├── context/
    │   └── AuthContext.jsx  # Contexto de autenticación y perfil
    ├── data/
    │   └── modulos.js       # Contenido de los 14 módulos (quiz + reflexión)
    ├── components/
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   ├── DiagramaFlujo.jsx   # Diagrama visual del flujo del programa
    │   └── Instructivo.jsx     # Guía para participantes y facilitadores
    └── pages/
        ├── Bienvenida.jsx      # Pantalla de inicio pública
        ├── Login.jsx
        ├── Registro.jsx
        ├── Dashboard.jsx       # Panel del participante
        ├── Modulo.jsx          # Contenedor del flujo por módulo
        ├── InstructivoPage.jsx # Página "¿Cómo funciona?"
        ├── PanelFacilitador.jsx
        └── pasos/
            ├── PasoVideo.jsx
            ├── PasoQuiz.jsx
            ├── PasoReflexion.jsx
            └── PasoSesion.jsx
```

---

## Roles de usuario

| Rol | Capacidades |
|-----|-------------|
| **Participante** | Ver módulos, responder quiz, escribir reflexiones, ver sesión y compromisos del grupo |
| **Facilitador** | Todo lo anterior + crear grupo, ver reflexiones del grupo, agendar sesiones, registrar compromisos, evaluar sesiones |

---

## Flujo por módulo

Cada módulo sigue este orden (no se puede saltar pasos):

1. **Video** — Ver el video embebido y marcarlo como visto
2. **Quiz** — 3–5 preguntas de opción múltiple (mínimo 70% para avanzar)
3. **Reflexión personal** — Preguntas abiertas guardadas en Supabase
4. **Sesión grupal** — Ver el enlace agendado por el facilitador y los compromisos

---

## Despliegue en Vercel

### 1. Conectar repositorio

1. Sube el proyecto a GitHub.
2. Ve a [vercel.com](https://vercel.com) y crea un nuevo proyecto desde GitHub.
3. Vercel detectará automáticamente que es un proyecto Vite.

### 2. Variables de entorno en Vercel

En **Project → Settings → Environment Variables**, agrega:

```
VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY = tu-anon-key
```

### 3. Configuración de build

Vercel usa automáticamente:
- **Build command:** `npm run build`
- **Output directory:** `dist`

### 4. Desplegar

Haz clic en **Deploy**. El sitio estará disponible en `https://tu-proyecto.vercel.app`.

---

## Personalización de contenido

### Agregar videos a los módulos

Edita `src/data/modulos.js` y añade la URL de YouTube en el campo `video_url`:

```js
{
  id: 7,
  titulo: 'La Solidaridad',
  video_url: 'https://www.youtube.com/watch?v=TU_VIDEO_ID',
  // ...
}
```

O actualízalo directamente desde el dashboard de Supabase en la tabla `modulos`.

### Editar preguntas del quiz

Las preguntas están en `src/data/modulos.js` dentro de `preguntas_quiz`. Cada pregunta tiene:
- `pregunta`: el texto de la pregunta
- `opciones`: array de 4 opciones (a, b, c, d)
- `correcta`: índice de la respuesta correcta (0=a, 1=b, 2=c, 3=d)

---

## Créditos

- **Programa:** Sembrando Valores — Pastoral Social
- **Organización:** Misioneros en el Mundo del Trabajo (MMT)
- **Web:** [www.misionerosmt.org](https://www.misionerosmt.org)
- **Contacto:** info@misionerosmt.org
