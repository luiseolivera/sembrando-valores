import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { PenLine, CheckCircle, Save } from 'lucide-react'

export default function PasoReflexion({ modulo, perfil, onAvanzar }) {
  const preguntas = modulo.preguntas_reflexion
  const [respuestas, setRespuestas] = useState(Array(preguntas.length).fill(''))
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarReflexiones()
  }, [])

  async function cargarReflexiones() {
    const { data } = await supabase
      .from('reflexiones')
      .select('pregunta_numero, respuesta_texto')
      .eq('usuario_id', perfil.id)
      .eq('modulo_id', modulo.id)
    if (data?.length) {
      const nuevas = [...respuestas]
      data.forEach((r) => { nuevas[r.pregunta_numero - 1] = r.respuesta_texto })
      setRespuestas(nuevas)
      setGuardado(true)
    }
    setCargando(false)
  }

  async function guardar() {
    if (respuestas.some((r) => r.trim().length < 10)) return
    setGuardando(true)
    const registros = preguntas.map((_, i) => ({
      usuario_id: perfil.id,
      modulo_id: modulo.id,
      pregunta_numero: i + 1,
      respuesta_texto: respuestas[i],
    }))
    await supabase.from('reflexiones').upsert(registros, { onConflict: 'usuario_id,modulo_id,pregunta_numero' })
    setGuardado(true)
    setGuardando(false)
  }

  const todasCompletas = respuestas.every((r) => r.trim().length >= 10)

  if (cargando) return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 text-center">
      <div className="w-8 h-8 border-4 border-morado border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
      <h2 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
        <PenLine size={20} className="text-dorado" /> Paso 3 — Reflexión personal
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Tómate el tiempo necesario. Tus respuestas son personales y solo las verá tu facilitador.
      </p>

      <div className="space-y-5">
        {preguntas.map((pregunta, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-gray-800 text-sm mb-3">
              {i + 1}. {pregunta}
            </p>
            <textarea
              value={respuestas[i]}
              onChange={(e) => {
                const nuevas = [...respuestas]
                nuevas[i] = e.target.value
                setRespuestas(nuevas)
                if (guardado) setGuardado(false)
              }}
              rows={4}
              placeholder="Escribe tu reflexión aquí..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-morado focus:border-transparent resize-none text-gray-700 placeholder-gray-300"
            />
            <p className="text-xs text-gray-400 mt-1">
              {respuestas[i].length} caracteres {respuestas[i].length < 10 && '(mínimo 10)'}
            </p>
          </div>
        ))}
      </div>

      {guardado && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mt-5">
          <CheckCircle size={16} />
          Tus reflexiones han sido guardadas correctamente.
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          onClick={guardar}
          disabled={!todasCompletas || guardando}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-morado font-bold py-3 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-purple-100"
        >
          <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar reflexiones'}
        </button>
        <button
          onClick={onAvanzar}
          disabled={!guardado}
          className="flex-1 bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continuar a la sesión grupal →
        </button>
      </div>
    </div>
  )
}
