import { useState } from 'react'
import { supabase, esPerfilExploracion } from '../../lib/supabase'
import { CheckSquare, XCircle, CheckCircle, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react'

export default function PasoQuiz({ modulo, perfil, onAvanzar }) {
  const preguntas = modulo.preguntas_quiz
  const [respuestas, setRespuestas] = useState(Array(preguntas.length).fill(null))
  const [enviado, setEnviado] = useState(false)
  const [puntaje, setPuntaje] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [exploracion, setExploracion] = useState(false)

  function seleccionar(pregIdx, opIdx) {
    if (enviado) return
    const nuevas = [...respuestas]
    nuevas[pregIdx] = opIdx
    setRespuestas(nuevas)
  }

  async function enviar() {
    if (respuestas.some((r) => r === null)) return
    if (esPerfilExploracion(perfil)) { setExploracion(true); return }
    const correctas = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
    const pct = Math.round((correctas / preguntas.length) * 100)
    setPuntaje(pct)
    setEnviado(true)
    setGuardando(true)

    await supabase.from('quiz_respuestas').upsert({
      usuario_id: perfil.id,
      modulo_id: modulo.id,
      puntaje: pct,
      aprobado: pct >= 70,
    }, { onConflict: 'usuario_id,modulo_id' })

    setGuardando(false)
  }

  function reintentar() {
    setRespuestas(Array(preguntas.length).fill(null))
    setEnviado(false)
    setPuntaje(0)
  }

  const aprobado = puntaje >= 70
  const letras = ['a', 'b', 'c', 'd']

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
      <h2 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
        <CheckSquare size={20} className="text-dorado" /> Paso 2 — Quiz de comprensión
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Necesitas al menos 70% para continuar. Responde con cuidado.
      </p>

      {exploracion && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertTriangle size={16} /> Estás en modo de exploración — regístrate o inicia sesión para guardar tus resultados.
        </div>
      )}

      {enviado && (
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${
          aprobado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {aprobado
            ? <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            : <XCircle size={24} className="text-red-500 flex-shrink-0" />
          }
          <div>
            <p className={`font-bold text-base ${aprobado ? 'text-green-700' : 'text-red-700'}`}>
              {aprobado ? `¡Excelente! Obtuviste ${puntaje}%` : `Obtuviste ${puntaje}% — necesitas 70%`}
            </p>
            <p className={`text-xs ${aprobado ? 'text-green-600' : 'text-red-500'}`}>
              {aprobado ? 'Puedes continuar a la reflexión personal.' : 'Regresa a escuchar el audio e inténtalo de nuevo.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {preguntas.map((pregunta, pi) => (
          <div key={pi} className="border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-gray-800 text-sm mb-3">
              {pi + 1}. {pregunta.pregunta}
            </p>
            <div className="space-y-2">
              {pregunta.opciones.map((op, oi) => {
                const seleccionada = respuestas[pi] === oi
                const esCorrecta = oi === pregunta.correcta
                let estilo = 'border-gray-200 bg-gray-50 text-gray-700 hover:border-morado hover:bg-purple-50'
                if (enviado) {
                  if (esCorrecta) estilo = 'border-green-400 bg-green-50 text-green-800'
                  else if (seleccionada && !esCorrecta) estilo = 'border-red-400 bg-red-50 text-red-700'
                  else estilo = 'border-gray-100 bg-gray-50 text-gray-400'
                } else if (seleccionada) {
                  estilo = 'border-morado bg-purple-50 text-morado'
                }

                return (
                  <button
                    key={oi}
                    onClick={() => seleccionar(pi, oi)}
                    disabled={enviado}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${estilo}`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      seleccionada && !enviado ? 'border-morado bg-morado text-white' :
                      enviado && esCorrecta ? 'border-green-500 bg-green-500 text-white' :
                      enviado && seleccionada ? 'border-red-500 bg-red-500 text-white' :
                      'border-gray-300 text-gray-400'
                    }`}>
                      {letras[oi]}
                    </span>
                    {op}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {!enviado ? (
          <button
            onClick={enviar}
            disabled={respuestas.some((r) => r === null) || guardando}
            className="flex-1 bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enviar respuestas
          </button>
        ) : aprobado ? (
          <button
            onClick={onAvanzar}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Continuar a la reflexión <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={reintentar}
            className="flex-1 bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Volver al audio e intentar de nuevo
          </button>
        )}
      </div>
    </div>
  )
}
