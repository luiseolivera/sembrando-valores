import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import PasoContenido from './pasos/PasoContenido'
import PasoQuiz from './pasos/PasoQuiz'
import PasoReflexion from './pasos/PasoReflexion'
import PasoCompromisos from './pasos/PasoCompromisos'
import { BookOpen, CheckSquare, PenLine, Target, ChevronLeft, CheckCircle } from 'lucide-react'

const PASOS_CONFIG = [
  { key: 'contenido', label: 'Contenido', icono: BookOpen },
  { key: 'quiz', label: 'Quiz', icono: CheckSquare },
  { key: 'reflexion', label: 'Reflexión', icono: PenLine },
  { key: 'compromisos', label: 'Compromisos', icono: Target },
]

export default function Modulo() {
  const { id } = useParams()
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const modulo = MODULOS.find(m => m.id === parseInt(id))
  const [pasoActual, setPasoActual] = useState('contenido')
  const [progreso, setProgreso] = useState({ contenido: false, quiz: false, reflexion: false, compromisos: false })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (modulo) cargarProgreso()
  }, [modulo])

  async function cargarProgreso() {
    if (DEMO_MODE) { setCargando(false); return }
    const [quizRes, reflexRes, compRes] = await Promise.all([
      supabase.from('quiz_respuestas').select('aprobado').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle(),
      supabase.from('reflexiones').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).limit(1),
      supabase.from('compromisos_personales').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).limit(1),
    ])
    const quizOk = quizRes.data?.aprobado || false
    const reflexOk = (reflexRes.data?.length || 0) > 0
    const compOk = (compRes.data?.length || 0) > 0

    const nuevo = { contenido: quizOk || reflexOk, quiz: quizOk, reflexion: reflexOk, compromisos: compOk }
    setProgreso(nuevo)

    if (!nuevo.contenido) setPasoActual('contenido')
    else if (!nuevo.quiz) setPasoActual('quiz')
    else if (!nuevo.reflexion) setPasoActual('reflexion')
    else setPasoActual('compromisos')
    setCargando(false)
  }

  function avanzar() {
    const orden = ['contenido', 'quiz', 'reflexion', 'compromisos']
    const i = orden.indexOf(pasoActual)
    setProgreso(p => ({ ...p, [pasoActual]: true }))
    if (i < orden.length - 1) {
      setPasoActual(orden[i + 1])
    } else {
      setProgreso(p => ({ ...p, compromisos: true }))
      navigate('/dashboard')
    }
  }

  function irAPaso(key) {
    const orden = ['contenido', 'quiz', 'reflexion', 'compromisos']
    const idxDestino = orden.indexOf(key)
    const idxActual = orden.indexOf(pasoActual)
    if (idxDestino <= idxActual || progreso[orden[idxDestino - 1]]) {
      setPasoActual(key)
    }
  }

  if (!modulo) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Módulo no encontrado.</p>
    </div>
  )

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const porciento = Math.round((Object.values(progreso).filter(Boolean).length / 4) * 100)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-morado text-sm font-medium mb-5 hover:underline">
          <ChevronLeft size={16} /> Volver al inicio
        </button>

        {/* Cabecera del módulo */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Módulo {modulo.numero} de {MODULOS.length}</p>
              <h1 className="text-2xl font-extrabold text-morado">{modulo.titulo}</h1>
            </div>
            <span className="text-sm font-bold text-morado bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {porciento}%
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{modulo.objetivo_general}</p>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div className="h-1.5 bg-morado rounded-full transition-all duration-500" style={{ width: `${porciento}%` }} />
          </div>

          {/* Stepper clicable */}
          <div className="flex items-center">
            {PASOS_CONFIG.map((p, i) => {
              const completado = progreso[p.key]
              const activo = pasoActual === p.key
              const Icono = p.icono
              const accesible = i === 0 || progreso[PASOS_CONFIG[i - 1].key]
              return (
                <div key={p.key} className="flex items-center flex-1">
                  <button
                    onClick={() => irAPaso(p.key)}
                    disabled={!accesible}
                    className="flex flex-col items-center gap-1 flex-1 disabled:cursor-not-allowed"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      completado ? 'bg-green-500 text-white shadow-sm'
                        : activo ? 'bg-morado text-white shadow-md ring-2 ring-purple-200'
                        : accesible ? 'bg-gray-100 text-gray-400 hover:bg-purple-50 hover:text-morado'
                        : 'bg-gray-50 text-gray-200'
                    }`}>
                      {completado ? <CheckCircle size={18} /> : <Icono size={16} />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      activo ? 'text-morado' : completado ? 'text-green-600' : 'text-gray-300'
                    }`}>{p.label}</span>
                  </button>
                  {i < PASOS_CONFIG.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded mx-1 mb-4 transition-all ${completado ? 'bg-green-300' : 'bg-gray-100'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contenido del paso activo */}
        {pasoActual === 'contenido' && <PasoContenido modulo={modulo} onAvanzar={avanzar} />}
        {pasoActual === 'quiz' && <PasoQuiz modulo={modulo} perfil={perfil} onAvanzar={avanzar} />}
        {pasoActual === 'reflexion' && <PasoReflexion modulo={modulo} perfil={perfil} onAvanzar={avanzar} />}
        {pasoActual === 'compromisos' && <PasoCompromisos modulo={modulo} perfil={perfil} onAvanzar={avanzar} />}
      </div>
    </div>
  )
}
