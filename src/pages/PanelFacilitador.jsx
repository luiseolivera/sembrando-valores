import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, esPerfilExploracion } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import {
  Users, CheckCircle, FileText, Calendar, Plus, Link as LinkIcon,
  Target, Star, ChevronDown, ChevronUp, Save, Clipboard, Zap,
  CheckSquare, XCircle, ArrowLeft, PlusCircle, MessageCircle, AlertTriangle
} from 'lucide-react'

const PREGUNTAS_EVALUACION = [
  '¿El tema del módulo fue trabajado de manera adecuada?',
  '¿Los materiales utilizados fueron apropiados para el grupo?',
  '¿El espacio donde se realizó la sesión fue adecuado?',
  '¿La participación del grupo fue activa y significativa?',
  '¿Hay observaciones o sugerencias para mejorar la próxima sesión?',
]

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Vista: lista de grupos ───────────────────────────────────────────────────
function ListaGrupos({ grupos, onSeleccionar, onCrear, creando, nombreNuevo, setNombreNuevo, errorCrear }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-morado">Mis grupos</h1>
            <p className="text-gray-500 text-sm mt-1">Selecciona un grupo para gestionarlo</p>
          </div>
          <button
            onClick={onCrear}
            className="flex items-center gap-2 bg-morado text-white font-bold px-5 py-2.5 rounded-xl hover:bg-morado-dark transition-colors text-sm"
          >
            <PlusCircle size={16} /> Nuevo grupo
          </button>
        </div>

        {/* Form crear grupo */}
        {creando && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 mb-6">
            <p className="font-semibold text-morado text-sm mb-3">Nombre del nuevo grupo</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej. Equipo Norte — Turno Mañana"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
                autoFocus
              />
              <button
                onClick={onCrear}
                disabled={!nombreNuevo.trim()}
                className="bg-morado text-white font-bold px-5 py-2.5 rounded-xl hover:bg-morado-dark disabled:opacity-40 transition-colors text-sm"
              >
                Crear
              </button>
            </div>
            {errorCrear && <p className="text-red-500 text-xs mt-2">{errorCrear}</p>}
          </div>
        )}

        {grupos.length === 0 && !creando ? (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-12 text-center">
            <Users size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="font-semibold text-gray-600 mb-1">Aún no tienes grupos</p>
            <p className="text-sm text-gray-400">Crea tu primer grupo y comparte el link con los participantes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grupos.map((g) => (
              <button
                key={g.id}
                onClick={() => onSeleccionar(g)}
                className="w-full bg-white rounded-2xl border border-purple-100 shadow-sm p-5 hover:shadow-md hover:border-morado transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-morado" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{g.nombre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-mono text-xs text-morado font-semibold tracking-widest">{g.codigo}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{g.participantes_count} participante{g.participantes_count !== 1 ? 's' : ''}</span>
                        {g.modulo_activo_id && (
                          <>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs bg-morado text-white px-2 py-0.5 rounded-full font-medium">
                              Módulo {MODULOS.find(m => m.id === g.modulo_activo_id)?.numero} activo
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-gray-300 group-hover:text-morado transition-colors -rotate-90" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Vista: detalle de un grupo ───────────────────────────────────────────────
function DetalleGrupo({ grupo, facilitadorId, onVolver, onActualizarGrupo }) {
  const [moduloSeleccionado, setModuloSeleccionado] = useState(
    grupo.modulo_activo_id ? MODULOS.find(m => m.id === grupo.modulo_activo_id) || MODULOS[0] : MODULOS[0]
  )
  const [participantes, setParticipantes] = useState([])
  const [reflexiones, setReflexiones] = useState([])
  const [compromisosPersonales, setCompromisosPersonales] = useState([])
  const [quizResultados, setQuizResultados] = useState([])
  const [compromisoTexto, setCompromisoTexto] = useState(['', '', ''])
  const [sesionForm, setSesionForm] = useState({ fecha: '', link: '' })
  const [evaluacion, setEvaluacion] = useState(Array(5).fill(''))
  const [tabActiva, setTabActiva] = useState('progreso')
  const [moduloActivoId, setModuloActivoId] = useState(grupo.modulo_activo_id || null)
  const [cargando, setCargando] = useState(true)
  const [guardandoCompromisos, setGuardandoCompromisos] = useState(false)
  const [guardandoSesion, setGuardandoSesion] = useState(false)
  const [activandoModulo, setActivandoModulo] = useState(false)
  const [exito, setExito] = useState('')
  const [avisoExploracion, setAvisoExploracion] = useState(false)
  const [reflexionesExpandidas, setReflexionesExpandidas] = useState({})
  const [copiado, setCopiado] = useState(false)
  const [copiadoLink, setCopiadoLink] = useState(false)

  useEffect(() => { cargarParticipantes() }, [])
  useEffect(() => { if (participantes.length >= 0) cargarDatosModulo() }, [moduloSeleccionado, participantes])

  async function cargarParticipantes() {
    const { data } = await supabase.from('usuarios').select('id, nombre, correo').eq('grupo_id', grupo.id)
    setParticipantes(data || [])
    setCargando(false)
  }

  async function cargarDatosModulo() {
    const ids = participantes.map(p => p.id)
    if (ids.length === 0) { setReflexiones([]); setCompromisosPersonales([]); setQuizResultados([]); return }
    const [refRes, compRes, quizRes] = await Promise.all([
      supabase.from('reflexiones').select('*, usuarios(nombre)').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('compromisos_personales').select('*').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('quiz_respuestas').select('*').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
    ])
    setReflexiones(refRes.data || [])
    setCompromisosPersonales(compRes.data || [])
    setQuizResultados(quizRes.data || [])
  }

  function bloqueadoPorExploracion() {
    if (!esPerfilExploracion({ id: facilitadorId })) return false
    setAvisoExploracion(true)
    setTimeout(() => setAvisoExploracion(false), 4000)
    return true
  }

  async function activarModulo() {
    if (bloqueadoPorExploracion()) return
    setActivandoModulo(true)
    await supabase.from('grupos').update({ modulo_activo_id: moduloSeleccionado.id }).eq('id', grupo.id)
    setModuloActivoId(moduloSeleccionado.id)
    onActualizarGrupo({ ...grupo, modulo_activo_id: moduloSeleccionado.id })
    setActivandoModulo(false)
    setExito(`Módulo ${moduloSeleccionado.numero} — ${moduloSeleccionado.titulo} activado.`)
    setTimeout(() => setExito(''), 4000)
  }

  async function guardarCompromisos() {
    const validos = compromisoTexto.filter(c => c.trim())
    if (!validos.length) return
    if (bloqueadoPorExploracion()) return
    setGuardandoCompromisos(true)
    await supabase.from('compromisos').insert(
      validos.map(texto => ({ grupo_id: grupo.id, modulo_id: moduloSeleccionado.id, compromiso_texto: texto, facilitador_id: facilitadorId }))
    )
    setCompromisoTexto(['', '', ''])
    setGuardandoCompromisos(false)
    setExito('¡Compromisos guardados!')
    setTimeout(() => setExito(''), 4000)
  }

  async function guardarSesion() {
    if (!sesionForm.link) return
    if (bloqueadoPorExploracion()) return
    setGuardandoSesion(true)
    await supabase.from('sesiones_grupales').upsert({
      grupo_id: grupo.id, modulo_id: moduloSeleccionado.id,
      fecha: sesionForm.fecha || null, link_reunion: sesionForm.link,
    }, { onConflict: 'grupo_id,modulo_id' })
    setGuardandoSesion(false)
    setExito('Sesión guardada.')
    setTimeout(() => setExito(''), 4000)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(grupo.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/unirse/${grupo.codigo}`)
    setCopiadoLink(true)
    setTimeout(() => setCopiadoLink(false), 2000)
  }

  function enviarPorWhatsapp() {
    const link = `${window.location.origin}/unirse/${grupo.codigo}`
    const mensaje = `Únete al grupo "${grupo.nombre}" de Sembrando Valores Digital con este link: ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const reflexionesPorUsuario = reflexiones.reduce((acc, r) => {
    if (!acc[r.usuario_id]) acc[r.usuario_id] = { nombre: r.usuarios?.nombre, preguntas: [], compromisos: [] }
    acc[r.usuario_id].preguntas.push(r)
    return acc
  }, {})

  compromisosPersonales.forEach((c) => {
    if (!reflexionesPorUsuario[c.usuario_id]) {
      const p = participantes.find(p => p.id === c.usuario_id)
      reflexionesPorUsuario[c.usuario_id] = { nombre: p?.nombre, preguntas: [], compromisos: [] }
    }
    reflexionesPorUsuario[c.usuario_id].compromisos.push(c)
  })

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onVolver} className="text-gray-400 hover:text-morado transition-colors p-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-morado leading-tight">{grupo.nombre}</h1>
            <p className="text-gray-400 text-xs mt-0.5">Panel del facilitador</p>
          </div>
        </div>

        {exito && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
            <CheckCircle size={16} /> {exito}
          </div>
        )}

        {avisoExploracion && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertTriangle size={16} /> Estás en modo de exploración — regístrate o inicia sesión para guardar cambios reales.
          </div>
        )}

        {/* Cards info */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6 items-start">
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium mb-1">Participantes</p>
            <p className="font-bold text-morado text-3xl">{participantes.length}</p>
            <p className="text-xs text-gray-400 mt-1">en este grupo</p>
          </div>
          <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5 sm:col-span-2">
            <p className="text-xs text-gray-400 font-medium mb-2">Invita participantes</p>
            <div className="flex items-center gap-3 mb-3">
              <p className="font-mono font-bold text-2xl text-morado tracking-widest">{grupo.codigo}</p>
              <button onClick={copiarCodigo} className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${copiado ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-morado hover:bg-purple-200'}`}>
                {copiado ? '✓ Copiado' : <><Clipboard size={12} className="inline mr-1" />Copiar código</>}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <LinkIcon size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate flex-1 font-mono">
                {window.location.origin}/unirse/{grupo.codigo}
              </p>
              <button onClick={copiarLink} className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${copiadoLink ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-morado hover:bg-purple-200'}`}>
                {copiadoLink ? '✓ Copiado' : 'Copiar link'}
              </button>
              <button onClick={enviarPorWhatsapp} className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all">
                <MessageCircle size={12} /> WhatsApp
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Quien abra el link se registra y queda unido automáticamente</p>
          </div>
        </div>

        {/* Selector módulo + activar */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Módulo de trabajo</label>
          <div className="flex gap-3 flex-wrap">
            <select
              value={moduloSeleccionado.id}
              onChange={(e) => setModuloSeleccionado(MODULOS.find(m => m.id === parseInt(e.target.value)))}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
            >
              {MODULOS.map(m => (
                <option key={m.id} value={m.id}>Módulo {m.numero} — {m.titulo}</option>
              ))}
            </select>
            <button
              onClick={activarModulo}
              disabled={activandoModulo || moduloSeleccionado.id === moduloActivoId}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                moduloSeleccionado.id === moduloActivoId
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-morado text-white hover:bg-morado-dark disabled:opacity-50'
              }`}
            >
              {moduloSeleccionado.id === moduloActivoId
                ? <><CheckCircle size={15} /> Activo para el grupo</>
                : <><Zap size={15} /> {activandoModulo ? 'Activando...' : 'Activar para el grupo'}</>
              }
            </button>
          </div>
          {moduloActivoId && (
            <p className="text-xs text-gray-400 mt-2">
              Módulo activo: <span className="font-semibold text-morado">{MODULOS.find(m => m.id === moduloActivoId)?.titulo}</span>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {[
            { key: 'progreso', label: 'Progreso', icono: CheckCircle },
            { key: 'reflexiones', label: 'Reflexiones y compromisos', icono: FileText },
            { key: 'sesion', label: 'Sesión', icono: Calendar },
            { key: 'compromisos', label: 'Compromisos del grupo', icono: Target },
            { key: 'evaluacion', label: 'Evaluación', icono: Star },
          ].map(({ key, label, icono: Icono }) => (
            <button
              key={key}
              onClick={() => setTabActiva(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                tabActiva === key ? 'bg-white text-morado shadow-sm' : 'text-gray-500 hover:text-morado'
              }`}
            >
              <Icono size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab: Progreso */}
        {tabActiva === 'progreso' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-morado flex items-center gap-2">
                <CheckCircle size={18} /> Progreso — Módulo {moduloSeleccionado.numero}: {moduloSeleccionado.titulo}
              </h3>
            </div>
            {participantes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay participantes en este grupo.</p>
                <p className="text-xs mt-1">Comparte el código <span className="font-mono font-bold text-morado">{grupo.codigo}</span> o el link de invitación.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <div>Participante</div>
                  <div className="text-center">Quiz</div>
                  <div className="text-center">Reflexión</div>
                  <div className="text-center">Estado</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {participantes.map(p => {
                    const quiz = quizResultados.find(q => q.usuario_id === p.id)
                    const tieneReflexion = reflexiones.some(r => r.usuario_id === p.id)
                    const estado = quiz?.aprobado && tieneReflexion ? 'Listo para sesión'
                      : quiz?.aprobado ? 'Pendiente reflexión'
                      : quiz ? 'Quiz no aprobado'
                      : 'Sin comenzar'
                    const colorEstado = quiz?.aprobado && tieneReflexion ? 'bg-green-100 text-green-700'
                      : quiz?.aprobado ? 'bg-blue-100 text-blue-700'
                      : quiz ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-400'
                    return (
                      <div key={p.id} className="grid grid-cols-4 gap-2 items-center px-5 py-3.5">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.correo}</p>
                        </div>
                        <div className="text-center">
                          {quiz ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${quiz.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {quiz.aprobado ? <CheckCircle size={11} /> : <XCircle size={11} />} {quiz.puntaje}%
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </div>
                        <div className="text-center">
                          {tieneReflexion
                            ? <CheckSquare size={16} className="inline text-green-600" />
                            : <span className="text-gray-300 text-xs">—</span>}
                        </div>
                        <div className="text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorEstado}`}>{estado}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-6 text-xs text-gray-500">
                  <span>Quiz aprobado: <b className="text-morado">{quizResultados.filter(q => q.aprobado).length}/{participantes.length}</b></span>
                  <span>Reflexión enviada: <b className="text-morado">{Object.keys(reflexionesPorUsuario).length}/{participantes.length}</b></span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Reflexiones */}
        {tabActiva === 'reflexiones' && (
          <div className="space-y-4">
            {Object.keys(reflexionesPorUsuario).length === 0 ? (
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-8 text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay reflexiones ni compromisos enviados para este módulo.</p>
              </div>
            ) : Object.entries(reflexionesPorUsuario).map(([uid, data]) => (
              <div key={uid} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setReflexionesExpandidas(prev => ({ ...prev, [uid]: !prev[uid] }))}
                  className="w-full flex items-center justify-between p-5 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-morado rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {data.nombre?.[0]?.toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{data.nombre}</p>
                  </div>
                  {reflexionesExpandidas[uid] ? <ChevronUp size={16} className="text-morado" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {reflexionesExpandidas[uid] && (
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
                    {data.preguntas.sort((a, b) => a.pregunta_numero - b.pregunta_numero).map(r => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-morado mb-1">
                          {moduloSeleccionado.preguntas_reflexion?.[r.pregunta_numero - 1]}
                        </p>
                        <p className="text-sm text-gray-700">{r.respuesta_texto}</p>
                      </div>
                    ))}
                    {data.compromisos.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-dorado-dark uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Target size={12} /> Compromisos personales
                        </p>
                        <div className="space-y-2">
                          {data.compromisos.map(c => (
                            <div key={c.id} className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
                              {c.cumplido
                                ? <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                                : <span className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 flex-shrink-0 mt-0.5" />}
                              <p className={`text-sm ${c.cumplido ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {c.compromiso_texto}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Sesión */}
        {tabActiva === 'sesion' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-4 flex items-center gap-2">
              <Calendar size={18} /> Agendar sesión grupal
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha y hora</label>
                <input type="datetime-local" value={sesionForm.fecha}
                  onChange={e => setSesionForm({ ...sesionForm, fecha: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enlace (Zoom, Google Meet o Teams)</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="url" value={sesionForm.link}
                    onChange={e => setSesionForm({ ...sesionForm, link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
              </div>
              <button onClick={guardarSesion} disabled={!sesionForm.link || guardandoSesion}
                className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Save size={16} /> {guardandoSesion ? 'Guardando...' : 'Guardar sesión'}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Compromisos */}
        {tabActiva === 'compromisos' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
              <Target size={18} className="text-dorado" /> Compromisos del grupo
            </h3>
            <p className="text-sm text-gray-500 mb-5">Registra hasta 3 compromisos al cerrar la sesión.</p>
            <div className="space-y-3 mb-5">
              {compromisoTexto.map((texto, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-dorado rounded-full flex items-center justify-center text-morado font-bold text-xs flex-shrink-0 mt-2">{i + 1}</div>
                  <textarea value={texto} rows={2} placeholder={`Compromiso ${i + 1} (opcional)`}
                    onChange={e => { const n = [...compromisoTexto]; n[i] = e.target.value; setCompromisoTexto(n) }}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none" />
                </div>
              ))}
            </div>
            <button onClick={guardarCompromisos} disabled={compromisoTexto.every(c => !c.trim()) || guardandoCompromisos}
              className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              <Plus size={16} /> {guardandoCompromisos ? 'Guardando...' : 'Registrar compromisos'}
            </button>
          </div>
        )}

        {/* Tab: Evaluación */}
        {tabActiva === 'evaluacion' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-4 flex items-center gap-2">
              <Star size={18} className="text-dorado" /> Evaluación de la sesión
            </h3>
            <div className="space-y-5">
              {PREGUNTAS_EVALUACION.map((pregunta, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 text-sm mb-3">{i + 1}. {pregunta}</p>
                  {i < 4 ? (
                    <div className="flex gap-2">
                      {['1','2','3','4','5'].map(n => (
                        <button key={n} onClick={() => { const e = [...evaluacion]; e[i] = n; setEvaluacion(e) }}
                          className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all ${evaluacion[i] === n ? 'border-morado bg-morado text-white' : 'border-gray-200 text-gray-500 hover:border-morado'}`}>
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 self-center ml-1">(1=bajo, 5=excelente)</span>
                    </div>
                  ) : (
                    <textarea value={evaluacion[i]} rows={3} placeholder="Escribe tus observaciones..."
                      onChange={e => { const ev = [...evaluacion]; ev[i] = e.target.value; setEvaluacion(ev) }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none" />
                  )}
                </div>
              ))}
            </div>
            <button className="mt-5 w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors flex items-center justify-center gap-2">
              <Save size={16} /> Guardar evaluación
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PanelFacilitador() {
  const { perfil } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [grupoActivo, setGrupoActivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [errorCrear, setErrorCrear] = useState('')

  useEffect(() => { if (perfil) cargarGrupos() }, [perfil])

  async function cargarGrupos() {
    const { data: gs } = await supabase.from('grupos').select('*').eq('facilitador_id', perfil.id).order('created_at')
    if (!gs) { setCargando(false); return }

    // Contar participantes por grupo
    const conConteo = await Promise.all(gs.map(async g => {
      const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('grupo_id', g.id)
      return { ...g, participantes_count: count || 0 }
    }))
    setGrupos(conConteo)
    setCargando(false)
  }

  async function manejarCrear() {
    if (!creando) { setCreando(true); return }
    if (!nombreNuevo.trim()) { setCreando(false); return }

    setErrorCrear('')
    if (esPerfilExploracion(perfil)) {
      setErrorCrear('Estás en modo de exploración — regístrate o inicia sesión para crear grupos reales.')
      return
    }
    const codigo = generarCodigo()

    // Intentar con codigo; si falla por columna inexistente, intentar sin él
    let data, error
    ;({ data, error } = await supabase
      .from('grupos')
      .insert({ nombre: nombreNuevo.trim(), facilitador_id: perfil.id, codigo })
      .select().single())

    if (error?.message?.includes('codigo') || error?.code === '42703') {
      // Columna aún no existe — insertar sin ella y usar el id como código temporal
      ;({ data, error } = await supabase
        .from('grupos')
        .insert({ nombre: nombreNuevo.trim(), facilitador_id: perfil.id })
        .select().single())
      if (data) data.codigo = data.id.substring(0, 6).toUpperCase()
    }

    if (error) {
      setErrorCrear('No se pudo crear el grupo. Verifica tu conexión e intenta de nuevo.')
      return
    }

    setGrupos(prev => [...prev, { ...data, participantes_count: 0 }])
    setNombreNuevo('')
    setCreando(false)
  }

  function actualizarGrupoEnLista(grupoActualizado) {
    setGrupos(prev => prev.map(g => g.id === grupoActualizado.id ? { ...g, ...grupoActualizado } : g))
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (grupoActivo) return (
    <DetalleGrupo
      grupo={grupoActivo}
      facilitadorId={perfil.id}
      onVolver={() => { setGrupoActivo(null); cargarGrupos() }}
      onActualizarGrupo={actualizarGrupoEnLista}
    />
  )

  return (
    <ListaGrupos
      grupos={grupos}
      onSeleccionar={setGrupoActivo}
      onCrear={manejarCrear}
      creando={creando}
      nombreNuevo={nombreNuevo}
      setNombreNuevo={setNombreNuevo}
      errorCrear={errorCrear}
    />
  )
}
