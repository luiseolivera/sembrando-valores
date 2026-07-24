import {
  UserPlus, BookOpen, Headphones, CheckSquare, PenLine, Users, Target,
  ClipboardList, Share2, Zap, FileText, Calendar, MessageSquare, Award, Printer, Star
} from 'lucide-react'

const pasosParticipante = [
  { icono: UserPlus, texto: 'Regístrate con tu nombre y correo' },
  { icono: Share2, texto: 'Únete a tu grupo con el código o link que te comparte el facilitador — te lleva directo al módulo activo' },
  { icono: Headphones, texto: 'Escucha el audio completo y marca que lo escuchaste' },
  { icono: CheckSquare, texto: 'Responde el quiz de comprensión (mínimo 70% para avanzar)' },
  { icono: PenLine, texto: 'Escribe tu reflexión personal y envíala' },
  { icono: Target, texto: 'Registra tus compromisos personales para el módulo' },
  { icono: Users, texto: 'Conéctate a la sesión grupal — el link se desbloquea al completar el quiz y tu reflexión, y aparece con la fecha en tu pantalla principal' },
  { icono: Printer, texto: 'Imprime tus reflexiones y compromisos desde "Mis reflexiones y compromisos"' },
]

const pasosFacilitador = [
  { icono: UserPlus, texto: 'Regístrate como facilitador — tu cuenta necesita ser aprobada por el equipo antes de poder crear grupos' },
  { icono: Share2, texto: 'Crea uno o varios grupos (uno por cada equipo que acompañes) y comparte el código o link por la app o por WhatsApp' },
  { icono: Zap, texto: 'Activa el módulo que trabajarán' },
  { icono: FileText, texto: 'Revisa el progreso y las reflexiones y compromisos de cada participante' },
  { icono: Calendar, texto: 'Agenda la sesión grupal (Zoom, Meet o Teams) — el link se habilita solo para quienes completaron el quiz y su reflexión' },
  { icono: MessageSquare, texto: 'Usa las preguntas del manual como guía durante la sesión' },
  { icono: Award, texto: 'Registra hasta 3 compromisos grupales al terminar' },
  { icono: Star, texto: 'Deja tu retroalimentación sobre la sesión o sugerencias para mejorar la app' },
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
