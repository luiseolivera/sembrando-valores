import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, esPerfilExploracion } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import { CheckCircle, ChevronRight, Target, BookOpen, Trophy, Users, Zap, Calendar, ExternalLink, Printer, Lock, Clock, Send } from 'lucide-react'

export default function Dashboard() {
  const { perfil } = useAuth()
  const [progresos, setProgresos] = useState({})
  const [compromisos, setCompromisos] = useState([])
  const [moduloActivoId, setModuloActivoId] = useState(null)
  const [sesionActiva, setSesionActiva] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [codigoInput, setCodigoInput] = useState('')
  const [uniendose, setUniendose] = useState(false)
  const [errorUnirse, setErrorUnirse] = useState('')
  const [exitoUnirse, setExitoUnirse] = useState('')

  useEffect(() => {
    if (perfil) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(false)
    if (!perfil) return

    const queries = [
      supabase.from('quiz_respuestas').select('modulo_id, aprobado').eq('usuario_id', perfil.id),
      supabase.from('reflexiones').select('modulo_id').eq('usuario_id', perfil.id),
    ]

    if (perfil.grupo_id) {
      queries.push(
        supabase.from('sesiones_grupales').select('modulo_id, fecha, link_reunion').eq('grupo_id', perfil.grupo_id),
        supabase.from('compromisos').select('*').eq('grupo_id', perfil.grupo_id).order('created_at', { ascending: false }).limit(6),
        supabase.from('grupos').select('modulo_activo_id').eq('id', perfil.grupo_id).maybeSingle(),
      )
    }

    const [quizRes, reflexRes, sesionRes, compRes, grupoRes] = await Promise.all(queries)

    const mapa = {}
    MODULOS.forEach((m) => {
      const quiz = quizRes.data?.find((r) => r.modulo_id === m.id)
      const reflex = reflexRes.data?.some((r) => r.modulo_id === m.id)
      const sesion = sesionRes?.data?.some((r) => r.modulo_id === m.id)
      mapa[m.id] = {
        video: quiz?.aprobado || reflex || sesion,
        quiz: quiz?.aprobado,
        reflexion: reflex,
        sesion: sesion,
      }
    })
    setProgresos(mapa)
    setCompromisos(compRes?.data || [])
    if (grupoRes?.data?.modulo_activo_id) {
      const activoId = grupoRes.data.modulo_activo_id
      setModuloActivoId(activoId)
      const sesion = sesionRes?.data?.find(s => s.modulo_id === activoId)
      if (sesion?.link_reunion) setSesionActiva(sesion)
    }
  }

  async function unirseAlGrupo() {
    setErrorUnirse('')
    setExitoUnirse('')
    const codigo = codigoInput.trim().toUpperCase()
    if (!codigo) return
    if (esPerfilExploracion(perfil)) {
      setErrorUnirse('Estás en modo de exploración — regístrate o inicia sesión para unirte a un grupo real.')
      return
    }
    setUniendose(true)

    const { data: grupo, error } = await supabase
      .from('grupos')
      .select('id, nombre')
      .eq('codigo', codigo)
      .maybeSingle()

    if (error || !grupo) {
      setErrorUnirse('No se encontró un grupo con ese código. Verifícalo con tu facilitador.')
      setUniendose(false)
      return
    }

    const { error: upErr } = await supabase
      .from('usuarios')
      .update({ grupo_id: grupo.id })
      .eq('id', perfil.id)

    if (upErr) {
      setErrorUnirse('Ocurrió un error al unirte. Intenta de nuevo.')
    } else {
      setExitoUnirse(`¡Te uniste al grupo "${grupo.nombre}"!`)
      setTimeout(() => window.location.reload(), 1500)
    }
    setUniendose(false)
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
  const moduloActivo = moduloActivoId ? MODULOS.find((m) => m.id === moduloActivoId) : null
  const moduloActivoListo = moduloActivoId
    ? Boolean(progresos[moduloActivoId]?.quiz && progresos[moduloActivoId]?.reflexion)
    : false

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Saludo */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-morado">
              Hola, {perfil?.nombre?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {perfil?.rol === 'facilitador' ? 'Panel de facilitador' : 'Continúa tu formación en valores'}
            </p>
          </div>
          {perfil?.rol === 'participante' && (
            <Link
              to="/mi-resumen"
              className="flex-shrink-0 flex items-center gap-2 bg-white border border-purple-200 text-morado text-xs font-bold px-4 py-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Printer size={14} /> Mis reflexiones y compromisos
            </Link>
          )}
        </div>

        {/* Banner: facilitador pendiente de aprobación */}
        {perfil?.rol === 'facilitador' && !perfil?.aprobado && (
          <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-dorado-dark" />
              </div>
              <div>
                <p className="font-bold text-morado text-sm">Cuenta de facilitador pendiente de aprobación</p>
                <p className="text-xs text-gray-500">El equipo de Misioneros en el Mundo del Trabajo debe autorizarte antes de crear grupos.</p>
              </div>
            </div>
            <a
              href={`mailto:luiso@rederac.com?subject=${encodeURIComponent('Solicitud de facilitador — Sembrando Valores Digital')}&body=${encodeURIComponent(`Hola,\n\nSolicito autorización para ser facilitador en la plataforma Sembrando Valores Digital.\n\nNombre: ${perfil?.nombre}\nCorreo registrado: ${perfil?.correo}\n\nPara aprobar la cuenta, entren a:\n${window.location.origin}/admin?id=${perfil?.id}\n\nGracias.`)}`}
              className="inline-flex items-center gap-2 bg-morado text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-morado-dark transition-colors"
            >
              <Send size={13} /> Reenviar solicitud de aprobación
            </a>
          </div>
        )}

        {/* Banner: unirse a grupo (participante sin grupo) */}
        {perfil?.rol === 'participante' && !perfil?.grupo_id && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-morado" />
              </div>
              <div>
                <p className="font-bold text-morado text-sm">Únete a tu grupo</p>
                <p className="text-xs text-gray-500">Pídele el código de 6 letras a tu facilitador</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && unirseAlGrupo()}
                placeholder="Ej: AB12CD"
                maxLength={8}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-morado uppercase"
              />
              <button
                onClick={unirseAlGrupo}
                disabled={uniendose || !codigoInput.trim()}
                className="bg-morado text-white font-bold px-5 py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40"
              >
                {uniendose ? '...' : 'Unirme'}
              </button>
            </div>
            {errorUnirse && <p className="text-red-500 text-xs mt-2">{errorUnirse}</p>}
            {exitoUnirse && <p className="text-green-600 text-xs mt-2 font-semibold">{exitoUnirse}</p>}
          </div>
        )}

        {/* Módulo activo del grupo */}
        {moduloActivo && (
          <div className="bg-morado rounded-2xl p-4 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-dorado" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-medium">Módulo activo del grupo</p>
              <p className="text-white font-bold text-sm truncate">
                Módulo {moduloActivo.numero} — {moduloActivo.titulo}
              </p>
            </div>
            <Link
              to={`/modulo/${moduloActivo.id}`}
              className="flex-shrink-0 bg-dorado text-morado font-bold text-xs px-4 py-2 rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Ir al módulo
            </Link>
          </div>
        )}

        {/* Tarjeta de sesión grupal */}
        {sesionActiva && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">Sesión grupal agendada</p>
                {sesionActiva.fecha && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(sesionActiva.fecha).toLocaleString('es-MX', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
                {moduloActivoListo ? (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{sesionActiva.link_reunion}</p>
                ) : (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Termina el quiz y tu reflexión de este módulo para desbloquear el link.
                  </p>
                )}
              </div>
              {moduloActivoListo ? (
                <a
                  href={sesionActiva.link_reunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={13} /> Entrar
                </a>
              ) : (
                <span className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-bold px-4 py-2 rounded-xl">
                  <Lock size={13} /> Bloqueado
                </span>
              )}
            </div>
          </div>
        )}

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
            const esActivo = modulo.id === moduloActivoId

            return (
              <Link
                key={modulo.id}
                to={`/modulo/${modulo.id}`}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group ${
                  completado ? 'border-green-200' : esActivo ? 'border-morado ring-1 ring-morado' : 'border-purple-100 hover:border-morado'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      completado ? 'bg-green-100 text-green-700' : esActivo ? 'bg-morado text-white' : 'bg-purple-100 text-morado'
                    }`}>
                      {completado ? <CheckCircle size={20} /> : esActivo ? <Zap size={18} /> : modulo.numero}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Módulo {modulo.numero}</p>
                      <h3 className="font-bold text-gray-800 text-sm">{modulo.titulo}</h3>
                    </div>
                  </div>
                  {esActivo && !completado && (
                    <span className="text-xs bg-morado text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Activo</span>
                  )}
                  {!esActivo && (
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-morado transition-colors mt-1" />
                  )}
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
                    <span className="text-xs text-morado font-medium">
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
