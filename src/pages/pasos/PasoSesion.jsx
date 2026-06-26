import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Calendar, Headphones, Target, Trophy, ExternalLink, CheckCircle } from 'lucide-react'

export default function PasoSesion({ modulo, perfil, onAvanzar }) {
  const [sesion, setSesion] = useState(null)
  const [compromisos, setCompromisos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [sesRes, compRes] = await Promise.all([
      supabase.from('sesiones_grupales')
        .select('*')
        .eq('grupo_id', perfil.grupo_id || '')
        .eq('modulo_id', modulo.id)
        .maybeSingle(),
      supabase.from('compromisos')
        .select('*')
        .eq('grupo_id', perfil.grupo_id || '')
        .eq('modulo_id', modulo.id),
    ])
    setSesion(sesRes.data)
    setCompromisos(compRes.data || [])
    setCargando(false)
  }

  if (cargando) return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 text-center">
      <div className="w-8 h-8 border-4 border-morado border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-6">
      <div>
        <h2 className="font-bold text-morado text-lg mb-1 flex items-center gap-2">
          <Users size={20} className="text-dorado" /> Paso 4 — Sesión grupal
        </h2>
        <p className="text-sm text-gray-500">
          La sesión grupal es el espacio para compartir tus reflexiones con el equipo.
        </p>
      </div>

      {/* Sesión agendada */}
      {sesion ? (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h3 className="font-bold text-morado text-sm mb-3 flex items-center gap-2">
            <Calendar size={16} /> Sesión programada
          </h3>
          {sesion.fecha && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Fecha:</span>{' '}
              {new Date(sesion.fecha).toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
          {sesion.link_reunion && (
            <a
              href={sesion.link_reunion}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-morado text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-morado-dark transition-colors"
            >
              <Video size={16} /> Unirse a la sesión <ExternalLink size={14} />
            </a>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <Calendar size={32} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-yellow-800">Sesión aún no programada</p>
          <p className="text-xs text-yellow-700 mt-1">
            Tu facilitador agendará la sesión grupal y te enviará el enlace.
          </p>
        </div>
      )}

      {/* Compromisos */}
      {compromisos.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="font-bold text-morado text-sm mb-3 flex items-center gap-2">
            <Target size={16} className="text-dorado" /> Compromisos del grupo
          </h3>
          <div className="space-y-2">
            {compromisos.map((c) => (
              <div key={c.id} className="flex items-start gap-2 p-2.5 bg-yellow-50 rounded-lg">
                <Trophy size={14} className="text-dorado flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{c.compromiso_texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marcar completado */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 mb-3">
          Cuando hayas participado en la sesión grupal, marca el módulo como completado.
        </p>
        <button
          onClick={onAvanzar}
          className="w-full bg-morado text-white font-bold py-3 rounded-xl hover:bg-morado-dark transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} /> Marcar módulo como completado
        </button>
      </div>
    </div>
  )
}
