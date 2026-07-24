import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, DEMO_MODE } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      setUser({ id: 'demo-user' })
      setPerfil({ id: 'demo-user', nombre: 'Participante Demo', correo: 'demo@sembrando.org', rol: 'participante', grupo_id: null })
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId) {
    try {
      const { data } = await supabase.from('usuarios').select('*').eq('id', userId).single()
      if (data) { setPerfil(data); setLoading(false); return }
      // Reintenta hasta 5 veces con 800ms entre intentos (por si el insert aún no terminó)
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 800))
        const { data: d2 } = await supabase.from('usuarios').select('*').eq('id', userId).single()
        if (d2) { setPerfil(d2); setLoading(false); return }
      }
    } catch {}
    setLoading(false)
  }

  async function login(correo, contrasena) {
    if (DEMO_MODE) return { error: { message: 'Modo demo — configura Supabase para usar esta función.' } }
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
    return { data, error }
  }

  async function registro(nombre, correo, contrasena, rol) {
    if (DEMO_MODE) return { error: { message: 'Modo demo — configura Supabase para registrarte.' } }
    // El perfil en "usuarios" lo crea un trigger en la base de datos (handle_new_user),
    // leyendo nombre/rol de estos metadatos — así funciona aunque el correo todavía
    // no esté confirmado y no haya sesión activa en este momento.
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { data: { nombre, rol } },
    })
    return { data, error }
  }

  function entrarComoDemo(rol) {
    const perfilDemo = {
      id: 'demo-user',
      nombre: rol === 'facilitador' ? 'Facilitador Demo' : 'Participante Demo',
      correo: 'demo@sembrando.org',
      rol,
      grupo_id: null,
      aprobado: true,
    }
    setUser({ id: 'demo-user' })
    setPerfil(perfilDemo)
  }

  async function cerrarSesion() {
    if (!DEMO_MODE) await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, registro, cerrarSesion, entrarComoDemo, DEMO_MODE }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
