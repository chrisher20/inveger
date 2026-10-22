import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { SolicitudVacaciones } from '../../types'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  en_negociacion: 'bg-blue-100 text-blue-700',
}

export default function BandejaVacaciones() {
  const [solicitudes, setSolicitudes] = useState<SolicitudVacaciones[]>([])
  const [seleccionada, setSeleccionada] = useState<SolicitudVacaciones | null>(null)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchSolicitudes = async () => {
    const { data } = await supabase
      .from('solicitudes_vacaciones')
      .select('*')
      .order('fecha_solicitud', { ascending: false })
    if (data) setSolicitudes(data as SolicitudVacaciones[])
  }

  useEffect(() => { fetchSolicitudes() }, [])

  const handleAccion = async (estado: SolicitudVacaciones['estado']) => {
    if (!seleccionada) return
    setLoading(true)

    await supabase.from('solicitudes_vacaciones').update({
      estado,
      comentario_admin: comentario,
    }).eq('id', seleccionada.id)

    // Si aprobada, descontar días del historial
    if (estado === 'aprobada') {
      const { data: historial } = await supabase
        .from('historial_vacaciones')
        .select('saldo_resultante')
        .eq('empleado_id', seleccionada.empleado_id)
        .order('fecha', { ascending: false })
        .limit(1)
        .single()

      const saldoActual = historial?.saldo_resultante ?? 0
      const nuevoSaldo = saldoActual - seleccionada.dias_solicitados

      await supabase.from('historial_vacaciones').insert([{
        empleado_id: seleccionada.empleado_id,
        tipo: 'descuento',
        dias: seleccionada.dias_solicitados,
        descripcion: `Vacaciones aprobadas (${seleccionada.fecha_inicio} al ${seleccionada.fecha_fin})`,
        fecha: new Date().toISOString(),
        saldo_resultante: nuevoSaldo,
      }])
    }

    // Notificar al empleado
    await supabase.from('notificaciones').insert([{
      usuario_id: seleccionada.empleado_id,
      mensaje: `Tu solicitud de vacaciones del ${seleccionada.fecha_inicio} al ${seleccionada.fecha_fin} fue ${estado === 'en_negociacion' ? 'marcada para negociación' : estado}. ${comentario ? 'Nota: ' + comentario : ''}`,
      leida: false,
      fecha: new Date().toISOString(),
    }])

    setSeleccionada(null)
    setComentario('')
    fetchSolicitudes()
    setLoading(false)
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')
  const resto = solicitudes.filter(s => s.estado !== 'pendiente')

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-600 mb-4">📬 Bandeja de Solicitudes de Vacaciones</h2>

      {pendientes.length === 0 && <p className="text-gray-400 mb-4">No hay solicitudes pendientes.</p>}

      {pendientes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Pendientes ({pendientes.length})</h3>
          <div className="space-y-2">
            {pendientes.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">{s.empleado_nombre}</p>
                  <p className="text-gray-500">{s.fecha_inicio} → {s.fecha_fin} ({s.dias_solicitados} días)</p>
                </div>
                <button
                  onClick={() => { setSeleccionada(s); setComentario('') }}
                  className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-600 transition"
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {resto.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Historial</h3>
          <div className="space-y-2">
            {resto.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.empleado_nombre}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[s.estado]}`}>
                    {s.estado.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-500">{s.fecha_inicio} → {s.fecha_fin} ({s.dias_solicitados} días)</p>
                {s.comentario_admin && <p className="text-gray-600 mt-1">Nota admin: {s.comentario_admin}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Revisar */}
      {seleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-primary-600 mb-3">Revisar Solicitud</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 mb-4">
              <p><span className="font-medium">Empleado:</span> {seleccionada.empleado_nombre}</p>
              <p><span className="font-medium">Período:</span> {seleccionada.fecha_inicio} al {seleccionada.fecha_fin}</p>
              <p><span className="font-medium">Días solicitados:</span> {seleccionada.dias_solicitados}</p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Comentario (opcional)</label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={3}
                placeholder="Ej: Fechas aprobadas / Se propone negociar para..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleAccion('aprobada')} disabled={loading}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition">
                ✅ Aprobar
              </button>
              <button onClick={() => handleAccion('en_negociacion')} disabled={loading}
                className="flex-1 bg-blue-400 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition">
                💬 Negociar
              </button>
              <button onClick={() => handleAccion('rechazada')} disabled={loading}
                className="flex-1 bg-red-400 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition">
                ❌ Rechazar
              </button>
            </div>

            <button onClick={() => setSeleccionada(null)} className="w-full mt-2 text-gray-400 text-sm hover:text-gray-600 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
