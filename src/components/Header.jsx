import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_MODE } from '../lib/supabase'
import { LogOut, BookOpen, Menu, X } from 'lucide-react'
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
    <header className="bg-morado shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logommt.png" alt="MMT" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Sembrando Valores Digital</p>
            <p className="text-dorado text-xs">Misioneros en el Mundo del Trabajo</p>
          </div>
        </Link>

        {perfil ? (
          <>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-white hover:text-dorado transition-colors text-sm font-medium">
                Inicio
              </Link>
              <Link to="/instructivo" className="text-white hover:text-dorado transition-colors text-sm font-medium">
                ¿Cómo funciona?
              </Link>
              {perfil.rol === 'facilitador' && (
                <Link to="/facilitador" className="text-white hover:text-dorado transition-colors text-sm font-medium">
                  Panel Facilitador
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-purple-500 pl-6">
                <div className="text-right">
                  <p className="text-white text-xs font-medium">{perfil.nombre}</p>
                  {DEMO_MODE ? (
                    <div className="flex gap-1 mt-0.5">
                      <button
                        onClick={() => cambiarRolDemo('participante')}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${perfil.rol === 'participante' ? 'bg-dorado text-morado font-bold' : 'text-purple-300 hover:text-dorado'}`}
                      >
                        Participante
                      </button>
                      <button
                        onClick={() => cambiarRolDemo('facilitador')}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${perfil.rol === 'facilitador' ? 'bg-dorado text-morado font-bold' : 'text-purple-300 hover:text-dorado'}`}
                      >
                        Facilitador
                      </button>
                    </div>
                  ) : (
                    <p className="text-dorado text-xs capitalize">{perfil.rol}</p>
                  )}
                </div>
                {!DEMO_MODE && (
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-dorado transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            </nav>

            <button
              className="md:hidden text-white"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="text-white hover:text-dorado text-sm font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="bg-dorado text-morado text-sm font-bold px-4 py-1.5 rounded-full hover:bg-dorado-light transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>

      {menuAbierto && perfil && (
        <div className="md:hidden bg-morado-dark border-t border-purple-600 px-4 py-3 space-y-3">
          <Link to="/dashboard" className="block text-white text-sm py-1" onClick={() => setMenuAbierto(false)}>Inicio</Link>
          <Link to="/instructivo" className="block text-white text-sm py-1" onClick={() => setMenuAbierto(false)}>¿Cómo funciona?</Link>
          {perfil.rol === 'facilitador' && (
            <Link to="/facilitador" className="block text-white text-sm py-1" onClick={() => setMenuAbierto(false)}>Panel Facilitador</Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-dorado text-sm py-1">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      )}
    </header>
  )
}
