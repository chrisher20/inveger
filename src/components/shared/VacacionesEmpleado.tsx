import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { HistorialVacaciones, SolicitudVacaciones } from '../../types'
import { differenceInYears, addDays, format, startOfTomorrow } from 'date-fns'

function diasSegunAntiguedad(fechaIngreso: string): number {
  const anos = differenceInYears(new Date(), new Date(fechaIngreso))
  if (anos < 1) return 0
  if (anos <= 1) return 10
  if (anos <= 3) return 12
  if (anos <= 5) return 15
  return 20
}

export default function VacacionesEmpleado() {
  const { user } = useAuth()
  const [saldo, setSaldo] = useState(0)
  const [historial, setHistorial] = useState<HistorialVacaciones[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudVacaciones[]>([])
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([])
  const [justificacion, setJustificacion] = useState('')
  const [notificaciones, setNotificaciones] = useState<{ mensaje: string; fecha: string }[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    if (!user) return
    const { data: hist } = await supabase
      .from('historial_vacaciones').select('*')
      .eq('empleado_id', user.id).order('fecha', { ascending: false })

    const { data: sols } = await supabase
      .from('solicitudes_vacaciones').select('*')
      .eq('empleado_id', user.id).order('fecha_solicitud', { ascending: false })

    const { data: notifs } = await supabase
      .from('notificaciones').select('mensaje, fecha')
      .eq('usuario_id', user.id).order('fecha', { ascending: false }).limit(5)

    if (hist) {
      setHistorial(hist as HistorialVacaciones[])
      setSaldo(hist.length > 0 ? hist[0].saldo_resultante : diasSegunAntiguedad(user.fecha_ingreso))
    } else {
      setSaldo(diasSegunAntiguedad(user.fecha_ingreso))
    }
    if (sols) setSolicitudes(sols as SolicitudVacaciones[])
    if (notifs) setNotificaciones(notifs as { mensaje: string; fecha: string }[])
  }

  useEffect(() => { fetchData() }, [user])

  const toggleDia = (fecha: string) => {
    setDiasSeleccionados(prev =>
      prev.includes(fecha) ? prev.filter(d => d !== fecha) : [...prev, fecha].sort()
    )
  }

  const diasDisponibles = Array.from({ length: 60 }, (_, i) =>
    format(addDays(startOfTomorrow(), i), 'yyyy-MM-dd')
  )

  const handleSolicitar = async () => {
    if (!user || diasSeleccionados.length === 0) return
    setLoading(true)
    setMsg('')
    const fechaInicio = diasSeleccionados[0]
    const fechaFin = diasSeleccionados[diasSeleccionados.length - 1]

    await supabase.from('solicitudes_vacaciones').insert([{
      empleado_id: user.id,
      empleado_nombre: user.nombre,
      dias_solicitados: diasSeleccionados.length,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'pendiente',
      justificacion,
      fecha_solicitud: new Date().toISOString(),
    }])

    setMsg(`✅ Solicitud enviada: ${diasSeleccionados.length} día(s) del ${fechaInicio} al ${fechaFin}`)
    setDiasSeleccionados([])
    setJustificacion('')
    fetchData()
    setLoading(false)
  }

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    en_negociacion: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-primary-600">🏖️ Mis Vacaciones</h2>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-primary-600 font-medium">Días disponibles</p>
          <p className="text-4xl font-bold text-primary-700">{saldo}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Según antigüedad:</p>
          <p className="font-medium">{diasSegunAntiguedad(user?.fecha_ingreso ?? '')} días/año</p>
        </div>
      </div>

      {notificaciones.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="font-semibold text-blue-700 text-sm mb-2">🔔 Notificaciones</p>
          {notificaciones.map((n, i) => (
            <p key={i} className="text-sm text-blue-600 mb-1">• {n.mensaje}</p>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Solicitar vacaciones</h3>
        <p className="text-sm text-gray-500 mb-3">Selecciona los días (a partir de mañana):</p>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['D','L','M','M','J','V','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
          {diasDisponibles.map(fecha => {
            const d = new Date(fecha + 'T00:00:00')
            const seleccionado = diasSeleccionados.includes(fecha)
            return (
              <button key={fecha} onClick={() => toggleDia(fecha)}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${seleccionado ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-primary-100 text-gray-700'}`}>
                {format(d, 'd')}
              </button>
            )
          })}
        </div>

        {diasSeleccionados.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm">
            <p><span className="font-medium">Días seleccionados:</span> {diasSeleccionados.length}</p>
            <p><span className="font-medium">Del:</span> {diasSeleccionados[0]}</p>
            <p><span className="font-medium">Al:</span> {diasSeleccionados[diasSeleccionados.length - 1]}</p>
          </div>
        )}

        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700">Justificación (opcional)</label>
          <textarea value={justificacion} onChange={e => setJustificacion(e.target.value)} rows={2}
            placeholder="Motivo de la solicitud..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}

        <button onClick={handleSolicitar}
          disabled={diasSeleccionados.length === 0 || loading || diasSeleccionados.length > saldo}
          className="w-full bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">
          {loading ? 'Enviando...' : `Confirmar solicitud (${diasSeleccionados.length} día${diasSeleccionados.length !== 1 ? 's' : ''})`}
        </button>
        {diasSeleccionados.length > saldo && (
          <p className="text-red-500 text-xs mt-1">No tienes suficientes días disponibles.</p>
        )}
      </div>

      {solicitudes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Mis solicitudes</h3>
          <div className="space-y-2">
            {solicitudes.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <div>
                  <p className="font-medium">{s.fecha_inicio} → {s.fecha_fin}</p>
                  <p className="text-gray-500">{s.dias_solicitados} días</p>
                  {(s as SolicitudVacaciones & { justificacion?: string }).justificacion && (
                    <p className="text-gray-500 text-xs">Motivo: {(s as SolicitudVacaciones & { justificacion?: string }).justificacion}</p>
                  )}
                  {s.comentario_admin && <p className="text-gray-600 text-xs">Admin: {s.comentario_admin}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[s.estado]}`}>
                  {s.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Historial de días</h3>
          <div className="space-y-2">
            {historial.map(h => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-700">{h.descripcion}</p>
                  <p className="text-gray-400 text-xs">{format(new Date(h.fecha), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${h.tipo === 'acumulacion' ? 'text-green-600' : 'text-red-500'}`}>
                    {h.tipo === 'acumulacion' ? '+' : '-'}{h.dias}
                  </p>
                  <p className="text-gray-400 text-xs">Saldo: {h.saldo_resultante}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
