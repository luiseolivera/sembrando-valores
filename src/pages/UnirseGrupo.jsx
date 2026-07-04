import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, User, Mail, Lock, Sprout, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function UnirseGrupo() {
  const { codigo } = useParams()
  const { user, perfil, registro, login } = useAuth()
  const navigate = useNavigate()

  const [grupo, setGrupo] = useState(null)
  const [errorGrupo, setErrorGrupo] = useState('')
  const [cargandoGrupo, setCargandoGrupo] = useState(true)
  const [modo, setModo] = useState('registro') // 'registro' | 'login'
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', confirmar: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)

  // 1. Validar código y cargar datos del grupo
  useEffect(() => {
    async function validarCodigo() {
      const { data, error } = await supabase
        .from('grupos')
        .select('id, nombre')
        .eq('codigo', codigo.toUpperCase())
        .maybeSingle()

      if (error || !data) {
        setErrorGrupo('No se encontró ningún grupo con este código. Verifica el link con tu facilitador.')
      } else {
        setGrupo(data)
      }
      setCargandoGrupo(false)
    }
    validarCodigo()
  }, [codigo])

  // 2. Si ya tiene sesión y grupo cargó → unirlo y redirigir
  useEffect(() => {
    if (user && perfil && grupo) unirYRedirigir(perfil.id)
  }, [user, perfil, grupo])

  async function unirYRedirigir(userId) {
    await supabase.from('usuarios').update({ grupo_id: grupo.id }).eq('id', userId)
    setExito(true)
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  async function handleRegistro(e) {
    e.preventDefault()
    setError('')
    if (form.contrasena !== form.confirmar) { setError('Las contraseñas no coinciden.'); return }
    if (form.contrasena.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setCargando(true)

    // Registrar como participante
    const { error: err } = await registro(form.nombre, form.correo, form.contrasena, 'participante', null)
    if (err) {
      setError('Error al crear la cuenta. Verifica que el correo no esté ya registrado.')
      setCargando(false)
      return
    }

    // El AuthContext actualiza perfil, el useEffect de arriba hará el join
    setCargando(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error: err } = await login(form.correo, form.contrasena)
    if (err) {
      setError('Correo o contraseña incorrectos.')
      setCargando(false)
    }
    // Si login OK, el useEffect de arriba hará el join
    setCargando(false)
  }

  function cambio(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  // Estados de carga y error
  if (cargandoGrupo) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (errorGrupo) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h2>
        <p className="text-gray-500 text-sm mb-6">{errorGrupo}</p>
        <Link to="/" className="text-morado font-semibold text-sm hover:underline">← Ir al inicio</Link>
      </div>
    </div>
  )

  if (exito) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-morado mb-2">¡Te uniste!</h2>
        <p className="text-gray-600 text-sm">
          Ahora formas parte del grupo <strong>{grupo?.nombre}</strong>.
        </p>
        <p className="text-gray-400 text-xs mt-2">Redirigiendo a tu panel...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Cabecera: info del grupo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morado rounded-full mb-4 shadow-lg">
            <Sprout size={32} className="text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Te invitaron a unirte a</p>
          <h1 className="text-2xl font-extrabold text-morado">{grupo.nombre}</h1>
          <p className="text-gray-400 text-xs mt-1">Programa Sembrando Valores Digital</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          {/* Tabs registro/login */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setModo('registro'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                modo === 'registro' ? 'bg-white text-morado shadow-sm' : 'text-gray-500'
              }`}
            >
              Crear cuenta nueva
            </button>
            <button
              onClick={() => { setModo('login'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                modo === 'login' ? 'bg-white text-morado shadow-sm' : 'text-gray-500'
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {modo === 'registro' ? (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="nombre" value={form.nombre} onChange={cambio} required
                    placeholder="Tu nombre"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="correo" value={form.correo} onChange={cambio} required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" name="contrasena" value={form.contrasena} onChange={cambio} required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" name="confirmar" value={form.confirmar} onChange={cambio} required
                    placeholder="Repite tu contraseña"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <button type="submit" disabled={cargando}
                className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Users size={16} />
                {cargando ? 'Creando cuenta...' : `Unirme a ${grupo.nombre}`}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="correo" value={form.correo} onChange={cambio} required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" name="contrasena" value={form.contrasena} onChange={cambio} required
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <button type="submit" disabled={cargando}
                className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <ArrowRight size={16} />
                {cargando ? 'Entrando...' : `Entrar y unirme al grupo`}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Al registrarte quedarás inscrito automáticamente en el grupo <strong>{grupo.nombre}</strong>
        </p>
      </div>
    </div>
  )
}
