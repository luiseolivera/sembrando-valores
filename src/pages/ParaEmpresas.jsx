import { Link } from 'react-router-dom'
import { BarChart3, Award, Palette, Mail, ArrowRight, Sprout, BookOpen, Users, ClipboardCheck, Video, ShieldCheck } from 'lucide-react'

const CORREO_EMPRESAS = 'info@misionerosmt.org'

function mailtoEmpresas() {
  const asunto = 'Interés empresarial — Sembrando Valores Digital'
  const cuerpo = 'Hola,\n\nMe interesa llevar el Programa Sembrando Valores a mi empresa. Nos gustaría conversar sobre las opciones disponibles (incluyendo facturación).\n\nNombre de la empresa:\nNúmero aproximado de colaboradores:\nPersona de contacto:\n\nGracias.'
  return `mailto:${CORREO_EMPRESAS}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

const BENEFICIOS = [
  {
    icono: BarChart3,
    titulo: 'Reportes agregados',
    texto: 'Un panel con el avance de todos los grupos de tu empresa: participantes activos, quizzes aprobados y compromisos cumplidos — listo para compartir con dirección o RR.HH.',
  },
  {
    icono: Award,
    titulo: 'Constancias de finalización',
    texto: 'Cada colaborador que termina los 14 módulos obtiene una constancia descargable con su nombre, útil como evidencia de capacitación.',
  },
  {
    icono: Palette,
    titulo: 'Marca de tu empresa',
    texto: 'El logo de tu empresa aparece junto al de MMT en el panel de tus colaboradores — la plataforma se siente parte de tu programa interno.',
  },
  {
    icono: BookOpen,
    titulo: '14 módulos',
    texto: 'Contenidos sobre valores y principios éticos universales, listos para usarse.',
  },
  {
    icono: Users,
    titulo: 'Grupos ilimitados',
    texto: 'Crea todos los grupos que necesites, uno por cada equipo de tu organización — sin límite de cantidad.',
  },
  {
    icono: ClipboardCheck,
    titulo: 'Quiz, reflexión y compromisos',
    texto: 'Cada colaborador responde su quiz, escribe su reflexión personal y registra sus compromisos.',
  },
  {
    icono: Video,
    titulo: 'Sesiones grupales',
    texto: 'Videollamadas por Zoom, Google Meet o Teams, con los horarios que cada equipo elija.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Facilitadores aprobados',
    texto: 'Cada nueva cuenta de facilitador la aprueba el equipo de MMT antes de poder operar.',
  },
]

export default function ParaEmpresas() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-morado to-purple-800 opacity-95" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-dorado rounded-full flex items-center justify-center mx-auto mb-6">
            <Sprout size={32} className="text-morado" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Sembrando Valores para tu empresa
          </h1>
          <p className="text-purple-100 text-base leading-relaxed mb-8">
            Lleva el programa de formación en valores de Misioneros en el Mundo del Trabajo a todos
            los equipos de tu organización, con seguimiento y evidencia para tu área de Personal.
          </p>
          <a
            href={mailtoEmpresas()}
            className="inline-flex items-center gap-2 bg-dorado text-morado font-bold px-8 py-3 rounded-full text-base hover:bg-yellow-400 transition-all shadow-lg"
          >
            <Mail size={18} /> Contáctanos para tu empresa
          </a>
          <p className="text-purple-200 text-xs mt-3">Facturación disponible — conversemos sobre las opciones para tu organización</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {BENEFICIOS.map((b, i) => {
            const Icono = b.icono
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Icono size={18} className="text-morado" />
                </div>
                <h3 className="font-bold text-morado text-sm mb-1.5">{b.titulo}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{b.texto}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm mb-4">¿Prefieres apoyar el programa como donativo personal?</p>
          <Link to="/" className="inline-flex items-center gap-2 text-morado font-semibold text-sm hover:underline">
            Volver a la portada <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
