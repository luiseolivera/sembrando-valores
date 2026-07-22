import { useState, useEffect } from 'react'
import { supabase, DEMO_MODE, esPerfilExploracion } from '../../lib/supabase'
import { Target, Plus, CheckCircle, Trash2, Trophy, Sparkles, AlertTriangle } from 'lucide-react'

const SUGERENCIAS = {
  1: ['Llamar a alguien por su nombre y mirarle a los ojos al hablar', 'Reconocer en voz alta un aporte de un compañero esta semana', 'Evitar hablar de alguien en términos que reduzcan su dignidad'],
  2: ['Preguntar a alguien de mi equipo cómo está realmente, más allá del trabajo', 'Revisar una decisión pensando en su impacto en las personas', 'Proponer en una reunión que se considere el bienestar del equipo'],
  3: ['Llegar a casa a la hora acordada al menos tres días esta semana', 'Apagar el celular de trabajo durante la cena familiar', 'Compartir con mi familia algo bueno que me pasó en el trabajo'],
  4: ['Hacer un gesto de amabilidad no solicitado a un compañero', 'Agradecer a alguien que normalmente no recibe reconocimiento', 'Escuchar sin interrumpir a alguien que quiere hablar'],
  5: ['Leer o escuchar algo nuevo sobre mi área de trabajo esta semana', 'Compartir un aprendizaje con mi equipo', 'Identificar una habilidad que quiero desarrollar y buscar cómo'],
  6: ['Proponer una idea en la próxima reunión de equipo', 'Preguntar la opinión de alguien que generalmente no habla', 'Involucrarme en una decisión en la que normalmente no participo'],
  7: ['Ofrecer ayuda a un compañero que esté sobrecargado', 'Defender a alguien que está siendo tratado injustamente', 'Compartir algo mío (tiempo, conocimiento, recursos) con quien lo necesite'],
  8: ['Dejar que alguien de mi equipo resuelva solo un problema que puede manejar', 'Pedir ayuda solo cuando genuinamente la necesite', 'Dar crédito a quien tomó la iniciativa de resolver algo'],
  9: ['Tomar una decisión pensando en cómo afecta a todos, no solo a mí', 'Proponer que los beneficios de un logro se compartan en el equipo', 'Identificar a alguien que siempre queda fuera y asegurarme de incluirlo'],
  10: ['Decir la verdad en una situación donde sería más cómodo callar', 'Admitir un error propio ante mi equipo', 'Cumplir una promesa que tengo pendiente'],
  11: ['Decir "no" a algo que va contra mi conciencia, aunque implique presión', 'Tomar una decisión que he estado posponiendo por miedo', 'Dar espacio a alguien de mi equipo para decidir sin intervenir'],
  12: ['Defender el trato justo para alguien que está siendo ignorado', 'Revisar si alguien de mi equipo está recibiendo menos de lo que merece', 'Proponer una mejora en los procesos para que sean más justos'],
  13: ['Informarme sobre un tema de mi comunidad o ciudad', 'Participar en una reunión de mi comunidad, sindicato o asociación', 'Votar o alentar a otros a hacerlo en la próxima elección'],
  14: ['Reducir el uso de plástico de un solo uso esta semana', 'Apagar las luces y equipos que no se usan en mi lugar de trabajo', 'Proponer una acción ambiental en mi equipo u organización'],
}

