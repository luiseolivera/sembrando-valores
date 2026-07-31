import { useState, useEffect } from 'react'
import { supabase, DEMO_MODE, esPerfilExploracion } from '../../lib/supabase'
import { Users, Send, Clock, CheckCircle, ArrowRight } from 'lucide-react'

export default function PasoSesion({ modulo, perfil, onAvanzar }) {
  const [sesiones, setSesiones] = useState([])
  const [sesionElegidaId, setSesionElegidaId] = useState(null)
  const [solicitud, setSolicitud] = useState(null)
  const [habilitado, setHabilitado] = useState(false)
  const [facilitadores, setFacilitadores] = useState([])
  const [facilitadorElegido, setFacilitadorElegido] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const esIndividual = !perfil?.grupo_id

  useEffect(() => {
    if (DEMO_MODE) { setCargando(false); return }
    cargar()
  }, [])

  async function cargar() {
    const promesas = {
      eleccion: supabase.from('sesion_elecciones').select('sesion_id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle(),
      habilitacion: supabase.from('habilitaciones_compromisos').select('id').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle(),
    }
    if (perfil.grupo_id) {
      promesas.grupo = supabase.from('sesiones_grupales').select('*').eq('modulo_id', modulo.id).eq('grupo_id', perfil.grupo_id)
    } else {
      promesas.solicitud = supabase.from('solicitudes_sesion').select('*').eq('usuario_id', perfil.id).eq('modulo_id', modulo.id).maybeSingle()
      promesas.facilitadores = supabase.from('usuarios').select('id, nombre').eq('rol', 'facilitador').eq('aprobado', true).order('nombre')
    }
    const claves = Object.keys(promesas)
    const results = await Promise.all(claves.map((k) => promesas[k]))
    const res = Object.fromEntries(claves.map((k, i) => [k, results[i]]))

    setSesiones(res.grupo?.data || [])
    setSesionElegidaId(res.eleccion.data?.sesion_id || null)
    setSolicitud(res.solicitud?.data || null)
    setHabilitado(!!res.habilitacion.data)
    if (res.facilitadores) setFacilitadores(res.facilitadores.data || [])
    setCargando(false)
  }

  async function elegirSesion(sesionId) {
    if (esPerfilExploracion(perfil)) { setError('Estás en modo de exploración — regístrate o inicia sesión para elegir una sesión real.'); return }
    setEnviando(true)
    await supabase.from('sesion_elecciones').upsert({
      usuario_id: perfil.id, modulo_id: modulo.id, sesion_id: sesionId,
    }, { onConflict: 'usuario_id,modulo_id' })
    setSesionElegidaId(sesionId)
    setEnviando(false)
  }

  async function solicitarUnirseAGrupo() {
    if (esPerfilExploracion(perfil)) { setError('Estás en modo de exploración — regístrate o inicia sesión para solicitar una sesión real.'); return }
    setError('')
    setEnviando(true)
    const facilitadorId = facilitadorElegido || null
    await supabase.from('solicitudes_sesion').insert({
      usuario_id: perfil.id, modulo_id: modulo.id, facilitador_id: facilitadorId,
    })
    setSolicitud({ estado: 'pendiente', facilitador_id: facilitadorId })
    setEnviando(false)
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 text-center">
        <div className="w-8 h-8 border-4 border-morado border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const sesionElegida = sesiones.find(s => s.id === sesionElegidaId)

  return (
    <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-6">
      <h2 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
        <Users size={20} className="text-dorado-dark" /> Paso — Sesión grupal
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Antes de registrar tus compromisos, necesitas tener tu sesión grupal de este módulo.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {habilitado ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle size={16} /> Tu facilitador ya habilitó tus compromisos de este módulo.
          </div>
          <button
            onClick={onAvanzar}
            className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors flex items-center justify-center gap-2"
          >
            Continuar a compromisos <ArrowRight size={16} />
          </button>
        </div>
      ) : sesionElegida ? (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-yellow-200 p-4">
            <p className="text-sm font-semibold text-gray-800">
              {sesionElegida.fecha
                ? new Date(sesionElegida.fecha).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                : 'Sin fecha definida'}
            </p>
            <p className="text-xs text-gray-400 truncate">{sesionElegida.link_reunion}</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm px-4 py-3 rounded-xl">
            <Clock size={16} /> Esperando que tu facilitador habilite tus compromisos tras la sesión.
          </div>
        </div>
      ) : sesiones.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Elige una opción de horario</p>
          {sesiones.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-yellow-200 p-3">
              <p className="text-sm text-gray-700">
                {s.fecha
                  ? new Date(s.fecha).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                  : 'Sin fecha definida'}
              </p>
              <button
                onClick={() => elegirSesion(s.id)}
                disabled={enviando}
                className="flex-shrink-0 bg-morado text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-50"
              >
                Elegir
              </button>
            </div>
          ))}
        </div>
      ) : esIndividual ? (
        solicitud ? (
          <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm px-4 py-3 rounded-xl">
            <Clock size={16} /> Tu solicitud está pendiente — un facilitador te integrará a un grupo pronto.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">¿Con qué facilitador?</label>
              <select
                value={facilitadorElegido}
                onChange={(e) => setFacilitadorElegido(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-morado bg-white"
              >
                <option value="">Cualquier facilitador disponible</option>
                {facilitadores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>
            <button
              onClick={solicitarUnirseAGrupo}
              disabled={enviando}
              className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Send size={16} /> {enviando ? 'Enviando...' : 'Solicitar unirme a un grupo'}
            </button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm px-4 py-3 rounded-xl">
          <Clock size={16} /> Tu facilitador todavía no agenda una sesión para este módulo.
        </div>
      )}
    </div>
  )
}
