import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DEMO_MODE } from './lib/supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import Bienvenida from './pages/Bienvenida'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Modulo from './pages/Modulo'
import PanelFacilitador from './pages/PanelFacilitador'
import InstructivoPage from './pages/InstructivoPage'
import UnirseGrupo from './pages/UnirseGrupo'
import MiResumen from './pages/MiResumen'
import Admin from './pages/Admin'

function RutaProtegida({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (DEMO_MODE) return children
  return user ? children : <Navigate to="/login" replace />
}

function RutaFacilitador({ children }) {
  const { perfil, loading } = useAuth()
  if (loading) return null
  if (DEMO_MODE) return children
  return perfil?.rol === 'facilitador' && perfil?.aprobado ? children : <Navigate to="/dashboard" replace />
}

function DemoBanner() {
  if (!DEMO_MODE) return null
  return (
    <div className="bg-yellow-400 text-yellow-900 text-xs text-center py-1.5 px-4 font-semibold">
      ⚠️ Modo demo — La app funciona sin base de datos. Para habilitar auth y datos reales, configura{' '}
      <code className="font-mono bg-yellow-300 px-1 rounded">.env.local</code> con tus credenciales de Supabase.
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DemoBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Bienvenida /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/registro" element={<Layout><Registro /></Layout>} />
          <Route path="/instructivo" element={<Layout><InstructivoPage /></Layout>} />
          <Route
            path="/dashboard"
            element={<RutaProtegida><Layout><Dashboard /></Layout></RutaProtegida>}
          />
          <Route
            path="/modulo/:id"
            element={<RutaProtegida><Layout><Modulo /></Layout></RutaProtegida>}
          />
          <Route
            path="/mi-resumen"
            element={<RutaProtegida><Layout><MiResumen /></Layout></RutaProtegida>}
          />
          <Route
            path="/admin"
            element={<RutaProtegida><Layout><Admin /></Layout></RutaProtegida>}
          />
          <Route
            path="/facilitador"
            element={
              <RutaProtegida>
                <RutaFacilitador>
                  <Layout><PanelFacilitador /></Layout>
                </RutaFacilitador>
              </RutaProtegida>
            }
          />
          <Route path="/unirse/:codigo" element={<Layout><UnirseGrupo /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
