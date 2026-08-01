import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, esAdmin } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import { ShieldCheck, CheckCircle, Clock, Mail, ShieldAlert, MessageSquare, Users, XCircle, Trash2, Award, Building2, Search, BarChart3, Inbox } from 'lucide-react'

export default function Admin() {
  const { perfil } = useAuth()
  const [searchParams] = useSearchParams()
  const idDestacado = searchParams.get('id')
  const [pendientes, setPendientes] = useState([])
  const [solicitudesSesion, setSolicitudesSesion] = useState([])
  const [retros, setRetros] = useState([])
  const [constancias, setConstancias] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [aprobando, setAprobando] = useState(null)
  const [rechazando, setRechazando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [liberando, setLiberando] = useState(null)
  const [codigoGrupo, setCodigoGrupo] = useState('')
  const [grupoBuscado, setGrupoBuscado] = useState(null)
  const [buscandoGrupo, setBuscandoGrupo] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [marcandoEmpresa, setMarcandoEmpresa] = useState(false)

  useEffect(() => {
    if (esAdmin(perfil)) { cargarPendientes(); cargarSolicitudesSesion(); cargarRetros(); cargarConstancias(); cargarResumen() }
    else setCargando(false)
  }, [perfil])

  async function cargarResumen() {
    const [
      { count: participantes },
      { count: facilitadoresAprobados },
      { count: gruposTotal },
      { count: gruposEmpresa },
      { count: constanciasLiberadas },
    ] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'participante'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'facilitador').eq('aprobado', true),
      supabase.from('grupos').select('*', { count: 'exact', head: true }),
      supabase.from('grupos').select('*', { count: 'exact', head: true }).eq('es_empresa', true),
      supabase.from('constancias').select('*', { count: 'exact', head: true }).eq('liberada', true),
    ])
    setResumen({
      participantes: participantes || 0,
      facilitadoresAprobados: facilitadoresAprobados || 0,
      gruposTotal: gruposTotal || 0,
      gruposEmpresa: gruposEmpresa || 0,
      constanciasLiberadas: constanciasLiberadas || 0,
    })
  }

  async function cargarPendientes() {
    setCargando(true)
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'facilitador')
      .eq('aprobado', false)
      .order('created_at')
    setPendientes(data || [])
    setCargando(false)
  }

  async function cargarSolicitudesSesion() {
    const { data } = await supabase
      .from('solicitudes_sesion')
      .select(`
        *,
        usuarios!solicitudes_sesion_usuario_id_fkey(nombre, correo),
        facilitador:usuarios!solicitudes_sesion_facilitador_id_fkey(nombre)
      `)
      .eq('estado', 'pendiente')
      .order('created_at')
    setSolicitudesSesion(data || [])
  }

  async function cargarRetros() {
    const { data } = await supabase
      .from('retroalimentacion_sesiones')
      .select('*, grupos(nombre), usuarios(nombre, correo)')
      .order('created_at', { ascending: false })
    setRetros(data || [])
  }

  async function aprobar(id) {
    setAprobando(id)
    await supabase.from('usuarios').update({ aprobado: true }).eq('id', id)
    setPendientes((prev) => prev.filter((p) => p.id !== id))
    setAprobando(null)
  }

  async function rechazar(id) {
    if (!confirm('¿Rechazar esta solicitud? La cuenta seguirá existiendo como participante, pero perderá el rol de facilitador.')) return
    setRechazando(id)
    await supabase.from('usuarios').update({ rol: 'participante' }).eq('id', id)
    setPendientes((prev) => prev.filter((p) => p.id !== id))
    setRechazando(null)
  }

  async function eliminarRetro(id) {
    if (!confirm('¿Eliminar esta retroalimentación? No se puede deshacer.')) return
    setEliminando(id)
    await supabase.from('retroalimentacion_sesiones').delete().eq('id', id)
    setRetros((prev) => prev.filter((r) => r.id !== id))
    setEliminando(null)
  }

  async function cargarConstancias() {
    const { data } = await supabase
      .from('constancias')
      .select('*, usuarios(nombre, correo, grupo_id, grupos(nombre))')
      .eq('liberada', false)
      .order('created_at')
    setConstancias(data || [])
  }

  async function liberar(id) {
    setLiberando(id)
    await supabase.from('constancias').update({ liberada: true, liberada_at: new Date().toISOString() }).eq('id', id)
    setConstancias((prev) => prev.filter((c) => c.id !== id))
    setLiberando(null)
  }

  async function liberarGrupo(ids) {
    if (!confirm(`¿Liberar ${ids.length} constancia(s) de este grupo?`)) return
    setLiberando('grupo')
    await supabase.from('constancias').update({ liberada: true, liberada_at: new Date().toISOString() }).in('id', ids)
    setConstancias((prev) => prev.filter((c) => !ids.includes(c.id)))
    setLiberando(null)
  }

  async function buscarGrupo() {
    setErrorBusqueda('')
    setGrupoBuscado(null)
    if (!codigoGrupo.trim()) return
    setBuscandoGrupo(true)
    const { data } = await supabase.from('grupos').select('*').eq('codigo', codigoGrupo.trim().toUpperCase()).maybeSingle()
    if (!data) setErrorBusqueda('No se encontró ningún grupo con ese código.')
    else setGrupoBuscado(data)
    setBuscandoGrupo(false)
  }

  async function alternarEmpresa() {
    if (!grupoBuscado) return
    setMarcandoEmpresa(true)
    const nuevoValor = !grupoBuscado.es_empresa
    await supabase.from('grupos').update({ es_empresa: nuevoValor }).eq('id', grupoBuscado.id)
    setGrupoBuscado({ ...grupoBuscado, es_empresa: nuevoValor })
    setMarcandoEmpresa(false)
  }

  if (!esAdmin(perfil)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No autorizado</h2>
          <p className="text-gray-500 text-sm">Esta sección es solo para el equipo de Misioneros en el Mundo del Trabajo.</p>
        </div>
      </div>
    )
  }

  const gruposConPendientes = {}
  const sinGrupo = []
  constancias.forEach((c) => {
    const g = c.usuarios?.grupos
    const grupoId = c.usuarios?.grupo_id
    if (g && grupoId) {
      if (!gruposConPendientes[grupoId]) gruposConPendientes[grupoId] = { nombre: g.nombre, items: [] }
      gruposConPendientes[grupoId].items.push(c)
    } else {
      sinGrupo.push(c)
    }
  })

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-morado">Resumen general</h1>
            <p className="text-gray-500 text-sm">Estado general de la plataforma.</p>
          </div>
        </div>

        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{resumen.participantes}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Participantes</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{resumen.facilitadoresAprobados}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Facilitadores</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-yellow-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-dorado-dark">{pendientes.length}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Facilitadores pendientes</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{resumen.gruposTotal}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Grupos ({resumen.gruposEmpresa} empresa)</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-morado">{resumen.constanciasLiberadas}</div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Constancias liberadas ({constancias.length} pendientes)</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-morado">Solicitudes de facilitador</h1>
            <p className="text-gray-500 text-sm">Aprueba a quienes van a crear y gestionar grupos.</p>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-10 text-center text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay solicitudes pendientes por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center justify-between gap-4 ${
                  p.id === idDestacado ? 'border-morado ring-2 ring-purple-200' : 'border-purple-100'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{p.nombre}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail size={11} /> {p.correo}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> Solicitado el {new Date(p.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => rechazar(p.id)}
                    disabled={rechazando === p.id || aprobando === p.id}
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-500 font-semibold text-sm px-3.5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} /> {rechazando === p.id ? 'Rechazando...' : 'Rechazar'}
                  </button>
                  <button
                    onClick={() => aprobar(p.id)}
                    disabled={aprobando === p.id || rechazando === p.id}
                    className="flex items-center gap-2 bg-morado text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={15} /> {aprobando === p.id ? 'Aprobando...' : 'Aprobar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-10 mb-6">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center">
            <Inbox size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-morado">Solicitudes de sesión pendientes</h2>
            <p className="text-gray-500 text-sm">Participantes sin grupo esperando que un facilitador los integre a uno.</p>
          </div>
        </div>

        {solicitudesSesion.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-10 text-center text-gray-400">
            <Inbox size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay solicitudes de sesión pendientes por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudesSesion.map((s) => {
              const modulo = MODULOS.find((m) => m.id === s.modulo_id)
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{s.usuarios?.nombre}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {s.usuarios?.correo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Módulo {modulo?.numero} — {modulo?.titulo}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {s.facilitador ? (
                      <p className="text-xs font-semibold text-morado">Para: {s.facilitador.nombre}</p>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">Bolsa común</span>
                    )}
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 justify-end">
                      <Clock size={11} /> {new Date(s.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-3 mt-10 mb-6">
          <div className="w-10 h-10 bg-dorado rounded-full flex items-center justify-center">
            <MessageSquare size={20} className="text-morado" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-morado">Retroalimentación de facilitadores</h2>
            <p className="text-gray-500 text-sm">Comentarios y sugerencias dejados por cada grupo.</p>
          </div>
        </div>

        {retros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-10 text-center text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Todavía no hay retroalimentación registrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {retros.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-morado">
                      <Users size={11} /> {r.grupos?.nombre || 'Grupo'}
                    </span>
                    <span>·</span>
                    <span>Módulo {MODULOS.find(m => m.id === r.modulo_id)?.numero} — {MODULOS.find(m => m.id === r.modulo_id)?.titulo}</span>
                    <span>·</span>
                    <span>{r.usuarios?.nombre} ({r.usuarios?.correo})</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(r.created_at).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarRetro(r.id)}
                    disabled={eliminando === r.id}
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.comentario}</p>
              </div>
            ))}
          </div>
        )}

        {/* Marcar grupo como empresa */}
        <div className="flex items-center gap-3 mt-10 mb-6">
          <div className="w-10 h-10 bg-morado rounded-full flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-morado">Marcar grupo como empresa</h2>
            <p className="text-gray-500 text-sm">Habilita el logo de empresa para un grupo específico.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 mb-10">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={codigoGrupo}
              onChange={(e) => setCodigoGrupo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && buscarGrupo()}
              placeholder="Código del grupo (ej. AB12CD)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-morado uppercase"
            />
            <button
              onClick={buscarGrupo}
              disabled={buscandoGrupo || !codigoGrupo.trim()}
              className="flex items-center gap-2 bg-morado text-white font-bold px-4 py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 text-sm"
            >
              <Search size={15} /> Buscar
            </button>
          </div>
          {errorBusqueda && <p className="text-red-500 text-xs">{errorBusqueda}</p>}
          {grupoBuscado && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mt-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{grupoBuscado.nombre}</p>
                <p className="text-xs text-gray-400">
                  {grupoBuscado.es_empresa ? 'Marcado como empresa ✓' : 'No es empresa todavía'}
                </p>
              </div>
              <button
                onClick={alternarEmpresa}
                disabled={marcandoEmpresa}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                  grupoBuscado.es_empresa ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-morado text-white hover:bg-morado-dark'
                }`}
              >
                {marcandoEmpresa ? '...' : grupoBuscado.es_empresa ? 'Quitar empresa' : 'Marcar como empresa'}
              </button>
            </div>
          )}
        </div>

        {/* Constancias pendientes de liberar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-dorado rounded-full flex items-center justify-center">
            <Award size={20} className="text-morado" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-morado">Constancias pendientes de liberar</h2>
            <p className="text-gray-500 text-sm">Se liberan una vez completado el pago acordado.</p>
          </div>
        </div>

        {constancias.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-10 text-center text-gray-400">
            <Award size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay constancias pendientes por ahora.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(gruposConPendientes).map(([grupoId, g]) => (
              <div key={grupoId} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-morado text-sm flex items-center gap-1">
                    <Users size={13} /> {g.nombre} — {g.items.length} pendiente{g.items.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => liberarGrupo(g.items.map((c) => c.id))}
                    disabled={liberando === 'grupo'}
                    className="text-xs font-bold bg-morado text-white px-3.5 py-2 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-50"
                  >
                    Liberar todas de este grupo
                  </button>
                </div>
                <div className="space-y-2">
                  {g.items.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700">{c.usuarios?.nombre} <span className="text-gray-400 text-xs">({c.usuarios?.correo})</span></p>
                      <button
                        onClick={() => liberar(c.id)}
                        disabled={liberando === c.id}
                        className="text-xs font-bold text-morado hover:underline disabled:opacity-50"
                      >
                        {liberando === c.id ? 'Liberando...' : 'Liberar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sinGrupo.length > 0 && (
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                <p className="font-bold text-morado text-sm mb-3">Sin grupo (uso individual)</p>
                <div className="space-y-2">
                  {sinGrupo.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700">{c.usuarios?.nombre} <span className="text-gray-400 text-xs">({c.usuarios?.correo})</span></p>
                      <button
                        onClick={() => liberar(c.id)}
                        disabled={liberando === c.id}
                        className="text-xs font-bold text-morado hover:underline disabled:opacity-50"
                      >
                        {liberando === c.id ? 'Liberando...' : 'Liberar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
