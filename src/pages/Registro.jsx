import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Users, Hash, Sprout, AlertCircle, CheckCircle } from 'lucide-react'

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
  const [cargando, setCargando] = useState(false)

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
    const { error: err } = await registro(
      form.nombre,
      form.correo,
      form.contrasena,
      form.rol,
      null
    )
    setCargando(false)
    if (err) {
      const esModoDemo = err.message?.includes('demo') || err.message?.includes('Modo demo')
      setError(
        esModoDemo
          ? 'Esta es una vista previa — el registro se activa cuando se conecte la base de datos.'
          : 'Ocurrió un error al registrarte. Verifica que el correo no esté ya registrado.'
      )
    } else {
      setExito(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    }
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

          <p className="text-center text-sm text-gray-500 mt-6">
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
