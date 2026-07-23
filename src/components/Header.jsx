import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_MODE, esAdmin } from '../lib/supabase'
import { LogOut, BookOpen, Menu, X, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { perfil, cerrarSesion, entrarComoDemo } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function handleLogout() {
    await cerrarSesion()
    navigate('/')
  }

  function cambiarRolDemo(rol) {
    entrarComoDemo(rol)
    navigate(rol === 'facilitador' ? '/facilitador' : '/dashboard')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img src="/logommt.png" alt="MMT" className="h-10 w-auto object-contain flex-shrink-0" />
          <div className="hidden sm:block">
            <p className="text-morado font-bold text-sm leading-tight">Sembrando Valores Digital</p>
            <p className="text-dorado-dark text-xs font-medium">Misioneros en el Mundo del Trabajo</p>
          </div>
        </Link>

        {perfil ? (
          <>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-morado transition-colors text-sm font-medium">
                Inicio
              </Link>
              <Link to="/instructivo" className="text-gray-600 hover:text-morado transition-colors text-sm font-medium">
                ¿Cómo funciona?
              </Link>
              {perfil.rol === 'facilitador' && (perfil.aprobado || DEMO_MODE) && (
                <Link to="/facilitador" className="text-gray-600 hover:text-morado transition-colors text-sm font-medium">
                  Panel Facilitador
                </Link>
              )}
              {perfil.rol === 'facilitador' && !perfil.aprobado && !DEMO_MODE && (
                <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full font-semibold">
                  Facilitador pendiente
                </span>
              )}
              {esAdmin(perfil) && (
                <Link to="/admin" className="flex items-center gap-1 text-gray-600 hover:text-morado transition-colors text-sm font-medium">
                  <ShieldCheck size={15} /> Aprobaciones
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                <div className="text-right">
                  <p className="text-morado text-xs font-semibold">{perfil.nombre}</p>
                  {DEMO_MODE ? (
                    <div className="flex gap-1 mt-0.5">
                      <button
                        onClick={() => cambiarRolDemo('participante')}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${perfil.rol === 'participante' ? 'bg-morado text-white font-bold' : 'text-gray-400 hover:text-morado'}`}
                      >
                        Participante
                      </button>
                      <button
                        onClick={() => cambiarRolDemo('facilitador')}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${perfil.rol === 'facilitador' ? 'bg-morado text-white font-bold' : 'text-gray-400 hover:text-morado'}`}
                      >
                        Facilitador
                      </button>
                    </div>
                  ) : (
                    <p className="text-dorado-dark text-xs capitalize font-medium">{perfil.rol}</p>
                  )}
                </div>
                {!DEMO_MODE && (
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-morado transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            </nav>

            <button
              className="md:hidden text-morado"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-gray-600 hover:text-morado text-sm font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="bg-morado text-white text-sm font-bold px-4 py-1.5 rounded-full hover:bg-purple-800 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>

      {menuAbierto && perfil && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-3">
          <Link to="/dashboard" className="block text-gray-700 text-sm py-1" onClick={() => setMenuAbierto(false)}>Inicio</Link>
          <Link to="/instructivo" className="block text-gray-700 text-sm py-1" onClick={() => setMenuAbierto(false)}>¿Cómo funciona?</Link>
          {perfil.rol === 'facilitador' && (perfil.aprobado || DEMO_MODE) && (
            <Link to="/facilitador" className="block text-gray-700 text-sm py-1" onClick={() => setMenuAbierto(false)}>Panel Facilitador</Link>
          )}
          {esAdmin(perfil) && (
            <Link to="/admin" className="block text-gray-700 text-sm py-1" onClick={() => setMenuAbierto(false)}>Aprobaciones</Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-morado text-sm py-1">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
