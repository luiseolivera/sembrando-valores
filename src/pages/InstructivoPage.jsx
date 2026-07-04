import { useState } from 'react'
import Instructivo from '../components/Instructivo'
import DiagramaFlujo from '../components/DiagramaFlujo'
import { BookOpen, ChevronDown, ChevronUp, Heart, Users, Target, Lightbulb, Clock, Star } from 'lucide-react'

const FAQS = [
  {
    pregunta: '¿Qué es el Programa Sembrando Valores?',
    respuesta: 'Es un programa de reflexión, formación y convivencia desarrollado por Misioneros en el Mundo del Trabajo (MMT). Contiene 14 temas sobre valores y principios éticos humanos universales, con una metodología participativa que favorece la reflexión introspectiva, el diálogo con compañeros de trabajo y la construcción de conclusiones a partir del análisis de la realidad.',
  },
  {
    pregunta: '¿Para qué sirve el programa?',
    respuesta: 'El programa apoya a organizaciones y equipos de trabajo que están en el camino de ser más humanas: más productivas, más justas y trascendentes. Busca fortalecer la unidad y fraternidad de la organización, creando espacios de diálogo, encuentro y formación ética.',
  },
  {
    pregunta: '¿Cuántos módulos tiene el programa?',
    respuesta: 'El programa tiene 14 módulos. Cada módulo aborda un valor o principio ético: La Persona, La Centralidad de la Persona, La Familia, El Amor, La Educación, La Participación, La Solidaridad, La Subsidiaridad, El Bien Común, La Verdad, La Libertad, La Justicia, La Participación Ciudadana, y La Ecología Integral.',
  },
  {
    pregunta: '¿Cómo se desarrolla cada sesión?',
    respuesta: 'Cada sesión sigue estos momentos: (1) Ambientación y bienvenida — el facilitador presenta el objetivo del tema; (2) Lectura en común — se leen los textos de forma consciente y analítica; (3) Reflexión y trabajo personal — cada participante responde las preguntas en la plataforma; (4) Puesta en común — en grupos pequeños (no más de 6 personas) se comparten las respuestas; (5) Aportaciones y conclusiones — cada grupo presenta sus ideas al plenario; y (6) Compromisos — se registran hasta 3 compromisos grupales.',
  },
  {
    pregunta: '¿Qué actitudes necesito para participar bien?',
    respuesta: 'El manual recomienda cuatro actitudes fundamentales: (1) Apertura — disponer el corazón y la mente al encuentro con uno mismo y con los demás; (2) Silencio interior — escucharse a sí mismo con generosidad y en tranquilidad; (3) Escucha — dejar a un lado los prejuicios y etiquetas hacia los compañeros; y (4) Concentración — comprender tanto el mensaje de los textos como las aportaciones valiosas de los demás.',
  },
  {
    pregunta: '¿Cuál es el papel del facilitador?',
    respuesta: 'El facilitador es un guía, no un expositor. Su labor es promover que las sesiones se lleven a cabo con buen ritmo, participación y en los tiempos marcados. Además revisa las reflexiones escritas por los participantes antes de la sesión grupal, conduce la puesta en común, y al finalizar pregunta cómo se está viviendo el valor en la organización para definir compromisos.',
  },
  {
    pregunta: '¿Qué son los compromisos grupales?',
    respuesta: 'Son acuerdos concretos que el grupo establece al final de cada sesión para impulsar a vivir el valor trabajado. Se sugiere no generar más de 3 compromisos por sesión. Quedan registrados en la plataforma y son visibles para todo el grupo, lo que favorece la rendición de cuentas y el seguimiento.',
  },
  {
    pregunta: '¿Cómo me uno a un grupo?',
    respuesta: 'Tu facilitador creará el grupo y te compartirá un código de 6 caracteres (ej. AB12CD). Después de registrarte en la plataforma, verás en tu pantalla principal un campo para ingresar ese código. Al hacerlo, quedas asociado al grupo y podrás ver el módulo activo, los compromisos y el enlace de la sesión.',
  },
  {
    pregunta: '¿Qué necesito para usar la plataforma digital?',
    respuesta: 'Solo necesitas un dispositivo con acceso a internet (computadora, tablet o celular), tu correo electrónico para registrarte, y el código de grupo que te comparte tu facilitador. Una vez dentro, el facilitador activa el módulo que trabajarán y tú puedes seguir los pasos desde tu cuenta.',
  },
  {
    pregunta: '¿Cuánto tiempo toma completar un módulo?',
    respuesta: 'Depende del ritmo del grupo. El programa está diseñado para sesiones de trabajo presenciales o virtuales de entre 60 y 90 minutos aproximadamente. La parte digital (leer los textos, hacer el quiz y escribir la reflexión) puede realizarse antes de la sesión grupal o durante ella.',
  },
  {
    pregunta: '¿Las reflexiones son confidenciales?',
    respuesta: 'Las reflexiones escritas en la plataforma están asociadas a tu usuario y solo son visibles para ti y para el facilitador de tu grupo. No se comparten públicamente. La puesta en común oral durante la sesión la decide cada participante según su comodidad.',
  },
]

