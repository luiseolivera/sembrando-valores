import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Sprout, AlertCircle, Eye } from 'lucide-react'

export default function Login() {
  const { login, entrarComoDemo } = useAuth()
  const navigate = useNavigate()

  function verDemo(rol) {
    entrarComoDemo(rol)
    navigate('/dashboard')
  }
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error: err } = await login(correo, contrasena)
    setCargando(false)
    if (err) {
      const esModoDemo = err.message?.includes('demo') || err.message?.includes('Modo demo')
      setError(
        esModoDemo
          ? 'Esta es una vista previa — el login se activa cuando se conecte la base de datos.'
          : 'Correo o contraseña incorrectos. Verifica tus datos.'
      )
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-morado rounded-full mb-4 shadow-lg">
            <Sprout size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-morado">Bienvenido de vuelta</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="text-morado font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </p>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 mb-3">¿Solo quieres explorar la app?</p>
            <div className="flex gap-2">
              <button
                onClick={() => verDemo('participante')}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-morado border border-purple-200 py-2.5 rounded-xl hover:bg-purple-50 transition-colors"
              >
                <Eye size={14} /> Ver como participante
              </button>
              <button
                onClick={() => verDemo('facilitador')}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-dorado-dark border border-yellow-200 py-2.5 rounded-xl hover:bg-yellow-50 transition-colors"
              >
                <Eye size={14} /> Ver como facilitador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
