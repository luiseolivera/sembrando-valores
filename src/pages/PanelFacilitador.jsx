import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, DEMO_MODE, esPerfilExploracion } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import {
  Users, CheckCircle, FileText, Calendar, Plus, Link as LinkIcon,
  Target, Star, ChevronDown, ChevronUp, Save, Clipboard, Zap,
  CheckSquare, XCircle, ArrowLeft, PlusCircle, MessageCircle, AlertTriangle, Trash2,
  Unlock, Inbox
} from 'lucide-react'

const PREGUNTA_RETROALIMENTACION = '¿Hay observaciones o sugerencias para mejorar la próxima sesión y/o para mejorar esta aplicación?'

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Vista: lista de grupos ───────────────────────────────────────────────────
function ListaGrupos({ grupos, reporte, onSeleccionar, onCrear, creando, nombreNuevo, setNombreNuevo, errorCrear }) {
  return (
    <div>
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

        {reporte && grupos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{reporte.participantes}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Participantes totales</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{reporte.quizAprobados}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Quizzes aprobados</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{reporte.compromisosRegistrados}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Compromisos registrados</p>
            </div>
          </div>
        )}

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
  const [sesiones, setSesiones] = useState([])
  const [eleccionesPorSesion, setEleccionesPorSesion] = useState({})
  const [eleccionesPorUsuario, setEleccionesPorUsuario] = useState({})
  const [sesionForm, setSesionForm] = useState({ fecha: '', link: '' })
  const [eliminandoSesion, setEliminandoSesion] = useState(null)
  const [habilitaciones, setHabilitaciones] = useState({})
  const [habilitandoId, setHabilitandoId] = useState(null)
  const [retroalimentacion, setRetroalimentacion] = useState('')
  const [guardandoRetro, setGuardandoRetro] = useState(false)
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
  const [logoUrl, setLogoUrl] = useState(grupo.logo_empresa_url || '')
  const [guardandoLogo, setGuardandoLogo] = useState(false)
  const [comentariosReflexion, setComentariosReflexion] = useState({})
  const [comentariosDraft, setComentariosDraft] = useState({})
  const [guardandoComentario, setGuardandoComentario] = useState(null)

  useEffect(() => { cargarParticipantes() }, [])
  useEffect(() => { if (participantes.length >= 0) cargarDatosModulo() }, [moduloSeleccionado, participantes])

  async function cargarParticipantes() {
    const { data } = await supabase.from('usuarios').select('id, nombre, correo').eq('grupo_id', grupo.id)
    setParticipantes(data || [])
    setCargando(false)
  }

  async function cargarDatosModulo() {
    const { data: retroData } = await supabase
      .from('retroalimentacion_sesiones')
      .select('comentario')
      .eq('grupo_id', grupo.id)
      .eq('modulo_id', moduloSeleccionado.id)
      .maybeSingle()
    setRetroalimentacion(retroData?.comentario || '')

    const { data: sesionesData } = await supabase
      .from('sesiones_grupales')
      .select('*')
      .eq('grupo_id', grupo.id)
      .eq('modulo_id', moduloSeleccionado.id)
      .order('fecha')
    setSesiones(sesionesData || [])

    const sesionIds = (sesionesData || []).map(s => s.id)
    if (sesionIds.length > 0) {
      const { data: eleccionesData } = await supabase.from('sesion_elecciones').select('sesion_id, usuario_id').in('sesion_id', sesionIds)
      const conteo = {}
      const porUsuario = {}
      ;(eleccionesData || []).forEach(e => {
        conteo[e.sesion_id] = (conteo[e.sesion_id] || 0) + 1
        porUsuario[e.usuario_id] = e.sesion_id
      })
      setEleccionesPorSesion(conteo)
      setEleccionesPorUsuario(porUsuario)
    } else {
      setEleccionesPorSesion({})
      setEleccionesPorUsuario({})
    }

    const ids = participantes.map(p => p.id)
    if (ids.length === 0) {
      setReflexiones([]); setCompromisosPersonales([]); setQuizResultados([])
      setComentariosReflexion({}); setComentariosDraft({}); setHabilitaciones({})
      return
    }
    const [refRes, compRes, quizRes, comentRes, habilRes] = await Promise.all([
      supabase.from('reflexiones').select('*, usuarios(nombre)').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('compromisos_personales').select('*').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('quiz_respuestas').select('*').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('comentarios_reflexion').select('*').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
      supabase.from('habilitaciones_compromisos').select('usuario_id').eq('modulo_id', moduloSeleccionado.id).in('usuario_id', ids),
    ])
    setReflexiones(refRes.data || [])
    setCompromisosPersonales(compRes.data || [])
    setQuizResultados(quizRes.data || [])
    setHabilitaciones(Object.fromEntries((habilRes.data || []).map(h => [h.usuario_id, true])))

    const porUsuario = {}
    const draft = {}
    ;(comentRes.data || []).forEach((c) => {
      porUsuario[c.usuario_id] = c
      draft[c.usuario_id] = { comentario: c.comentario || '', reaccion: c.reaccion || '' }
    })
    setComentariosReflexion(porUsuario)
    setComentariosDraft(draft)
  }

  const REACCIONES = ['👍', '💪', '❤️', '🤔', '🎉']

  function actualizarDraft(usuarioId, campo, valor) {
    setComentariosDraft(prev => ({
      ...prev,
      [usuarioId]: { ...(prev[usuarioId] || { comentario: '', reaccion: '' }), [campo]: valor },
    }))
  }

  async function guardarComentarioReflexion(usuarioId) {
    if (bloqueadoPorExploracion()) return
    const draft = comentariosDraft[usuarioId] || { comentario: '', reaccion: '' }
    if (!draft.comentario.trim() && !draft.reaccion) return
    setGuardandoComentario(usuarioId)
    await supabase.from('comentarios_reflexion').upsert({
      usuario_id: usuarioId, modulo_id: moduloSeleccionado.id, facilitador_id: facilitadorId,
      comentario: draft.comentario.trim() || null, reaccion: draft.reaccion || null,
    }, { onConflict: 'usuario_id,modulo_id' })
    setComentariosReflexion(prev => ({ ...prev, [usuarioId]: { ...draft } }))
    setGuardandoComentario(null)
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

  async function agregarSesion() {
    if (!sesionForm.link) return
    if (bloqueadoPorExploracion()) return
    setGuardandoSesion(true)
    const { data } = await supabase.from('sesiones_grupales').insert({
      grupo_id: grupo.id, modulo_id: moduloSeleccionado.id,
      fecha: sesionForm.fecha || null, link_reunion: sesionForm.link,
    }).select().maybeSingle()
    if (data) {
      setSesiones(prev => [...prev, data].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')))
    }
    setSesionForm({ fecha: '', link: '' })
    setGuardandoSesion(false)
    setExito('Sesión agregada.')
    setTimeout(() => setExito(''), 4000)
  }

  async function eliminarSesion(id) {
    if (!confirm('¿Eliminar esta opción de sesión? Los participantes que ya la eligieron perderán su elección.')) return
    setEliminandoSesion(id)
    await supabase.from('sesiones_grupales').delete().eq('id', id)
    setSesiones(prev => prev.filter(s => s.id !== id))
    setEliminandoSesion(null)
  }

  async function habilitarCompromisos(usuarioId) {
    if (bloqueadoPorExploracion()) return
    setHabilitandoId(usuarioId)
    await supabase.from('habilitaciones_compromisos').upsert({
      usuario_id: usuarioId, modulo_id: moduloSeleccionado.id, facilitador_id: facilitadorId,
    }, { onConflict: 'usuario_id,modulo_id' })
    setHabilitaciones(prev => ({ ...prev, [usuarioId]: true }))
    setHabilitandoId(null)
  }

  async function habilitarTodosDeSesion(sesionId) {
    if (bloqueadoPorExploracion()) return
    const usuarioIds = Object.entries(eleccionesPorUsuario).filter(([, sid]) => sid === sesionId).map(([uid]) => uid)
    if (!usuarioIds.length) return
    setHabilitandoId(sesionId)
    await supabase.from('habilitaciones_compromisos').upsert(
      usuarioIds.map(uid => ({ usuario_id: uid, modulo_id: moduloSeleccionado.id, facilitador_id: facilitadorId })),
      { onConflict: 'usuario_id,modulo_id' }
    )
    setHabilitaciones(prev => {
      const nuevo = { ...prev }
      usuarioIds.forEach(uid => { nuevo[uid] = true })
      return nuevo
    })
    setHabilitandoId(null)
    setExito(`Compromisos habilitados para ${usuarioIds.length} participante${usuarioIds.length === 1 ? '' : 's'}.`)
    setTimeout(() => setExito(''), 4000)
  }

  async function guardarRetroalimentacion() {
    if (!retroalimentacion.trim()) return
    if (bloqueadoPorExploracion()) return
    setGuardandoRetro(true)
    await supabase.from('retroalimentacion_sesiones').upsert({
      grupo_id: grupo.id, modulo_id: moduloSeleccionado.id,
      facilitador_id: facilitadorId, comentario: retroalimentacion,
    }, { onConflict: 'grupo_id,modulo_id' })
    setGuardandoRetro(false)
    setExito('¡Gracias por tu retroalimentación!')
    setTimeout(() => setExito(''), 4000)
  }

  async function guardarLogo() {
    if (bloqueadoPorExploracion()) return
    setGuardandoLogo(true)
    await supabase.from('grupos').update({ logo_empresa_url: logoUrl.trim() || null }).eq('id', grupo.id)
    onActualizarGrupo({ ...grupo, logo_empresa_url: logoUrl.trim() || null })
    setGuardandoLogo(false)
    setExito('Logo actualizado.')
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
    <div className="min-h-screen bg-gray-100 py-8">
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

        {/* Logo de la empresa (marca blanca ligera) — solo grupos marcados como empresa */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 mb-6">
          <p className="text-xs text-gray-400 font-medium mb-2">Logo de la empresa</p>
          {grupo.es_empresa ? (
            <>
              <p className="text-xs text-gray-400 mb-3">Pega el link de una imagen — se mostrará junto al saludo de los participantes de este grupo.</p>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-gray-100 flex-shrink-0" onError={(e) => { e.target.style.display = 'none' }} />
                )}
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://tuempresa.com/logo.png"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
                />
                <button
                  onClick={guardarLogo}
                  disabled={guardandoLogo}
                  className="flex-shrink-0 bg-morado text-white font-bold px-4 py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 text-sm"
                >
                  {guardandoLogo ? '...' : 'Guardar'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">
              Esta función es exclusiva para grupos de empresa. Escríbenos desde{' '}
              <a href="/empresas" className="text-morado underline">nuestra propuesta empresarial</a> para activarla.
            </p>
          )}
        </div>

        {/* Cards info */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium mb-1">Participantes</p>
            <p className="font-bold text-morado text-3xl">{participantes.length}</p>
            <p className="text-xs text-gray-400 mt-1">en este grupo</p>
          </div>
          <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">Invita participantes</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="font-mono font-bold text-xl text-morado tracking-widest">{grupo.codigo}</p>
                <button onClick={copiarCodigo} className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${copiado ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-morado hover:bg-purple-200'}`}>
                  {copiado ? '✓ Copiado' : <><Clipboard size={12} className="inline mr-1" />Copiar código</>}
                </button>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 flex-1 min-w-[220px]">
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
            { key: 'evaluacion', label: 'Retroalimentación', icono: Star },
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
                <div className="grid grid-cols-6 gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <div>Participante</div>
                  <div className="text-center">Quiz</div>
                  <div className="text-center">Reflexión</div>
                  <div className="text-center">Estado</div>
                  <div className="text-center">Sesión grupal</div>
                  <div className="text-center">Compromisos</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {participantes.map(p => {
                    const quiz = quizResultados.find(q => q.usuario_id === p.id)
                    const tieneReflexion = reflexiones.some(r => r.usuario_id === p.id)
                    const tieneCompromisos = compromisosPersonales.some(c => c.usuario_id === p.id)
                    const sesionElegida = sesiones.find(s => s.id === eleccionesPorUsuario[p.id])
                    const sesionPendiente = !sesionElegida
                    const sesionFutura = sesionElegida?.fecha && new Date(sesionElegida.fecha) > new Date()
                    const puedeHabilitar = !sesionPendiente && !sesionFutura
                    const estado = quiz?.aprobado && tieneReflexion ? 'Listo para sesión'
                      : quiz?.aprobado ? 'Pendiente reflexión'
                      : quiz ? 'Quiz no aprobado'
                      : 'Sin comenzar'
                    const colorEstado = quiz?.aprobado && tieneReflexion ? 'bg-green-100 text-green-700'
                      : quiz?.aprobado ? 'bg-blue-100 text-blue-700'
                      : quiz ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-400'
                    return (
                      <div key={p.id} className="grid grid-cols-6 gap-2 items-center px-5 py-3.5">
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
                        <div className="text-center">
                          {habilitaciones[p.id] ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                              <Unlock size={12} /> Habilitada
                            </span>
                          ) : puedeHabilitar ? (
                            <button
                              onClick={() => habilitarCompromisos(p.id)}
                              disabled={habilitandoId === p.id}
                              className="text-xs font-semibold text-morado bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {habilitandoId === p.id ? '...' : 'Habilitar'}
                            </button>
                          ) : (
                            <span
                              className="text-xs text-gray-300"
                              title={sesionPendiente ? 'Todavía no elige sesión' : 'La sesión aún no ocurre'}
                            >
                              {sesionPendiente
                                ? 'Sin sesión elegida'
                                : `Disponible el ${new Date(sesionElegida.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          {tieneCompromisos
                            ? <CheckCircle size={16} className="inline text-green-600" />
                            : <span className="text-gray-300 text-xs">—</span>}
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
                              <Target size={14} className="text-dorado-dark flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-700">
                                {c.compromiso_texto}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-bold text-morado uppercase tracking-wide mb-2">Tu reacción / comentario</p>
                      <div className="flex gap-2 mb-2">
                        {REACCIONES.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => actualizarDraft(uid, 'reaccion', comentariosDraft[uid]?.reaccion === emoji ? '' : emoji)}
                            className={`text-lg w-9 h-9 rounded-full border-2 transition-all ${
                              comentariosDraft[uid]?.reaccion === emoji ? 'border-morado bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={comentariosDraft[uid]?.comentario || ''}
                        onChange={(e) => actualizarDraft(uid, 'comentario', e.target.value)}
                        rows={2}
                        placeholder="Escribe un comentario para este participante (opcional)..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none mb-2"
                      />
                      <button
                        onClick={() => guardarComentarioReflexion(uid)}
                        disabled={guardandoComentario === uid || (!comentariosDraft[uid]?.comentario?.trim() && !comentariosDraft[uid]?.reaccion)}
                        className="flex items-center gap-2 bg-morado text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40"
                      >
                        <Save size={13} /> {guardandoComentario === uid ? 'Guardando...' : 'Guardar'}
                      </button>
                      {comentariosReflexion[uid] && (
                        <p className="text-xs text-green-600 mt-2">✓ Ya le dejaste retroalimentación a este participante.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Sesión */}
        {tabActiva === 'sesion' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
              <h3 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
                <Calendar size={18} /> Opciones de sesión grupal
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Ofrece varios horarios para este módulo — cada participante elige el que le convenga.
              </p>

              {sesiones.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4">Todavía no hay ninguna sesión agendada para este módulo.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {sesiones.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {s.fecha
                            ? new Date(s.fecha).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                            : 'Sin fecha definida'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{s.link_reunion}</p>
                        <p className="text-xs text-morado font-medium mt-0.5">
                          {eleccionesPorSesion[s.id] || 0} participante{eleccionesPorSesion[s.id] === 1 ? '' : 's'} eligió esta opción
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(eleccionesPorSesion[s.id] || 0) > 0 && (
                          <button
                            onClick={() => habilitarTodosDeSesion(s.id)}
                            disabled={habilitandoId === s.id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-morado bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Unlock size={13} /> {habilitandoId === s.id ? 'Habilitando...' : 'Habilitar a todos'}
                          </button>
                        )}
                        <button
                          onClick={() => eliminarSesion(s.id)}
                          disabled={eliminandoSesion === s.id}
                          className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Agregar otra opción de horario</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha y hora</label>
                  <input type="datetime-local" value={sesionForm.fecha}
                    onChange={e => setSesionForm({ ...sesionForm, fecha: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enlace (Zoom, Google Meet o Teams)</label>
                  <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="url" value={sesionForm.link}
                      onChange={e => setSesionForm({ ...sesionForm, link: e.target.value })}
                      placeholder="https://meet.google.com/..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                  </div>
                </div>
                <button onClick={agregarSesion} disabled={!sesionForm.link || guardandoSesion}
                  className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  <Plus size={16} /> {guardandoSesion ? 'Guardando...' : 'Agregar opción de sesión'}
                </button>
              </div>
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

        {/* Tab: Retroalimentación */}
        {tabActiva === 'evaluacion' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-4 flex items-center gap-2">
              <Star size={18} className="text-dorado" /> Retroalimentación
            </h3>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-gray-800 text-sm mb-3">{PREGUNTA_RETROALIMENTACION}</p>
              <textarea
                value={retroalimentacion}
                rows={4}
                placeholder="Escribe tus observaciones..."
                onChange={e => setRetroalimentacion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none"
              />
            </div>
            <button
              onClick={guardarRetroalimentacion}
              disabled={!retroalimentacion.trim() || guardandoRetro}
              className="mt-5 w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Save size={16} /> {guardandoRetro ? 'Guardando...' : 'Guardar retroalimentación'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Vista: solicitudes de sesión (participantes sin grupo) ──────────────────
function SolicitudesSesion({ facilitadorId, grupos, onGrupoCreado }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [formAbierto, setFormAbierto] = useState(null)
  const [grupoElegido, setGrupoElegido] = useState('')
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState('')
  const [enviando, setEnviando] = useState(null)
  const [avisoExploracion, setAvisoExploracion] = useState(false)
  const [errorCarga, setErrorCarga] = useState('')
  const [errorAsignar, setErrorAsignar] = useState('')

  useEffect(() => {
    if (DEMO_MODE) { setCargando(false); return }
    cargar()
  }, [])

  async function cargar() {
    setErrorCarga('')
    const { data, error } = await supabase
      .from('solicitudes_sesion')
      .select('*, usuarios!solicitudes_sesion_usuario_id_fkey(nombre, correo)')
      .eq('estado', 'pendiente')
      .or(`facilitador_id.eq.${facilitadorId},facilitador_id.is.null`)
      .order('created_at')
    if (error) setErrorCarga(error.message)
    setSolicitudes(data || [])
    setCargando(false)
  }

  function bloqueadoPorExploracion() {
    if (!esPerfilExploracion({ id: facilitadorId })) return false
    setAvisoExploracion(true)
    setTimeout(() => setAvisoExploracion(false), 4000)
    return true
  }

  function abrirForm(id) {
    setFormAbierto(id)
    setGrupoElegido('')
    setNombreNuevoGrupo('')
    setErrorAsignar('')
  }

  async function asignar(solicitud) {
    if (bloqueadoPorExploracion()) return
    setErrorAsignar('')
    let grupoId = grupoElegido

    setEnviando(solicitud.id)

    if (!grupoId) {
      if (!nombreNuevoGrupo.trim()) { setEnviando(null); return }
      const { data: nuevoGrupo, error } = await supabase.from('grupos').insert({
        nombre: nombreNuevoGrupo.trim(), facilitador_id: facilitadorId,
        codigo: generarCodigo(), modulo_activo_id: solicitud.modulo_id,
      }).select().single()
      if (error || !nuevoGrupo) {
        setErrorAsignar('No se pudo crear el grupo. Intenta de nuevo.')
        setEnviando(null)
        return
      }
      grupoId = nuevoGrupo.id
      onGrupoCreado?.({ ...nuevoGrupo, participantes_count: 0 })
    }

    await supabase.from('usuarios').update({ grupo_id: grupoId }).eq('id', solicitud.usuario_id)
    await supabase.from('solicitudes_sesion').update({
      estado: 'atendida', atendida_por: facilitadorId, facilitador_id: facilitadorId,
    }).eq('id', solicitud.id)

    setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id))
    setFormAbierto(null)
    setEnviando(null)
  }

  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">
      {avisoExploracion && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl">
          <AlertTriangle size={16} /> Estás en modo de exploración — regístrate o inicia sesión para asignar grupos reales.
        </div>
      )}

      {errorCarga && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertTriangle size={16} /> No se pudieron cargar las solicitudes: {errorCarga}
        </div>
      )}

      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-12 text-center">
          <Inbox size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="font-semibold text-gray-600 mb-1">No hay solicitudes pendientes</p>
          <p className="text-sm text-gray-400">Aquí verás a los participantes sin grupo que pidan integrarse a una sesión grupal.</p>
        </div>
      ) : solicitudes.map((s) => {
        const modulo = MODULOS.find(m => m.id === s.modulo_id)
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div>
                <p className="font-bold text-gray-800 text-sm">{s.usuarios?.nombre || 'Participante'}</p>
                <p className="text-xs text-gray-400">{s.usuarios?.correo}</p>
              </div>
              {!s.facilitador_id && (
                <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Bolsa común</span>
              )}
            </div>
            <p className="text-xs text-morado font-medium mb-3">
              Módulo {modulo?.numero} — {modulo?.titulo}
            </p>

            {formAbierto === s.id ? (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                {errorAsignar && <p className="text-red-500 text-xs">{errorAsignar}</p>}
                {grupos.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Asignar a un grupo existente</label>
                    <select value={grupoElegido} onChange={e => { setGrupoElegido(e.target.value); setNombreNuevoGrupo('') }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado bg-white">
                      <option value="">Elige un grupo…</option>
                      {grupos.map(g => {
                        const moduloGrupo = MODULOS.find(m => m.id === g.modulo_activo_id)
                        return (
                          <option key={g.id} value={g.id}>
                            {g.nombre} ({g.codigo}) — {moduloGrupo ? `Módulo ${moduloGrupo.numero}` : 'sin módulo activo'}
                          </option>
                        )
                      })}
                    </select>
                    {grupoElegido && grupos.find(g => g.id === grupoElegido)?.modulo_activo_id !== s.modulo_id && (
                      <p className="flex items-center gap-1 text-xs text-yellow-600 mt-1.5">
                        <AlertTriangle size={12} /> Este grupo va en otro módulo — si lo asignas aquí, quedará bloqueado hasta que alcance el módulo de este grupo.
                      </p>
                    )}
                  </div>
                )}
                {grupos.length > 0 && <p className="text-center text-xs text-gray-400">o crea uno nuevo</p>}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del grupo nuevo</label>
                  <input type="text" value={nombreNuevoGrupo}
                    onChange={e => { setNombreNuevoGrupo(e.target.value); setGrupoElegido('') }}
                    placeholder="Ej. Equipo Norte — Turno Mañana"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => asignar(s)} disabled={(!grupoElegido && !nombreNuevoGrupo.trim()) || enviando === s.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-morado text-white font-bold py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40">
                    <Users size={14} /> {enviando === s.id ? 'Asignando...' : 'Asignar al grupo'}
                  </button>
                  <button onClick={() => setFormAbierto(null)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => abrirForm(s.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-morado bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Users size={13} /> Asignar a un grupo
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PanelFacilitador() {
  const { perfil } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [reporte, setReporte] = useState(null)
  const [grupoActivo, setGrupoActivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [errorCrear, setErrorCrear] = useState('')
  const [vista, setVista] = useState('grupos')

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
    await cargarReporte(gs.map(g => g.id))
    setCargando(false)
  }

  // Reporte agregado (útil para mostrarle avance a la empresa)
  async function cargarReporte(grupoIds) {
    if (!grupoIds.length) { setReporte({ participantes: 0, quizAprobados: 0, compromisosRegistrados: 0 }); return }
    const { data: usuariosGrupo } = await supabase.from('usuarios').select('id').in('grupo_id', grupoIds)
    const ids = (usuariosGrupo || []).map(u => u.id)
    if (!ids.length) { setReporte({ participantes: 0, quizAprobados: 0, compromisosRegistrados: 0 }); return }
    const [{ count: quizAprobados }, { count: compromisosRegistrados }] = await Promise.all([
      supabase.from('quiz_respuestas').select('*', { count: 'exact', head: true }).in('usuario_id', ids).eq('aprobado', true),
      supabase.from('compromisos_personales').select('*', { count: 'exact', head: true }).in('usuario_id', ids),
    ])
    setReporte({ participantes: ids.length, quizAprobados: quizAprobados || 0, compromisosRegistrados: compromisosRegistrados || 0 })
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setVista('grupos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${vista === 'grupos' ? 'bg-white text-morado shadow-sm' : 'text-gray-500 hover:text-morado'}`}
          >
            <Users size={15} /> Mis grupos
          </button>
          <button
            onClick={() => setVista('solicitudes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${vista === 'solicitudes' ? 'bg-white text-morado shadow-sm' : 'text-gray-500 hover:text-morado'}`}
          >
            <Inbox size={15} /> Solicitudes de sesión
          </button>
        </div>

        {vista === 'grupos' ? (
          <ListaGrupos
            grupos={grupos}
            reporte={reporte}
            onSeleccionar={setGrupoActivo}
            onCrear={manejarCrear}
            creando={creando}
            nombreNuevo={nombreNuevo}
            setNombreNuevo={setNombreNuevo}
            errorCrear={errorCrear}
          />
        ) : (
          <SolicitudesSesion
            facilitadorId={perfil.id}
            grupos={grupos}
            onGrupoCreado={(g) => setGrupos(prev => [...prev, g])}
          />
        )}
      </div>
    </div>
  )
}
