import {
  UserPlus, BookOpen, Headphones, CheckSquare, PenLine, Users, Target,
  ClipboardList, Share2, Zap, FileText, Calendar, MessageSquare, Award
} from 'lucide-react'

const pasosParticipante = [
  { icono: UserPlus, texto: 'Regístrate con tu nombre y correo' },
  { icono: Share2, texto: 'Únete a tu grupo con el código que te comparte el facilitador' },
  { icono: BookOpen, texto: 'Selecciona el módulo activo de tu grupo' },
  { icono: Headphones, texto: 'Escucha el audio completo y marca que lo escuchaste' },
  { icono: CheckSquare, texto: 'Responde el quiz de comprensión (mínimo 70% para avanzar)' },
  { icono: PenLine, texto: 'Escribe tu reflexión personal y envíala' },
  { icono: Users, texto: 'Conéctate a la sesión grupal — el link y la fecha aparecen en tu pantalla principal' },
  { icono: Target, texto: 'Revisa los compromisos registrados por el grupo' },
]

const pasosFacilitador = [
  { icono: UserPlus, texto: 'Regístrate como facilitador y crea tu grupo' },
  { icono: Share2, texto: 'Comparte el código de grupo con los participantes' },
  { icono: Zap, texto: 'Activa el módulo que trabajarán' },
  { icono: FileText, texto: 'Revisa el resumen de reflexiones antes de la sesión' },
  { icono: Calendar, texto: 'Agenda la sesión grupal con Google Meet o Zoom' },
  { icono: MessageSquare, texto: 'Usa las preguntas del manual como guía durante la sesión' },
  { icono: Award, texto: 'Registra hasta 3 compromisos grupales al terminar' },
]

export default function Instructivo() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <h3 className="font-bold text-morado text-lg">Para participantes</h3>
        </div>
        <ol className="space-y-3">
          {pasosParticipante.map((paso, i) => {
            const Icono = paso.icono
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-morado text-white rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex items-start gap-2">
                  <Icono size={16} className="text-dorado flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{paso.texto}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-yellow-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-dorado rounded-full flex items-center justify-center">
            <ClipboardList size={20} className="text-morado" />
          </div>
          <h3 className="font-bold text-morado text-lg">Para facilitadores</h3>
        </div>
        <ol className="space-y-3">
          {pasosFacilitador.map((paso, i) => {
            const Icono = paso.icono
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-dorado text-morado rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex items-start gap-2">
                  <Icono size={16} className="text-morado flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{paso.texto}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