export default function PasoCompromisos({ modulo, perfil, onAvanzar }) {
  const [compromisos, setCompromisos] = useState(['', '', ''])
  const [guardados, setGuardados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [exploracion, setExploracion] = useState(false)
  const sugerencias = SUGERENCIAS[modulo.id] || []

  useEffect(() => {
    if (!DEMO_MODE) cargarCompromisos()
  }, [])

  async function cargarCompromisos() {
    const { data } = await supabase
      .from('compromisos_personales')
      .select('*')
      .eq('usuario_id', perfil.id)
      .eq('modulo_id', modulo.id)
      .order('created_at')
    if (data?.length) {
      setGuardados(data)
      setExito(true)
    }
  }

  function usarSugerencia(texto, idx) {
    const nuevos = [...compromisos]
    nuevos[idx] = texto
    setCompromisos(nuevos)
  }

  async function guardar() {
    const validos = compromisos.filter(c => c.trim().length > 0)
    if (!validos.length) return
    if (esPerfilExploracion(perfil)) { setExploracion(true); return }
    setGuardando(true)

    if (!DEMO_MODE) {
      const registros = validos.map(texto => ({
        usuario_id: perfil.id,
        modulo_id: modulo.id,
        compromiso_texto: texto,
        cumplido: false,
      }))
      await supabase.from('compromisos_personales').insert(registros)
    }

    setGuardados(validos.map((t, i) => ({ id: i, compromiso_texto: t, cumplido: false })))
    setGuardando(false)
    setExito(true)
  }

  async function marcarCumplido(id, cumplido) {
    setGuardados(prev => prev.map(c => c.id === id ? { ...c, cumplido: !cumplido } : c))
    if (!DEMO_MODE) {
      await supabase.from('compromisos_personales').update({ cumplido: !cumplido }).eq('id', id)
    }
  }

  const hayCompromisos = compromisos.some(c => c.trim())

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
      <h2 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
        <Target size={20} className="text-dorado" /> Paso 3 — Mis compromisos personales
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        ¿Qué vas a hacer diferente después de este módulo? Escribe de 1 a 3 compromisos concretos.
      </p>

      {/* Sugerencias */}
      {sugerencias.length > 0 && !exito && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Sparkles size={13} className="text-dorado" /> Ideas para inspirarte
          </p>
          <div className="flex flex-col gap-2">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  const idx = compromisos.findIndex(c => !c.trim())
                  if (idx !== -1) usarSugerencia(s, idx)
                }}
                className="text-left text-xs text-morado bg-purple-50 border border-purple-100 px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compromisos ya guardados */}
      {exito && guardados.length > 0 ? (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tus compromisos</p>
          {guardados.map((c) => (
            <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${c.cumplido ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-100'}`}>
              <button
                onClick={() => marcarCumplido(c.id, c.cumplido)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${c.cumplido ? 'bg-green-500 border-green-500' : 'border-yellow-400 hover:border-green-400'}`}
              >
                {c.cumplido && <CheckCircle size={14} className="text-white" />}
              </button>
              <p className={`text-sm flex-1 ${c.cumplido ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {c.compromiso_texto}
              </p>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-xl mt-2">
            <CheckCircle size={14} /> Compromisos guardados. Puedes marcarlos cuando los cumplas.
          </div>
        </div>
      ) : (
        /* Formulario */
        <div className="space-y-3 mb-5">
          {compromisos.map((texto, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-dorado rounded-full flex items-center justify-center text-morado font-bold text-xs flex-shrink-0 mt-2">
                {i + 1}
              </div>
              <textarea
                value={texto}
                onChange={e => {
                  const nuevos = [...compromisos]
                  nuevos[i] = e.target.value
                  setCompromisos(nuevos)
                }}
                rows={2}
                placeholder={i === 0 ? 'Escribe tu primer compromiso...' : `Compromiso ${i + 1} (opcional)`}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {exploracion && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertTriangle size={16} /> Estás en modo de exploración — regístrate o inicia sesión para guardar tus compromisos.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {!exito && (
          <button
            onClick={guardar}
            disabled={!hayCompromisos || guardando}
            className="flex-1 flex items-center justify-center gap-2 bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar mis compromisos'}
          </button>
        )}
        <button
          onClick={onAvanzar}
          className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors ${
            exito
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Trophy size={16} />
          {exito ? '¡Módulo completado!' : 'Terminar sin compromisos'}
        </button>
      </div>
    </div>
  )
}
