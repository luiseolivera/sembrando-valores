import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus, BookOpen, Headphones, CheckSquare, PenLine, Users, Target,
  ClipboardList, Share2, Zap, FileText, Calendar, MessageSquare, Award, Printer, Star,
  UserCheck, Building2, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react'

const pasosParticipante = [
  { icono: UserPlus, texto: 'Regístrate con tu nombre y correo' },
  { icono: Share2, texto: '(Opcional) Si tu equipo tiene un código de grupo, únete con él — te lleva directo al módulo activo. Si no tienes uno, puedes recorrer los módulos por tu cuenta.' },
  { icono: Headphones, texto: 'Lee los textos o escucha el audio completo y marca que ya lo hiciste' },
  { icono: CheckSquare, texto: 'Responde el quiz de comprensión (mínimo 70% para avanzar)' },
  { icono: PenLine, texto: 'Escribe tu reflexión personal y envíala' },
  { icono: Target, texto: 'Registra tus compromisos personales — puedes editarlos después si quieres' },
  { icono: Users, texto: 'Elige una sesión grupal disponible o, si no tienes grupo, solicita integrarte a uno con un facilitador específico o con cualquiera disponible — tu facilitador confirma tu asistencia y el módulo queda completado' },
  { icono: Printer, texto: 'Imprime tus reflexiones y compromisos desde "Mis reflexiones y compromisos"' },
]

const pasosFacilitador = [
  { icono: UserPlus, texto: 'Regístrate como facilitador — tu cuenta necesita ser aprobada por el equipo antes de poder crear grupos' },
  { icono: Share2, texto: 'Crea uno o varios grupos (uno por cada equipo que acompañes) y comparte el código o link por la app o por WhatsApp' },
  { icono: Zap, texto: 'Activa el módulo que trabajarán' },
  { icono: FileText, texto: 'Revisa el progreso, las reflexiones y compromisos de cada participante — puedes dejarle un comentario o reacción a su reflexión' },
  { icono: Calendar, texto: 'Ofrece uno o varios horarios de sesión grupal (Zoom, Meet o Teams) y ve formando grupos con quienes solicitan integrarse, hasta completarlos' },
  { icono: MessageSquare, texto: 'Usa las preguntas del manual como guía durante la sesión grupal' },
  { icono: Award, texto: 'Tras la sesión, confirma la asistencia de cada participante (individual o en bloque) para dar el módulo por completado' },
  { icono: Target, texto: 'Registra hasta 3 compromisos grupales al terminar' },
  { icono: Star, texto: 'Deja tu retroalimentación sobre la sesión o sugerencias para mejorar la app' },
]

function Chevron({ abierto }) {
  return abierto
    ? <ChevronUp size={18} className="text-morado flex-shrink-0" />
    : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
}

export default function Instructivo({ defaultAbierto = false }) {
  const [abiertoParticipante, setAbiertoParticipante] = useState(defaultAbierto)
  const [abiertoFacilitador, setAbiertoFacilitador] = useState(defaultAbierto)
  const [abiertoSinEquipo, setAbiertoSinEquipo] = useState(defaultAbierto)
  const [abiertoEmpresa, setAbiertoEmpresa] = useState(defaultAbierto)

  return (
    <div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-md border border-purple-100 overflow-hidden">
        <button
          onClick={() => setAbiertoParticipante(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-purple-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus size={20} className="text-white" />
            </div>
            <h3 className="font-bold text-morado text-lg">Para participantes</h3>
          </div>
          <Chevron abierto={abiertoParticipante} />
        </button>
        {abiertoParticipante && (
          <ol className="space-y-3 px-6 pb-6">
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
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-yellow-100 overflow-hidden">
        <button
          onClick={() => setAbiertoFacilitador(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-yellow-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dorado rounded-full flex items-center justify-center flex-shrink-0">
              <ClipboardList size={20} className="text-morado" />
            </div>
            <h3 className="font-bold text-morado text-lg">Para facilitadores</h3>
          </div>
          <Chevron abierto={abiertoFacilitador} />
        </button>
        {abiertoFacilitador && (
          <ol className="space-y-3 px-6 pb-6">
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
        )}
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="bg-purple-50 rounded-2xl border border-purple-100 overflow-hidden">
        <button
          onClick={() => setAbiertoSinEquipo(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-purple-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} className="text-morado" />
            </div>
            <p className="font-bold text-morado text-sm">¿No tienes un equipo?</p>
          </div>
          <Chevron abierto={abiertoSinEquipo} />
        </button>
        {abiertoSinEquipo && (
          <div className="px-5 pb-5">
            <p className="text-xs text-gray-600 leading-relaxed">
              Puedes registrarte sin un código de grupo y avanzar por tu cuenta hasta que te toque la sesión grupal.
              En ese momento solicitas integrarte a un grupo (con un facilitador específico o con cualquiera
              disponible) y él te asigna a uno de los suyos — desde ahí sigues como cualquier otro participante
              de ese grupo. Tu progreso nunca se pierde — quiz, reflexión y compromisos quedan guardados aunque
              no tengas grupo. Lo único que necesitas, tarde o temprano, es la sesión grupal confirmada por un
              facilitador para dar cada módulo por terminado — igual que si estuvieras en un grupo desde el inicio.
            </p>
          </div>
        )}
      </div>
      <div className="bg-yellow-50 rounded-2xl border border-yellow-100 overflow-hidden">
        <button
          onClick={() => setAbiertoEmpresa(v => !v)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-yellow-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-dorado-dark" />
            </div>
            <p className="font-bold text-morado text-sm">¿Eres una empresa?</p>
          </div>
          <Chevron abierto={abiertoEmpresa} />
        </button>
        {abiertoEmpresa && (
          <div className="px-5 pb-5">
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              Lleva el programa a todos los equipos de tu organización, con la marca de tu empresa en la plataforma y facturación disponible.
            </p>
            <Link to="/empresas" className="text-xs font-semibold text-morado hover:underline inline-flex items-center gap-1">
              Conoce nuestra propuesta empresarial <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
