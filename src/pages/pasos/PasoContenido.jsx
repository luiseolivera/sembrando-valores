import { useState, useRef } from 'react'
import { BookOpen, Headphones, CheckCircle, Play, Square } from 'lucide-react'
import { CONTENIDOS } from '../../data/contenidos'

const TABS = [
  { key: 'texto', label: 'Leer texto', icono: BookOpen },
  { key: 'audio', label: 'Escuchar audio', icono: Headphones },
]

// Divide el texto en: título principal + array de secciones {titulo, cuerpo}
function parsearSecciones(texto) {
  if (!texto) return { titulo: '', secciones: [] }
  const lineas = texto.split('\n')
  let titulo = ''
  const secciones = []
  let seccionActual = null

  for (const linea of lineas) {
    if (linea.startsWith('## ')) {
      titulo = linea.replace('## ', '')
    } else if (linea.startsWith('### ')) {
      if (seccionActual) secciones.push(seccionActual)
      seccionActual = { titulo: linea.replace('### ', ''), lineas: [] }
    } else if (seccionActual) {
      seccionActual.lineas.push(linea)
    }
  }
  if (seccionActual) secciones.push(seccionActual)
  return { titulo, secciones }
}

function limpiarParaTTS(lineas) {
  return lineas
    .map(l => l.replace(/\*\*/g, '').replace(/^- /, '').replace(/^\d+\. /, ''))
    .join(' ')
    .trim()
}

function RenderLinea({ linea, i }) {
  if (linea.startsWith('**') && linea.endsWith('**')) return (
    <p key={i} className="bg-purple-50 border-l-4 border-morado px-4 py-3 rounded-r-xl text-morado font-medium italic text-sm">
      {linea.replace(/\*\*/g, '')}
    </p>
  )
  if (linea.startsWith('- ')) return (
    <div key={i} className="flex items-start gap-2">
      <span className="text-dorado mt-1.5 flex-shrink-0">●</span>
      <span>{linea.replace('- ', '').replace(/\*\*([^*]+)\*\*/g, (_, t) => t)}</span>
    </div>
  )
  if (linea.match(/^\d+\. /)) return (
    <div key={i} className="flex items-start gap-2">
      <span className="bg-morado text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        {linea.match(/^(\d+)/)[1]}
      </span>
      <span>{linea.replace(/^\d+\. /, '').replace(/\*\*([^*]+)\*\*/g, (_, t) => t)}</span>
    </div>
  )
  if (linea.trim() === '') return <div key={i} className="h-1" />
  return <p key={i}>{linea.replace(/\*\*([^*]+)\*\*/g, (_, t) => t)}</p>
}

function BotonTTS({ texto, label }) {
  const [leyendo, setLeyendo] = useState(false)

  function toggleLeer() {
    if (!('speechSynthesis' in window)) return
    if (leyendo) {
      window.speechSynthesis.cancel()
      setLeyendo(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'es-MX'
    utterance.rate = 0.9
    utterance.onend = () => setLeyendo(false)
    utterance.onerror = () => setLeyendo(false)
    window.speechSynthesis.speak(utterance)
    setLeyendo(true)
  }

  return (
    <button
      onClick={toggleLeer}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
        leyendo
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-purple-100 text-morado hover:bg-purple-200'
      }`}
    >
      {leyendo ? <><Square size={10} /> Detener</> : <><Play size={10} /> Escuchar</>}
    </button>
  )
}

export default function PasoContenido({ modulo, onAvanzar }) {
  const contenido = CONTENIDOS[modulo.id] || {}
  const [tabActiva, setTabActiva] = useState('texto')
  const [visto, setVisto] = useState(false)
  const tieneAudio = !!contenido.audio_url
  const { titulo, secciones } = parsearSecciones(contenido.texto)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {TABS.map(({ key, label, icono: Icono }) => {
          const disponible = key === 'texto' ? true : tieneAudio
          return (
            <button
              key={key}
              onClick={() => disponible && setTabActiva(key)}
              disabled={!disponible}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                tabActiva === key
                  ? 'border-morado text-morado bg-purple-50'
                  : disponible
                  ? 'border-transparent text-gray-400 hover:text-morado hover:bg-purple-50'
                  : 'border-transparent text-gray-200 cursor-not-allowed'
              }`}
            >
              <Icono size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="p-6">
        {/* TAB: TEXTO */}
        {tabActiva === 'texto' && (
          <div className="space-y-6" style={{ fontSize: '15px', lineHeight: '1.8' }}>
            {titulo && (
              <h2 className="text-xl font-bold text-morado">{titulo}</h2>
            )}

            {secciones.length > 0 ? secciones.map((sec, si) => (
              <div key={si} className="border border-purple-50 rounded-xl p-4 bg-gray-50">
                {/* Encabezado de sección con botón */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-800">{sec.titulo}</h3>
                  <BotonTTS texto={limpiarParaTTS(sec.lineas)} label={sec.titulo} />
                </div>
                {/* Contenido de la sección */}
                <div className="space-y-2 text-gray-700">
                  {sec.lineas.map((linea, i) => (
                    <RenderLinea key={i} linea={linea} i={i} />
                  ))}
                </div>
              </div>
            )) : (
              <p className="text-gray-400 italic">Contenido próximamente.</p>
            )}
          </div>
        )}

        {/* TAB: AUDIO */}
        {tabActiva === 'audio' && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            {tieneAudio ? (
              <>
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <Headphones size={36} className="text-morado" />
                </div>
                <p className="text-sm font-semibold text-gray-700 text-center">
                  Audio — {modulo.titulo}
                </p>
                <audio
                  controls
                  src={contenido.audio_url}
                  className="w-full max-w-sm"
                  onEnded={() => setVisto(true)}
                >
                  Tu navegador no soporta audio HTML5.
                </audio>
                <p className="text-xs text-gray-400">El audio se marca como escuchado al terminar</p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Headphones size={28} className="text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500 text-sm">Audio no disponible aún</p>
                <p className="text-xs text-gray-400 mt-1">El facilitador lo agregará próximamente</p>
              </div>
            )}
          </div>
        )}

        {/* Confirmación */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer group mb-5">
            <div
              onClick={() => setVisto(!visto)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                visto ? 'bg-morado border-morado' : 'border-gray-300 group-hover:border-morado'
              }`}
            >
              {visto && <CheckCircle size={14} className="text-white" />}
            </div>
            <span className="text-sm font-medium text-gray-700">
              He leído los textos completos y/o escuchado los audios y estoy listo/a para continuar
            </span>
          </label>

          <button
            onClick={onAvanzar}
            disabled={!visto}
            className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar a la reflexión →
          </button>
        </div>
      </div>
    </div>
  )
}
