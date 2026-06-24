import { useState } from 'react'
import { Play, CheckCircle, AlertCircle } from 'lucide-react'

export default function PasoVideo({ modulo, onAvanzar }) {
  const [visto, setVisto] = useState(false)

  const videoId = modulo.video_url
    ? modulo.video_url.match(/(?:youtu\.be\/|v=)([^&\s]+)/)?.[1] || modulo.video_url.match(/embed\/([^?]+)/)?.[1]
    : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
      <h2 className="font-bold text-morado text-lg mb-2 flex items-center gap-2">
        <Play size={20} className="text-dorado" /> Paso 1 — Video del módulo
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Ve el video completo antes de continuar al quiz.
      </p>

      {/* Video */}
      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-5">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title={`Video: ${modulo.titulo}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Play size={28} className="text-gray-400 ml-1" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Video próximamente</p>
              <p className="text-xs mt-1">El facilitador actualizará el enlace del video</p>
            </div>
          </div>
        )}
      </div>

      {!videoId && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-xl mb-5">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>
            Este módulo aún no tiene video configurado. Puedes marcar que viste el contenido
            y continuar si tu facilitador ya lo compartió por otro medio.
          </span>
        </div>
      )}

      <div className="border-t border-gray-100 pt-5">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              visto ? 'bg-morado border-morado' : 'border-gray-300 group-hover:border-morado'
            }`}
            onClick={() => setVisto(!visto)}
          >
            {visto && <CheckCircle size={14} className="text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700">
            He visto el video completo y estoy listo/a para continuar
          </span>
        </label>

        <button
          onClick={onAvanzar}
          disabled={!visto}
          className="mt-5 w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continuar al Quiz →
        </button>
      </div>
    </div>
  )
}
