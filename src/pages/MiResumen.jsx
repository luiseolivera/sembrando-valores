import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import { ChevronLeft, Printer, PenLine, Target, CheckCircle } from 'lucide-react'

export default function MiResumen() {
  const { perfil } = useAuth()
  const [reflexionesPorModulo, setReflexionesPorModulo] = useState({})
  const [compromisosPorModulo, setCompromisosPorModulo] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (perfil) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    const [reflexRes, compRes] = await Promise.all([
      supabase.from('reflexiones').select('modulo_id, pregunta_numero, respuesta_texto').eq('usuario_id', perfil.id),
      supabase.from('compromisos_personales').select('modulo_id, compromiso_texto, cumplido').eq('usuario_id', perfil.id),
    ])

    const reflex = {}
    ;(reflexRes.data || []).forEach((r) => {
      if (!reflex[r.modulo_id]) reflex[r.modulo_id] = []
      reflex[r.modulo_id].push(r)
    })
    Object.values(reflex).forEach((lista) => lista.sort((a, b) => a.pregunta_numero - b.pregunta_numero))

    const comp = {}
    ;(compRes.data || []).forEach((c) => {
      if (!comp[c.modulo_id]) comp[c.modulo_id] = []
      comp[c.modulo_id].push(c)
    })

    setReflexionesPorModulo(reflex)
    setCompromisosPorModulo(comp)
    setCargando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const modulosConDatos = MODULOS.filter(
    (m) => reflexionesPorModulo[m.id]?.length || compromisosPorModulo[m.id]?.length
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/dashboard" className="flex items-center gap-1 text-morado text-sm font-medium hover:underline">
            <ChevronLeft size={16} /> Volver al inicio
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-morado text-white font-bold px-5 py-2.5 rounded-xl hover:bg-morado-dark transition-colors text-sm"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 mb-6 print:shadow-none print:border-0 print:p-0">
          <h1 className="text-2xl font-extrabold text-morado mb-1">Mis reflexiones y compromisos</h1>
          <p className="text-sm text-gray-500">{perfil?.nombre}</p>
        </div>

        {modulosConDatos.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 text-center text-gray-500 text-sm">
            Todavía no tienes reflexiones ni compromisos guardados.
          </div>
        )}

        <div className="space-y-6">
          {modulosConDatos.map((modulo) => (
            <div
              key={modulo.id}
              className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid"
            >
              <h2 className="font-bold text-morado text-lg mb-4">
                Módulo {modulo.numero} — {modulo.titulo}
              </h2>

              {reflexionesPorModulo[modulo.id]?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <PenLine size={13} className="text-dorado" /> Reflexión personal
                  </p>
                  <div className="space-y-3">
                    {reflexionesPorModulo[modulo.id].map((r) => (
                      <div key={r.pregunta_numero}>
                        <p className="text-sm font-semibold text-gray-800">
                          {modulo.preguntas_reflexion?.[r.pregunta_numero - 1] || `Pregunta ${r.pregunta_numero}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{r.respuesta_texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {compromisosPorModulo[modulo.id]?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <Target size={13} className="text-dorado" /> Mis compromisos
                  </p>
                  <div className="space-y-2">
                    {compromisosPorModulo[modulo.id].map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {c.cumplido ? (
                          <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-[15px] h-[15px] rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${c.cumplido ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {c.compromiso_texto}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
