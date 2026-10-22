import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Código de Trabajo Honduras:
// Jornada diurna: 5am - 7pm (máx 8h/día, 44h/semana)
// Jornada nocturna: 7pm - 5am (máx 36h/semana)
// Hora extra diurna: +25% del valor hora normal
// Hora extra nocturna (7pm-12:30am): +50%
// Hora extra nocturna extendida (12:30am-5am): +75%
// Días feriados o descanso obligatorio: +100%

function calcularPago(salarioMensual: number, horasDiurnas: number, horasNocturnas: number, horasFeriado: number) {
  const salarioHora = salarioMensual / (30 * 8)
  const pagoDiurno = horasDiurnas * salarioHora * 1.25
  const pagoNocturno = horasNocturnas * salarioHora * 1.50
  const pagoFeriado = horasFeriado * salarioHora * 2.00
  const total = pagoDiurno + pagoNocturno + pagoFeriado
  return { salarioHora, pagoDiurno, pagoNocturno, pagoFeriado, total }
}

export default function HorasExtra() {
  const { user } = useAuth()
  const [fecha, setFecha] = useState('')
  const [horasDiurnas, setHorasDiurnas] = useState(0)
  const [horasNocturnas, setHorasNocturnas] = useState(0)
  const [horasFeriado, setHorasFeriado] = useState(0)
  const [resultado, setResultado] = useState<ReturnType<typeof calcularPago> | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(false)

  const salario = user?.salario ?? 0

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    setResultado(calcularPago(salario, horasDiurnas, horasNocturnas, horasFeriado))
    setGuardado(false)
  }

  const handleGuardar = async () => {
    if (!user || !resultado) return
    setLoading(true)
    await supabase.from('horas_extra').insert([{
      empleado_id: user.id,
      fecha,
      horas_diurnas: horasDiurnas,
      horas_nocturnas: horasNocturnas,
      horas_feriado: horasFeriado,
      salario_hora: resultado.salarioHora,
      total_pagar: resultado.total,
      created_at: new Date().toISOString(),
    }])
    setGuardado(true)
    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-primary-600 mb-2">⏰ Horas Extra</h2>
      <p className="text-sm text-gray-500 mb-4">Calculado según el Código de Trabajo de Honduras.</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mb-5 space-y-1">
        <p><span className="font-medium">Jornada diurna:</span> 5am–7pm → +25% por hora extra</p>
        <p><span className="font-medium">Jornada nocturna:</span> 7pm–12:30am → +50% por hora extra</p>
        <p><span className="font-medium">Nocturna extendida:</span> 12:30am–5am → +75% por hora extra</p>
        <p><span className="font-medium">Feriados/descanso:</span> +100% del valor hora</p>
      </div>

      <form onSubmit={handleCalcular} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Horas diurnas extra</label>
            <input type="number" min={0} max={16} value={horasDiurnas} onChange={e => setHorasDiurnas(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Horas nocturnas extra</label>
            <input type="number" min={0} max={16} value={horasNocturnas} onChange={e => setHorasNocturnas(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Horas en feriado</label>
            <input type="number" min={0} max={16} value={horasFeriado} onChange={e => setHorasFeriado(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-600">
          Salario mensual: <span className="font-semibold text-gray-800">L. {Number(salario).toLocaleString('es-HN')}</span>
        </div>

        <button type="submit" className="w-full bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition">
          Calcular
        </button>
      </form>

      {resultado && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3 text-sm">
          <h3 className="font-bold text-gray-800">Resultado del cálculo</h3>
          <div className="space-y-1">
            <p className="text-gray-500">Valor por hora normal: <span className="font-medium text-gray-800">L. {resultado.salarioHora.toFixed(2)}</span></p>
            {horasDiurnas > 0 && <p>Horas diurnas extra ({horasDiurnas}h × +25%): <span className="font-medium text-green-700">L. {resultado.pagoDiurno.toFixed(2)}</span></p>}
            {horasNocturnas > 0 && <p>Horas nocturnas extra ({horasNocturnas}h × +50%): <span className="font-medium text-green-700">L. {resultado.pagoNocturno.toFixed(2)}</span></p>}
            {horasFeriado > 0 && <p>Horas en feriado ({horasFeriado}h × +100%): <span className="font-medium text-green-700">L. {resultado.pagoFeriado.toFixed(2)}</span></p>}
          </div>
          <div className="border-t pt-3">
            <p className="text-base font-bold text-primary-600">Total a pagar: L. {resultado.total.toFixed(2)}</p>
          </div>
          <button onClick={handleGuardar} disabled={guardado || loading}
            className="w-full bg-accent-500 text-white py-2 rounded-lg font-medium hover:bg-accent-600 transition disabled:opacity-50">
            {guardado ? '✅ Guardado' : loading ? 'Guardando...' : 'Guardar registro'}
          </button>
        </div>
      )}
    </div>
  )
}
