import { useState } from 'react'
import { Headphones, CheckCircle, AlertCircle } from 'lucide-react'
import { CONTENIDOS } from '../../data/contenidos'

export default function PasoVideo({ modulo, onAvanzar }) {
  const [escuchado, setEscuchado] = useState(false)
  const contenido = CONTENIDOS[modulo.id] || {}
  const audioUrl = contenido.audio_url || modulo.audio_url || ''

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
      <h2 className="font-bold text-morado text-lg mb-2 flex items-center gap-2">
        <Headphones size={20} className="text-dorado" /> Paso 1 — Audio del módulo
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Escucha el audio completo antes de continuar al quiz.
      </p>

      {/* Audio */}
      <div className="bg-purple-50 rounded-xl p-6 mb-5 flex flex-col items-center gap-4">
        {audioUrl ? (
          <>
            <div className="w-20 h-20 bg-morado rounded-full flex items-center justify-center shadow-md">
              <Headphones size={36} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-morado text-center">{modulo.titulo}</p>
            <audio
              controls
              src={audioUrl}
              className="w-full max-w-sm"
              onEnded={() => setEscuchado(true)}
            >
              Tu navegador no soporta audio HTML5.
            </audio>
            <p className="text-xs text-gray-400">El audio se marca como escuchado al terminar</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-gray-400">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Headphones size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Audio próximamente</p>
              <p className="text-xs mt-1">El facilitador actualizará el enlace del audio</p>
            </div>
          </div>
        )}
      </div>

      {!audioUrl && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-xl mb-5">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>
            Este módulo aún no tiene audio configurado. Puedes marcar que escuchaste el contenido
            y continuar si tu facilitador ya lo compartió por otro medio.
          </span>
        </div>
      )}

      <div className="border-t border-gray-100 pt-5">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              escuchado ? 'bg-morado border-morado' : 'border-gray-300 group-hover:border-morado'
            }`}
            onClick={() => setEscuchado(!escuchado)}
          >
            {escuchado && <CheckCircle size={14} className="text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700">
            He escuchado el audio completo y estoy listo/a para continuar
          </span>
        </label>

        <button
          onClick={onAvanzar}
          disabled={!escuchado}
          className="mt-5 w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continuar al Quiz →
        </button>
      </div>
    </div>
  )
}
