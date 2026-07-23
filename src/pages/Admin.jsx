import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, esAdmin } from '../lib/supabase'
import { ShieldCheck, CheckCircle, Clock, Mail, ShieldAlert } from 'lucide-react'

export default function Admin() {
  const { perfil } = useAuth()
  const [searchParams] = useSearchParams()
  const idDestacado = searchParams.get('id')
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [aprobando, setAprobando] = useState(null)

  useEffect(() => {
    if (esAdmin(perfil)) cargarPendientes()
    else setCargando(false)
  }, [perfil])

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

  async function aprobar(id) {
    setAprobando(id)
    await supabase.from('usuarios').update({ aprobado: true }).eq('id', id)
    setPendientes((prev) => prev.filter((p) => p.id !== id))
    setAprobando(null)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
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
                <button
                  onClick={() => aprobar(p.id)}
                  disabled={aprobando === p.id}
                  className="flex-shrink-0 flex items-center gap-2 bg-morado text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-morado-dark transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={15} /> {aprobando === p.id ? 'Aprobando...' : 'Aprobar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
