import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Users, Hash, Sprout, AlertCircle, CheckCircle, Clock, Send, MailCheck } from 'lucide-react'

const CORREO_APROBACION = 'luiso@rederac.com'

function mailtoSolicitud(nombre, correo, usuarioId) {
  const linkAprobacion = `${window.location.origin}/admin${usuarioId ? `?id=${usuarioId}` : ''}`
  const asunto = 'Solicitud de facilitador — Sembrando Valores Digital'
  const cuerpo = `Hola,\n\nSolicito autorización para ser facilitador en la plataforma Sembrando Valores Digital.\n\nNombre: ${nombre}\nCorreo registrado: ${correo}\n\nPara aprobar la cuenta, entren a:\n${linkAprobacion}\n\nGracias.`
  return `mailto:${CORREO_APROBACION}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

export default function Registro() {
  const { registro } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    confirmar: '',
    rol: 'participante',
    nombreGrupo: '',
    codigoGrupo: '',
  })
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.contrasena !== form.confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setCargando(true)
    const { data, error: err } = await registro(
      form.nombre,
      form.correo,
      form.contrasena,
      form.rol,
      null
    )
    setCargando(false)
    if (data?.user?.id) setUsuarioId(data.user.id)
    if (err) {
      const esModoDemo = err.message?.includes('demo') || err.message?.includes('Modo demo')
      setError(
        esModoDemo
          ? 'Esta es una vista previa — el registro se activa cuando se conecte la base de datos.'
          : err.message?.includes('already registered') || err.message?.includes('already been registered')
          ? 'Ese correo ya tiene una cuenta. Intenta iniciar sesión.'
          : `Ocurrió un error al registrarte: ${err.message || 'intenta de nuevo.'}`
      )
    } else if (!data?.session) {
      // Requiere confirmar el correo antes de tener sesión activa
      setRequiereConfirmacion(true)
    } else if (form.rol === 'facilitador') {
      setExito(true)
    } else {
      setExito(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    }
  }

  if (requiereConfirmacion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <MailCheck size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-morado mb-2">Confirma tu correo</h2>
          <p className="text-gray-600 text-sm mb-2">
            Te enviamos un link de confirmación a <strong>{form.correo}</strong>. Ábrelo para activar tu cuenta.
          </p>
          {form.rol === 'facilitador' && (
            <p className="text-gray-500 text-xs mb-6">
              Después de confirmar, tu cuenta de facilitador también necesitará ser autorizada por el equipo antes de poder crear grupos.
            </p>
          )}
          <Link to="/login" className="text-morado text-sm font-semibold hover:underline">
            Ya confirmé, iniciar sesión →
          </Link>
        </div>
      </div>
    )
  }

  if (exito && form.rol === 'facilitador') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <Clock size={40} className="text-dorado-dark" />
          </div>
          <h2 className="text-xl font-bold text-morado mb-2">Cuenta creada — pendiente de aprobación</h2>
          <p className="text-gray-600 text-sm mb-6">
            Tu cuenta de facilitador necesita ser autorizada por el equipo de Misioneros en el Mundo del Trabajo
            antes de poder crear y gestionar grupos.
          </p>
          <a
            href={mailtoSolicitud(form.nombre, form.correo, usuarioId)}
            className="w-full inline-flex items-center justify-center gap-2 bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors mb-3"
          >
            <Send size={16} /> Enviar solicitud de aprobación
          </a>
          <Link to="/dashboard" className="text-morado text-sm font-semibold hover:underline">
            Ir a mi panel mientras tanto →
          </Link>
        </div>
      </div>
    )
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-morado mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-600 text-sm">Redirigiendo a tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morado rounded-full mb-4 shadow-lg">
            <Sprout size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-morado">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Únete al programa Sembrando Valores</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  required
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirmar"
                  value={form.confirmar}
                  onChange={handleChange}
                  required
                  placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">¿Cuál es tu rol?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, rol: 'participante' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.rol === 'participante'
                      ? 'border-morado bg-purple-50 text-morado'
                      : 'border-gray-200 text-gray-500 hover:border-purple-200'
                  }`}
                >
                  <User size={16} /> Participante
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, rol: 'facilitador' })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.rol === 'facilitador'
                      ? 'border-dorado bg-yellow-50 text-dorado-dark'
                      : 'border-gray-200 text-gray-500 hover:border-yellow-200'
                  }`}
                >
                  <Users size={16} /> Facilitador
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {cargando ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Al crear tu cuenta aceptas nuestro{' '}
            <Link to="/privacidad" className="text-morado hover:underline">
              Aviso de Privacidad
            </Link>
          </p>

          <p className="text-center text-sm text-gray-500 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-morado font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
