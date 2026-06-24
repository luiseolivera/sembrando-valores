import { Link, useNavigate } from 'react-router-dom'
import DiagramaFlujo from '../components/DiagramaFlujo'
import Instructivo from '../components/Instructivo'
import { useAuth } from '../context/AuthContext'
import { Sprout, ArrowRight, Eye } from 'lucide-react'

export default function Bienvenida() {
  const { entrarComoDemo } = useAuth()
  const navigate = useNavigate()

  function verDemo(rol) {
    entrarComoDemo(rol)
    navigate('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-morado to-purple-800 opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-dorado rounded-full mb-6 shadow-2xl">
            <Sprout size={40} className="text-morado" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Sembrando Valores Digital
          </h1>
          <p className="text-lg text-purple-200 mb-3 font-medium">
            Misioneros en el Mundo del Trabajo
          </p>
          <p className="text-purple-300 text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            Un programa de formación en valores para equipos de trabajo, organizaciones y comunidades.
            Aprende, reflexiona y construye compromisos junto a tu grupo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro"
              className="inline-flex items-center justify-center gap-2 bg-dorado text-morado font-bold px-8 py-3 rounded-full text-base hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Comenzar ahora <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-3 rounded-full text-base hover:bg-white/20 transition-all border border-white/30"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <p className="text-purple-300 text-sm self-center">¿Solo quieres explorar?</p>
            <button
              onClick={() => verDemo('participante')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              <Eye size={15} /> Ver como participante
            </button>
            <button
              onClick={() => verDemo('facilitador')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-medium px-6 py-2 rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              <Eye size={15} /> Ver como facilitador
            </button>
          </div>
        </div>
      </section>

      {/* Diagrama de flujo */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <DiagramaFlujo />
      </section>

      {/* Valores destacados */}
      <section className="bg-morado py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-white font-bold text-2xl mb-2">14 valores para transformar tu entorno</h2>
          <p className="text-purple-300 text-sm mb-8">Basado en la Doctrina Social de la Iglesia</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'La Persona', 'La Centralidad', 'La Familia', 'El Amor', 'La Educación',
              'La Participación', 'La Solidaridad', 'La Subsidiaridad', 'El Bien Común',
              'La Verdad', 'La Libertad', 'La Justicia', 'Participación Ciudadana', 'Ecología Integral'
            ].map((v) => (
              <span key={v} className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Instructivo */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-morado font-bold text-2xl text-center mb-8">
          ¿Cómo participo?
        </h2>
        <Instructivo />
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-dorado to-yellow-400 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-morado font-extrabold text-2xl mb-3">
            ¿Listo para comenzar?
          </h2>
          <p className="text-morado/80 mb-6 text-sm">
            Únete a tu grupo y empieza a sembrar valores en tu lugar de trabajo.
          </p>
          <Link
            to="/registro"
            className="inline-flex items-center gap-2 bg-morado text-white font-bold px-8 py-3 rounded-full hover:bg-morado-dark transition-all shadow-lg"
          >
            Registrarme gratis <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
