import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import {
  Users, CheckCircle, FileText, Calendar, Plus, Link as LinkIcon,
  Target, Star, ChevronDown, ChevronUp, Save, Clipboard, AlertCircle
} from 'lucide-react'

const PREGUNTAS_EVALUACION = [
  '¿El tema del módulo fue trabajado de manera adecuada?',
  '¿Los materiales utilizados fueron apropiados para el grupo?',
  '¿El espacio donde se realizó la sesión fue adecuado?',
  '¿La participación del grupo fue activa y significativa?',
  '¿Hay observaciones o sugerencias para mejorar la próxima sesión?',
]

export default function PanelFacilitador() {
  const { perfil } = useAuth()
  const [moduloSeleccionado, setModuloSeleccionado] = useState(MODULOS[6])
  const [participantes, setParticipantes] = useState([])
  const [reflexiones, setReflexiones] = useState([])
  const [compromisoTexto, setCompromisoTexto] = useState(['', '', ''])
  const [sesionForm, setSesionForm] = useState({ fecha: '', link: '' })
  const [evaluacion, setEvaluacion] = useState(Array(5).fill(''))
  const [tabActiva, setTabActiva] = useState('progreso')
  const [grupoId, setGrupoId] = useState(null)
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardandoCompromisos, setGuardandoCompromisos] = useState(false)
  const [guardandoSesion, setGuardandoSesion] = useState(false)
  const [exito, setExito] = useState('')
  const [reflexionesExpandidas, setReflexionesExpandidas] = useState({})

  useEffect(() => {
    if (perfil) cargarGrupo()
  }, [perfil])

  useEffect(() => {
    if (grupoId) cargarDatosModulo()
  }, [moduloSeleccionado, grupoId])

  async function cargarGrupo() {
    const { data: grupo } = await supabase
      .from('grupos')
      .select('*')
      .eq('facilitador_id', perfil.id)
      .maybeSingle()

    if (grupo) {
      setGrupoId(grupo.id)
      setNombreGrupo(grupo.nombre)
      const { data: miembros } = await supabase
        .from('usuarios')
        .select('id, nombre, correo')
        .eq('grupo_id', grupo.id)
      setParticipantes(miembros || [])
    }
    setCargando(false)
  }

  async function crearGrupo() {
    if (!nombreGrupo.trim()) return
    const { data, error } = await supabase
      .from('grupos')
      .insert({ nombre: nombreGrupo, facilitador_id: perfil.id })
      .select()
      .single()
    if (!error) {
      setGrupoId(data.id)
      await supabase.from('usuarios').update({ grupo_id: data.id }).eq('id', perfil.id)
      setExito('Grupo creado correctamente.')
    }
  }

  async function cargarDatosModulo() {
    if (!grupoId) return
    const ids = participantes.map((p) => p.id)
    if (ids.length === 0) {
      setReflexiones([])
      return
    }
    const { data } = await supabase
      .from('reflexiones')
      .select('*, usuarios(nombre)')
      .eq('modulo_id', moduloSeleccionado.id)
      .in('usuario_id', ids)
      .order('usuario_id')
    setReflexiones(data || [])
  }

  async function guardarCompromisos() {
    const validos = compromisoTexto.filter((c) => c.trim())
    if (!validos.length || !grupoId) return
    setGuardandoCompromisos(true)
    await supabase.from('compromisos').insert(
      validos.map((texto) => ({
        grupo_id: grupoId,
        modulo_id: moduloSeleccionado.id,
        compromiso_texto: texto,
        facilitador_id: perfil.id,
      }))
    )
    setCompromisoTexto(['', '', ''])
    setGuardandoCompromisos(false)
    setExito('¡Compromisos guardados! Ya son visibles para el grupo.')
    setTimeout(() => setExito(''), 4000)
  }

  async function guardarSesion() {
    if (!sesionForm.link || !grupoId) return
    setGuardandoSesion(true)
    await supabase.from('sesiones_grupales').upsert({
      grupo_id: grupoId,
      modulo_id: moduloSeleccionado.id,
      fecha: sesionForm.fecha || null,
      link_reunion: sesionForm.link,
    }, { onConflict: 'grupo_id,modulo_id' })
    setGuardandoSesion(false)
    setExito('Sesión guardada. El grupo ya puede ver el enlace.')
    setTimeout(() => setExito(''), 4000)
  }

  function toggleReflexion(userId) {
    setReflexionesExpandidas((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  const reflexionesPorUsuario = reflexiones.reduce((acc, r) => {
    if (!acc[r.usuario_id]) acc[r.usuario_id] = { nombre: r.usuarios?.nombre, preguntas: [] }
    acc[r.usuario_id].preguntas.push(r)
    return acc
  }, {})

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-morado mb-1">Panel del Facilitador</h1>
        <p className="text-gray-500 text-sm mb-8">Gestiona tu grupo y las sesiones del programa</p>

        {exito && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
            <CheckCircle size={16} /> {exito}
          </div>
        )}

        {/* Crear grupo si no existe */}
        {!grupoId && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-8">
            <h2 className="font-bold text-morado text-lg mb-3 flex items-center gap-2">
              <Users size={20} /> Crear tu grupo
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Primero crea tu grupo para que los participantes puedan unirse.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={nombreGrupo}
                onChange={(e) => setNombreGrupo(e.target.value)}
                placeholder="Nombre del grupo (ej. Equipo Norte 2025)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
              />
              <button
                onClick={crearGrupo}
                className="bg-morado text-white font-bold px-6 py-2.5 rounded-xl hover:bg-morado-dark transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        )}

        {/* Info grupo */}
        {grupoId && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 font-medium mb-1">Nombre del grupo</p>
              <p className="font-bold text-morado text-lg">{nombreGrupo}</p>
            </div>
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 font-medium mb-1">Código de grupo</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-bold text-morado text-lg">{grupoId.slice(0, 8).toUpperCase()}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(grupoId)}
                  className="text-gray-400 hover:text-morado"
                  title="Copiar código"
                >
                  <Clipboard size={16} />
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 font-medium mb-1">Participantes</p>
              <p className="font-bold text-morado text-lg">{participantes.length}</p>
            </div>
          </div>
        )}

        {/* Selector de módulo */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Módulo activo</label>
          <select
            value={moduloSeleccionado.id}
            onChange={(e) => setModuloSeleccionado(MODULOS.find((m) => m.id === parseInt(e.target.value)))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
          >
            {MODULOS.map((m) => (
              <option key={m.id} value={m.id}>Módulo {m.numero} — {m.titulo}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {[
            { key: 'progreso', label: 'Progreso', icono: CheckCircle },
            { key: 'reflexiones', label: 'Reflexiones', icono: FileText },
            { key: 'sesion', label: 'Sesión', icono: Calendar },
            { key: 'compromisos', label: 'Compromisos', icono: Target },
            { key: 'evaluacion', label: 'Evaluación', icono: Star },
          ].map(({ key, label, icono: Icono }) => (
            <button
              key={key}
              onClick={() => setTabActiva(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${
                tabActiva === key
                  ? 'bg-white text-morado shadow-sm'
                  : 'text-gray-500 hover:text-morado'
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
                <CheckCircle size={18} /> Progreso del grupo en Módulo {moduloSeleccionado.numero}
              </h3>
            </div>
            {participantes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay participantes en el grupo.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {participantes.map((p) => {
                  const tieneReflexion = reflexiones.some((r) => r.usuario_id === p.id)
                  return (
                    <div key={p.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.correo}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          tieneReflexion ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {tieneReflexion ? '✓ Reflexión enviada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Reflexiones */}
        {tabActiva === 'reflexiones' && (
          <div className="space-y-4">
            {Object.keys(reflexionesPorUsuario).length === 0 ? (
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-8 text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aún no hay reflexiones enviadas para este módulo.</p>
              </div>
            ) : (
              Object.entries(reflexionesPorUsuario).map(([uid, data]) => (
                <div key={uid} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleReflexion(uid)}
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
                      {data.preguntas
                        .sort((a, b) => a.pregunta_numero - b.pregunta_numero)
                        .map((r) => (
                          <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-bold text-morado mb-1">
                              {moduloSeleccionado.preguntas_reflexion[r.pregunta_numero - 1]}
                            </p>
                            <p className="text-sm text-gray-700">{r.respuesta_texto}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ))
            )}
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
                <input
                  type="datetime-local"
                  value={sesionForm.fecha}
                  onChange={(e) => setSesionForm({ ...sesionForm, fecha: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Enlace de la reunión (Google Meet o Zoom)
                </label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={sesionForm.link}
                    onChange={(e) => setSesionForm({ ...sesionForm, link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-morado"
                  />
                </div>
              </div>
              <button
                onClick={guardarSesion}
                disabled={!sesionForm.link || guardandoSesion || !grupoId}
                className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} /> {guardandoSesion ? 'Guardando...' : 'Guardar y notificar al grupo'}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Compromisos */}
        {tabActiva === 'compromisos' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
              <Target size={18} className="text-dorado" /> Registrar compromisos del grupo
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Puedes registrar hasta 3 compromisos al finalizar la sesión grupal.
            </p>
            <div className="space-y-3 mb-5">
              {compromisoTexto.map((texto, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-dorado rounded-full flex items-center justify-center text-morado font-bold text-xs flex-shrink-0 mt-2">
                    {i + 1}
                  </div>
                  <textarea
                    value={texto}
                    onChange={(e) => {
                      const nuevos = [...compromisoTexto]
                      nuevos[i] = e.target.value
                      setCompromisoTexto(nuevos)
                    }}
                    rows={2}
                    placeholder={`Compromiso ${i + 1} (opcional)`}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={guardarCompromisos}
              disabled={compromisoTexto.every((c) => !c.trim()) || guardandoCompromisos || !grupoId}
              className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {guardandoCompromisos ? 'Guardando...' : 'Registrar compromisos'}
            </button>
          </div>
        )}

        {/* Tab: Evaluación */}
        {tabActiva === 'evaluacion' && (
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6">
            <h3 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
              <Star size={18} className="text-dorado" /> Evaluación de la sesión
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Estas preguntas son para la mejora continua del programa.
            </p>
            <div className="space-y-5">
              {PREGUNTAS_EVALUACION.map((pregunta, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 text-sm mb-3">{i + 1}. {pregunta}</p>
                  {i < 4 ? (
                    <div className="flex gap-2">
                      {['1', '2', '3', '4', '5'].map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            const nuevas = [...evaluacion]
                            nuevas[i] = n
                            setEvaluacion(nuevas)
                          }}
                          className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all ${
                            evaluacion[i] === n
                              ? 'border-morado bg-morado text-white'
                              : 'border-gray-200 text-gray-500 hover:border-morado'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 self-center ml-1">(1=bajo, 5=excelente)</span>
                    </div>
                  ) : (
                    <textarea
                      value={evaluacion[i]}
                      onChange={(e) => {
                        const nuevas = [...evaluacion]
                        nuevas[i] = e.target.value
                        setEvaluacion(nuevas)
                      }}
                      rows={3}
                      placeholder="Escribe tus observaciones..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-morado resize-none"
                    />
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
