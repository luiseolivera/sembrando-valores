import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../data/modulos'
import { ChevronLeft, Printer, Award, Sprout, Clock, Send } from 'lucide-react'

export default function Constancia() {
  const { perfil } = useAuth()
  const [completo, setCompleto] = useState(false)
  const [liberada, setLiberada] = useState(false)
  const [logoEmpresa, setLogoEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (perfil) verificar()
  }, [perfil])

  async function verificar() {
    const queries = [
      supabase.from('quiz_respuestas').select('modulo_id, aprobado').eq('usuario_id', perfil.id),
      supabase.from('reflexiones').select('modulo_id').eq('usuario_id', perfil.id),
      supabase.from('compromisos_personales').select('modulo_id').eq('usuario_id', perfil.id),
    ]
    if (perfil.grupo_id) {
      queries.push(
        supabase.from('sesiones_grupales').select('modulo_id').eq('grupo_id', perfil.grupo_id),
        supabase.from('grupos').select('logo_empresa_url').eq('id', perfil.grupo_id).maybeSingle(),
      )
    }
    const [quizRes, reflexRes, compRes, sesionRes, grupoRes] = await Promise.all(queries)

    const todosCompletos = MODULOS.every((m) => {
      const quizOk = quizRes.data?.find((r) => r.modulo_id === m.id)?.aprobado
      const reflexOk = reflexRes.data?.some((r) => r.modulo_id === m.id)
      const cuartoPaso = perfil.grupo_id
        ? sesionRes?.data?.some((r) => r.modulo_id === m.id)
        : compRes.data?.some((r) => r.modulo_id === m.id)
      return quizOk && reflexOk && cuartoPaso
    })
    setCompleto(todosCompletos)
    if (grupoRes?.data?.logo_empresa_url) setLogoEmpresa(grupoRes.data.logo_empresa_url)

    if (todosCompletos) {
      let { data: registro } = await supabase.from('constancias').select('liberada').eq('usuario_id', perfil.id).maybeSingle()
      if (!registro) {
        const { data: nuevo } = await supabase.from('constancias').insert({ usuario_id: perfil.id }).select('liberada').maybeSingle()
        registro = nuevo
      }
      setLiberada(registro?.liberada || false)
    }
    setCargando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-morado border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!completo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-dorado-dark" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Todavía no está lista</h2>
          <p className="text-gray-500 text-sm mb-6">Tu constancia se genera automáticamente cuando completes los 14 módulos del programa.</p>
          <Link to="/dashboard" className="text-morado font-semibold text-sm hover:underline">← Volver a mi panel</Link>
        </div>
      </div>
    )
  }

  if (!liberada) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-dorado-dark" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Tu constancia está lista</h2>
          <p className="text-gray-500 text-sm mb-6">
            Completaste los 14 módulos. La constancia tiene un costo y se libera una vez completado el pago.
            Contáctanos para completarlo y recibirla.
          </p>
          <a
            href={`mailto:info@misionerosmt.org?subject=${encodeURIComponent('Solicito mi constancia — Sembrando Valores Digital')}&body=${encodeURIComponent(`Hola,\n\nTerminé los 14 módulos del programa y quiero solicitar mi constancia.\n\nNombre: ${perfil?.nombre}\nCorreo: ${perfil?.correo}\n\nGracias.`)}`}
            className="inline-flex items-center gap-2 bg-morado text-white font-bold px-6 py-3 rounded-xl hover:bg-morado-dark transition-colors text-sm mb-3"
          >
            <Send size={15} /> Solicitar mi constancia
          </a>
          <p><Link to="/dashboard" className="text-morado font-semibold text-sm hover:underline">← Volver a mi panel</Link></p>
        </div>
      </div>
    )
  }

  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to="/dashboard" className="flex items-center gap-1 text-morado text-sm font-medium hover:underline">
            <ChevronLeft size={16} /> Volver al inicio
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-morado text-white font-bold px-5 py-2.5 rounded-xl hover:bg-morado-dark transition-colors text-sm"
          >
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-4 border-dorado p-10 sm:p-14 text-center print:shadow-none print:border-2">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-16 h-16 bg-morado rounded-full flex items-center justify-center flex-shrink-0">
              <Sprout size={32} className="text-white" />
            </div>
            {logoEmpresa && (
              <img src={logoEmpresa} alt="Logo de la empresa" className="h-14 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
            )}
          </div>

          <p className="text-dorado-dark font-bold tracking-widest text-xs uppercase mb-2">Constancia de Participación</p>
          <h1 className="text-3xl font-extrabold text-morado mb-6">Sembrando Valores Digital</h1>

          <p className="text-gray-500 text-sm mb-2">Se otorga la presente constancia a</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-dorado inline-block pb-2 px-6">
            {perfil?.nombre}
          </p>

          <p className="text-gray-600 text-sm max-w-lg mx-auto leading-relaxed mb-8">
            por haber completado satisfactoriamente los 14 módulos del Programa Sembrando Valores,
            un espacio de reflexión y formación en valores y principios éticos universales para el
            mundo del trabajo.
          </p>

          <div className="flex items-center justify-center gap-10 text-xs text-gray-400">
            <div>
              <p className="font-bold text-morado text-sm mb-1">Misioneros en el Mundo del Trabajo</p>
              <p>A. C.</p>
            </div>
            <div>
              <p className="font-bold text-morado text-sm mb-1">{fecha}</p>
              <p>Fecha de finalización</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
