import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import { Play, CheckCircle, Lock, ChevronRight, Target, BookOpen, Trophy } from 'lucide-react'

const PASOS = ['video', 'quiz', 'reflexion', 'sesion']

export default function Dashboard() {
  const { perfil } = useAuth()
  const [progresos, setProgresos] = useState({})
  const [compromisos, setCompromisos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (perfil) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(false)
    if (!perfil) return

    const [quizRes, reflexRes, sesionRes, compRes] = await Promise.all([
      supabase.from('quiz_respuestas').select('modulo_id, aprobado').eq('usuario_id', perfil.id),
      supabase.from('reflexiones').select('modulo_id').eq('usuario_id', perfil.id),
      supabase.from('sesiones_grupales').select('modulo_id').eq('grupo_id', perfil.grupo_id || ''),
      supabase.from('compromisos').select('*').eq('grupo_id', perfil.grupo_id || '').order('created_at', { ascending: false }).limit(6),
    ])

    const mapa = {}
    MODULOS.forEach((m) => {
      const quiz = quizRes.data?.find((r) => r.modulo_id === m.id)
      const reflex = reflexRes.data?.some((r) => r.modulo_id === m.id)
      const sesion = sesionRes.data?.some((r) => r.modulo_id === m.id)
      mapa[m.id] = {
        video: quiz?.aprobado || reflex || sesion,
        quiz: quiz?.aprobado,
        reflexion: reflex,
        sesion: sesion,
      }
    })
    setProgresos(mapa)
    setCompromisos(compRes.data || [])
  }

  function pasoActual(moduloId) {
    const p = progresos[moduloId] || {}
    if (!p.video) return 'video'
    if (!p.quiz) return 'quiz'
    if (!p.reflexion) return 'reflexion'
    if (!p.sesion) return 'sesion'
    return 'completado'
  }

  function porciento(moduloId) {
    const p = progresos[moduloId] || {}
    const completados = [p.video, p.quiz, p.reflexion, p.sesion].filter(Boolean).length
    return Math.round((completados / 4) * 100)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-morado border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando tu progreso...</p>
        </div>
      </div>
    )
  }

  const totalCompletados = MODULOS.filter((m) => pasoActual(m.id) === 'completado').length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-morado">
            Hola, {perfil?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {perfil?.rol === 'facilitador' ? 'Panel de facilitador' : 'Continúa tu formación en valores'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-morado">{totalCompletados}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Módulos completados</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-yellow-100 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-dorado-dark">{MODULOS.length - totalCompletados}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Por completar</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm text-center">
            <div className="text-3xl font-extrabold text-morado">{compromisos.length}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Compromisos del grupo</p>
          </div>
        </div>

        {/* Módulos */}
        <h2 className="text-lg font-bold text-morado mb-4 flex items-center gap-2">
          <BookOpen size={20} /> Los 14 valores
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {MODULOS.map((modulo) => {
            const paso = pasoActual(modulo.id)
            const pct = porciento(modulo.id)
            const completado = paso === 'completado'

            return (
              <Link
                key={modulo.id}
                to={`/modulo/${modulo.id}`}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group ${
                  completado ? 'border-green-200' : 'border-purple-100 hover:border-morado'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      completado ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-morado'
                    }`}>
                      {completado ? <CheckCircle size={20} /> : modulo.numero}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Módulo {modulo.numero}</p>
                      <h3 className="font-bold text-gray-800 text-sm">{modulo.titulo}</h3>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-morado transition-colors mt-1" />
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${completado ? 'bg-green-500' : 'bg-morado'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{pct}% completado</span>
                  {!completado && (
                    <span className="text-xs text-morado font-medium capitalize">
                      {paso === 'video' && ''}
                      {paso === 'quiz' && '📝 Hacer quiz'}
                      {paso === 'reflexion' && '✍️ Reflexionar'}
                      {paso === 'sesion' && '👥 Sesión grupal'}
                    </span>
                  )}
                  {completado && (
                    <span className="text-xs text-green-600 font-medium">✓ Listo</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Compromisos del grupo */}
        {compromisos.length > 0 && (
          <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-6">
            <h2 className="font-bold text-morado text-lg flex items-center gap-2 mb-4">
              <Target size={20} className="text-dorado" /> Compromisos del grupo
            </h2>
            <div className="space-y-3">
              {compromisos.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="w-6 h-6 bg-dorado rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trophy size={12} className="text-white" />
                  </div>
                  <p className="text-sm text-gray-700">{c.compromiso_texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
