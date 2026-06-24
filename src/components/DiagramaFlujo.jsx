import {
  UserPlus, BookOpen, Play, CheckSquare, PenLine,
  Users, Target, ChevronRight, ArrowRight
} from 'lucide-react'

const pasos = [
  { icono: UserPlus, titulo: 'Registro', color: 'bg-purple-700', num: 1 },
  { icono: BookOpen, titulo: 'Selecciona Módulo', color: 'bg-purple-600', num: 2 },
  { icono: Play, titulo: 'Ve el Video', color: 'bg-purple-500', num: 3 },
  { icono: CheckSquare, titulo: 'Quiz', color: 'bg-yellow-500', num: 4 },
  { icono: PenLine, titulo: 'Reflexión Personal', color: 'bg-yellow-600', num: 5 },
  { icono: Users, titulo: 'Sesión Grupal', color: 'bg-purple-700', num: 6 },
  { icono: Target, titulo: 'Compromisos', color: 'bg-purple-800', num: 7 },
  { icono: ArrowRight, titulo: 'Siguiente Módulo', color: 'bg-morado', num: 8 },
]

export default function DiagramaFlujo() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
      <h2 className="text-center text-morado font-bold text-lg mb-6">
        ¿Cómo funciona el programa?
      </h2>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {pasos.map((paso, i) => {
          const Icono = paso.icono
          return (
            <div key={paso.num} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-2 w-20">
                <div className={`${paso.color} w-12 h-12 rounded-full flex items-center justify-center shadow-md`}>
                  <Icono size={22} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                  {paso.titulo}
                </span>
              </div>
              {i < pasos.length - 1 && (
                <ChevronRight size={20} className="text-dorado flex-shrink-0 mt-[-18px]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: 2 columns grid */}
      <div className="md:hidden grid grid-cols-2 gap-4">
        {pasos.map((paso) => {
          const Icono = paso.icono
          return (
            <div key={paso.num} className="flex items-center gap-3">
              <div className={`${paso.color} w-10 h-10 rounded-full flex items-center justify-center shadow flex-shrink-0`}>
                <Icono size={18} className="text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-morado">Paso {paso.num}</span>
                <p className="text-xs text-gray-700 font-medium leading-tight">{paso.titulo}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
        <p className="text-xs text-morado font-medium">
          Cada paso se desbloquea al completar el anterior. ¡Avanza a tu ritmo!
        </p>
      </div>
    </div>
  )
}
