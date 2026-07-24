import { ShieldCheck } from 'lucide-react'

const SECCIONES = [
  {
    titulo: '1. Responsable del tratamiento de tus datos',
    cuerpo: `Misioneros en el Mundo del Trabajo, A. C. (MMT), con domicilio en Paseo San Isidro 318, planta alta, La Noria, Metepec, Estado de México, C.P. 52170, es responsable del uso y protección de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).`,
  },
  {
    titulo: '2. Datos personales que recabamos',
    cuerpo: `A través de la plataforma Sembrando Valores Digital recabamos:
• Datos de identificación: nombre completo y correo electrónico.
• Datos de la cuenta: contraseña (almacenada de forma cifrada, nunca la vemos en texto plano) y rol (participante o facilitador).
• Datos de participación: grupo al que perteneces, progreso en los módulos, resultados de quiz.
• Datos de reflexión personal: tus respuestas escritas a las preguntas de reflexión de cada módulo y los compromisos personales que registres.

No recabamos datos financieros, de salud, ni otros datos personales sensibles.`,
  },
  {
    titulo: '3. Finalidades del tratamiento',
    cuerpo: `Usamos tus datos para:
• Crear y administrar tu cuenta en la plataforma.
• Permitir tu participación en el programa formativo (módulos, quiz, reflexiones, sesiones grupales).
• Que el facilitador de tu grupo pueda dar seguimiento a tu progreso, revisar tus reflexiones y compromisos, y coordinar la sesión grupal.
• Generar estadísticas internas para mejorar el programa (de forma agregada, sin identificarte individualmente).
• Comunicarnos contigo sobre tu cuenta o el programa.`,
  },
  {
    titulo: '4. Transferencia de datos',
    cuerpo: `Tus reflexiones y compromisos personales son visibles únicamente para ti y para el facilitador del grupo al que perteneces — no se comparten públicamente ni con otros participantes.

Para operar la plataforma usamos proveedores de infraestructura tecnológica (hosting y base de datos) que pueden almacenar información en servidores fuera de México. No vendemos, rentamos ni compartimos tus datos con terceros para fines comerciales o publicitarios.`,
  },
  {
    titulo: '5. Derechos ARCO',
    cuerpo: `Tienes derecho a Acceder, Rectificar o Cancelar tus datos personales, así como a Oponerte a su tratamiento ("derechos ARCO"). Para ejercerlos, escríbenos a info@misionerosmt.org indicando tu nombre, el derecho que deseas ejercer, y una descripción clara de tu solicitud. Responderemos en un plazo razonable conforme a la ley aplicable.`,
  },
  {
    titulo: '6. Uso de la información dentro de la plataforma',
    cuerpo: `La plataforma usa el almacenamiento local del navegador (localStorage) únicamente para mantener tu sesión iniciada — no usamos cookies de rastreo ni compartimos tu actividad con redes de publicidad.`,
  },
  {
    titulo: '7. Menores de edad',
    cuerpo: `El programa está dirigido a personas mayores de edad en el contexto de equipos de trabajo y organizaciones. Si una persona menor de edad participa, debe contar con el consentimiento de su padre, madre o tutor.`,
  },
  {
    titulo: '8. Cambios a este aviso',
    cuerpo: `Podemos actualizar este aviso de privacidad. Cualquier cambio se publicará en esta misma página con la fecha de última actualización.`,
  },
]

export default function AvisoPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-morado">Aviso de Privacidad</h1>
        </div>
        <p className="text-xs text-gray-400 mb-8">Última actualización: 24 de julio de 2026</p>

        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 sm:p-8 space-y-8">
          {SECCIONES.map((s, i) => (
            <div key={i}>
              <h2 className="font-bold text-morado text-base mb-2">{s.titulo}</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{s.cuerpo}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              ¿Dudas sobre este aviso? Escríbenos a{' '}
              <a href="mailto:info@misionerosmt.org" className="text-morado font-semibold hover:underline">
                info@misionerosmt.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
