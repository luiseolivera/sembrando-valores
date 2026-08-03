import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE, esPerfilExploracion } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import PasoContenido from './pasos/PasoContenido'
import PasoQuiz from './pasos/PasoQuiz'
import PasoReflexion from './pasos/PasoReflexion'
import PasoSesion from './pasos/PasoSesion'
import PasoCompromisos from './pasos/PasoCompromisos'
import { BookOpen, CheckSquare, PenLine, Users, Target, ChevronLeft, CheckCircle, Lock, LogOut } from 'lucide-react'

const PASOS_CONFIG = [
  { key: 'contenido', label: 'Contenido', icono: BookOpen },
  { key: 'quiz', label: 'Quiz', icono: CheckSquare },
  { key: 'reflexion', label: 'Reflexión', icono: PenLine },
  { key: 'sesion', label: 'Sesión', icono: Users },
  { key: 'compromisos', label: 'Compromisos', icono: Target },
]

const ORDEN_PASOS = ['contenido', 'quiz', 'reflexion', 'sesion', 'compromisos']

export default function Modulo() {
  const { id } = useParams()
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const modulo = MODULOS.find(m => m.id === parseInt(id))
  const [pasoActual, setPasoActual] = useState('contenido')
  const [progreso, setProgreso] = useState({ contenido: false, quiz: false, reflexion: false, sesion: false, compromisos: false })
  const [cargando, setCargando] = useState(true)
  const [moduloActivoGrupo, setModuloActivoGrupo] = useState(null)
  const [moduloAnteriorCompleto, setModuloAnteriorCompleto] = useState(true)
  const [saliendoGrupo, setSaliendoGrupo] = useState(false)
  const [errorSalir, setErrorSalir] = useState('')

  const moduloIndex = MODULOS.findIndex(m => m.id === modulo?.id)
  const moduloAnterior = moduloIndex > 0 ? MODULOS[moduloIndex - 1] : null

  useEffect(() => {
    if (modulo) cargarProgreso()
  }, [modulo])

  async function cargarProgreso() {
    if (DEMO_MODE) { setCargando(false); return }

    const promesas = {
      quiz: supabase.from('quiz_respuestas').select('aprobado').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle(),
      reflexion: supabase.from('reflexiones').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).limit(1),
      habilitacion: supabase.from('habilitaciones_compromisos').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle(),
      compromisos: supabase.from('compromisos_personales').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).limit(1),
    }
    if (perfil.rol === 'participante' && perfil.grupo_id) {
      promesas.grupo = supabase.from('grupos').select('modulo_activo_id').eq('id', perfil.grupo_id).maybeSingle()
    }
    if (perfil.rol === 'participante' && moduloAnterior) {
      promesas.anterior = supabase.from('compromisos_personales').select('id').eq('usuario_id', perfil.id).eq('modulo_id', moduloAnterior.id).limit(1)
    }
    const claves = Object.keys(promesas)
    const results = await Promise.all(claves.map((k) => promesas[k]))
    const res = Object.fromEntries(claves.map((k, i) => [k, results[i]]))

    if (res.grupo) setModuloActivoGrupo(res.grupo.data?.modulo_activo_id ?? null)
    if (res.anterior) setModuloAnteriorCompleto((res.anterior.data?.length || 0) > 0)

    const quizOk = res.quiz.data?.aprobado || false
    const reflexOk = (res.reflexion.data?.length || 0) > 0
    const sesionOk = !!res.habilitacion.data
    const compOk = (res.compromisos.data?.length || 0) > 0

    const nuevo = { contenido: quizOk || reflexOk, quiz: quizOk, reflexion: reflexOk, sesion: sesionOk, compromisos: compOk }
    setProgreso(nuevo)

    if (!nuevo.contenido) setPasoActual('contenido')
    else if (!nuevo.quiz) setPasoActual('quiz')
    else if (!nuevo.reflexion) setPasoActual('reflexion')
    else if (!nuevo.compromisos) setPasoActual(nuevo.sesion ? 'compromisos' : 'sesion')
    else setPasoActual('compromisos')
    setCargando(false)
  }

  const bloqueadoPorGrupo = perfil?.rol === 'participante' && perfil?.grupo_id && modulo && moduloActivoGrupo !== modulo.id
  const bloqueadoPorOrden = perfil?.rol === 'participante' && !bloqueadoPorGrupo && !moduloAnteriorCompleto

  async function salirDelGrupo() {
    if (esPerfilExploracion(perfil)) {
      setErrorSalir('Estás en modo de exploración — regístrate o inicia sesión para salir de un grupo real.')
      return
    }
    if (!confirm('¿Salir de tu grupo? Podrás solicitar integrarte a uno nuevo, pero dejarás de ver el módulo activo y los compromisos de este grupo.')) return
    setErrorSalir('')
    setSaliendoGrupo(true)
    const { data, error } = await supabase.from('usuarios').update({ grupo_id: null }).eq('id', perfil.id).select()
    if (error || !data || data.length === 0) {
      setErrorSalir('Ocurrió un error al salir del grupo. Intenta de nuevo.')
      setSaliendoGrupo(false)
    } else {
      navigate('/dashboard')
      window.location.reload()
    }
  }

  function avanzar() {
    const i = ORDEN_PASOS.indexOf(pasoActual)
    setProgreso(p => ({ ...p, [pasoActual]: true }))
    if (i < ORDEN_PASOS.length - 1) {
      setPasoActual(ORDEN_PASOS[i + 1])
    } else {
      setProgreso(p => ({ ...p, compromisos: true }))
      navigate('/dashboard')
    }
  }

  function irAPaso(key) {
    const idxDestino = ORDEN_PASOS.indexOf(key)
    const idxActual = ORDEN_PASOS.indexOf(pasoActual)
    if (idxDestino <= idxActual || progreso[ORDEN_PASOS[idxDestino - 1]]) {
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

  if (bloqueadoPorGrupo) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-dorado-dark" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo no disponible todavía</h2>
        <p className="text-gray-500 text-sm mb-6">
          {moduloActivoGrupo
            ? 'Tu grupo está trabajando otro módulo. Este se habilitará cuando tu facilitador lo active.'
            : 'Tu facilitador todavía no activó ningún módulo para tu grupo.'}
        </p>
        <button onClick={() => navigate('/dashboard')} className="text-morado font-semibold text-sm hover:underline">← Volver al inicio</button>
      </div>
    </div>
  )

  if (bloqueadoPorOrden) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={32} className="text-dorado-dark" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo no disponible todavía</h2>
        <p className="text-gray-500 text-sm mb-6">
          Debes terminar el Módulo {moduloAnterior?.numero} — {moduloAnterior?.titulo} (incluida tu sesión grupal) antes de avanzar a este.
        </p>
        {perfil?.grupo_id ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Tu grupo ya avanzó a este módulo, así que no puedes volver a trabajar el anterior ahí. Puedes salir del grupo y solicitar integrarte a uno nuevo.
            </p>
            {errorSalir && <p className="text-red-500 text-xs">{errorSalir}</p>}
            <button
              onClick={salirDelGrupo}
              disabled={saliendoGrupo}
              className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <LogOut size={14} /> {saliendoGrupo ? 'Saliendo...' : 'Salir de mi grupo'}
            </button>
            <p><button onClick={() => navigate('/dashboard')} className="text-morado font-semibold text-sm hover:underline">← Volver al inicio</button></p>
          </div>
        ) : (
          <button onClick={() => navigate(`/modulo/${moduloAnterior?.id}`)} className="text-morado font-semibold text-sm hover:underline">← Ir al módulo anterior</button>
        )}
      </div>
    </div>
  )

  const porciento = Math.round((Object.values(progreso).filter(Boolean).length / ORDEN_PASOS.length) * 100)

  return (
    <div className="min-h-screen bg-gray-100 py-8">
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
        {pasoActual === 'sesion' && <PasoSesion modulo={modulo} perfil={perfil} onAvanzar={avanzar} />}
        {pasoActual === 'compromisos' && <PasoCompromisos modulo={modulo} perfil={perfil} onAvanzar={avanzar} />}
      </div>
    </div>
  )
}