function FaqItem({ faq, idx }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="border border-purple-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white hover:bg-purple-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{faq.pregunta}</span>
        {abierto
          ? <ChevronUp size={18} className="text-morado flex-shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {abierto && (
        <div className="px-5 pb-4 pt-1 bg-purple-50 border-t border-purple-100">
          <p className="text-sm text-gray-700 leading-relaxed">{faq.respuesta}</p>
        </div>
      )}
    </div>
  )
}

const VALORES_CARD = [
  { icono: Heart, label: 'Amor', color: 'text-red-500' },
  { icono: Users, label: 'Solidaridad', color: 'text-blue-500' },
  { icono: Target, label: 'Bien Común', color: 'text-green-600' },
  { icono: Lightbulb, label: 'Verdad', color: 'text-yellow-500' },
  { icono: Star, label: 'Justicia', color: 'text-purple-600' },
  { icono: Clock, label: 'Perseverancia', color: 'text-orange-500' },
]

export default function InstructivoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-morado rounded-full mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-morado">¿Cómo funciona?</h1>
          <p className="text-gray-500 text-sm mt-2">Guía completa del programa Sembrando Valores Digital</p>
        </div>

        {/* Descripción del programa */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-morado mb-3">Sobre el programa</h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            <strong>Sembrando Valores</strong> es un programa de reflexión, formación y convivencia desarrollado por{' '}
            <strong>Misioneros en el Mundo del Trabajo (MMT)</strong>. Contiene <strong>14 módulos</strong> sobre
            valores y principios éticos humanos universales, diseñado para organizaciones y equipos de trabajo que
            buscan crecer en humanidad: siendo más productivos, más justos y más trascendentes.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Su metodología participativa favorece la reflexión introspectiva, el diálogo entre compañeros y la
            construcción de conclusiones a partir del análisis de la realidad, apoyándose en lecturas sencillas y
            profundas provenientes de la Doctrina Social de la Iglesia, autores humanistas y documentos de organismos
            nacionales e internacionales.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { num: '14', desc: 'valores y principios' },
              { num: '4', desc: 'pasos por módulo' },
              { num: '60–90', desc: 'minutos por sesión' },
            ].map((s) => (
              <div key={s.num} className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-extrabold text-morado">{s.num}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagrama de flujo */}
        <div className="mb-8">
          <DiagramaFlujo />
        </div>

        {/* Pasos por rol */}
        <h2 className="text-xl font-bold text-morado mb-6 text-center">Pasos según tu rol</h2>
        <div className="mb-10">
          <Instructivo />
        </div>

        {/* Actitudes para participar */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-morado mb-4">Actitudes para participar bien</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { num: 1, titulo: 'Apertura', desc: 'Disponer el corazón y la mente al encuentro con uno mismo y con los demás.' },
              { num: 2, titulo: 'Silencio interior', desc: 'Escucharse a sí mismo con generosidad y en tranquilidad.' },
              { num: 3, titulo: 'Escucha', desc: 'Dejar a un lado los prejuicios y etiquetas hacia los compañeros.' },
              { num: 4, titulo: 'Concentración', desc: 'Comprender el mensaje de los textos y las aportaciones valiosas de los demás.' },
            ].map((a) => (
              <div key={a.num} className="flex items-start gap-3">
                <span className="w-7 h-7 bg-dorado text-morado rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {a.num}
                </span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{a.titulo}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-morado mb-4 text-center">Preguntas frecuentes</h2>
        <div className="space-y-2 mb-10">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} idx={i} />
          ))}
        </div>

        {/* Contacto */}
        <div className="bg-morado rounded-2xl p-6 text-center">
          <p className="text-white font-semibold mb-2">¿Tienes más dudas?</p>
          <p className="text-purple-300 text-sm">
            Contacta a tu facilitador o escríbenos a{' '}
            <a href="mailto:info@misionerosmt.org" className="text-dorado hover:underline">
              info@misionerosmt.org
            </a>
          </p>
          <p className="text-purple-400 text-xs mt-1">Tel: 722 145 9192 · www.misionerosmt.org</p>
        </div>
      </div>
    </div>
  )
}
