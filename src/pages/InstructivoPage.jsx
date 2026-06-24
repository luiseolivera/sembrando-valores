import Instructivo from '../components/Instructivo'
import DiagramaFlujo from '../components/DiagramaFlujo'
import { BookOpen } from 'lucide-react'

export default function InstructivoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-morado rounded-full mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-morado">¿Cómo funciona?</h1>
          <p className="text-gray-500 text-sm mt-2">Guía completa del programa Sembrando Valores Digital</p>
        </div>

        <div className="mb-10">
          <DiagramaFlujo />
        </div>

        <h2 className="text-xl font-bold text-morado mb-6 text-center">Pasos según tu rol</h2>
        <Instructivo />

        <div className="mt-10 bg-morado rounded-2xl p-6 text-center">
          <p className="text-white font-semibold mb-2">¿Tienes dudas?</p>
          <p className="text-purple-300 text-sm">
            Contacta a tu facilitador o escríbenos a{' '}
            <a href="mailto:info@misionerosmt.org" className="text-dorado hover:underline">
              info@misionerosmt.org
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
