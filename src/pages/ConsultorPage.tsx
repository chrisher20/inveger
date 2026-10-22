import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Medicamento } from '../types'
import Navbar from '../components/Navbar'
import PerfilUsuario from '../components/shared/PerfilUsuario'
import VacacionesEmpleado from '../components/shared/VacacionesEmpleado'
import Incentivos from '../components/shared/Incentivos'
import HorasExtra from '../components/shared/HorasExtra'
import { format } from 'date-fns'

export default function ConsultorPage() {
  const [vista, setVista] = useState('inventario')
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('medicamentos').select('*').order('nombre').then(({ data }) => {
      if (data) setMedicamentos(data as Medicamento[])
    })
  }, [])

  const filtrados = medicamentos.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleDescargarCSV = () => {
    const headers = ['Nombre', 'Laboratorio', 'Cantidad Actual', 'Fecha Vencimiento', 'Ubicacion', 'Fecha Creacion']
    const rows = medicamentos.map(m => [
      m.nombre, m.laboratorio, m.cantidad_actual,
      m.fecha_vencimiento, m.ubicacion,
      format(new Date(m.fecha_creacion), 'dd/MM/yyyy HH:mm'),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_inveger_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuSelect={setVista} menuActivo={vista} />

      <main className="p-6 max-w-4xl mx-auto">
        {vista === 'inventario' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary-600">📦 Inventario de Medicamentos</h2>
              <button
                onClick={handleDescargarCSV}
                className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                ⬇ Descargar CSV
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <div className="space-y-2">
              {filtrados.map(med => (
                <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(expandedId === med.id ? null : med.id)}
                  >
                    <span className="font-medium text-gray-800">{med.nombre}</span>
                    <span className="text-gray-400 text-sm">{expandedId === med.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedId === med.id && (
                    <div className="px-5 pb-4 pt-1 bg-gray-50 border-t border-gray-100 text-sm space-y-1">
                      <p><span className="font-medium">Laboratorio:</span> {med.laboratorio}</p>
                      <p><span className="font-medium">Cantidad actual:</span> {med.cantidad_actual}</p>
                      <p><span className="font-medium">Fecha de vencimiento:</span> {med.fecha_vencimiento}</p>
                      <p><span className="font-medium">Ubicación:</span> {med.ubicacion}</p>
                      <p><span className="font-medium">Fecha de creación:</span> {format(new Date(med.fecha_creacion), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  )}
                </div>
              ))}
              {filtrados.length === 0 && (
                <p className="text-gray-400 text-center py-8">No se encontraron productos.</p>
              )}
            </div>
          </div>
        )}

        {vista === 'usuario' && <PerfilUsuario />}
        {vista === 'vacaciones' && <VacacionesEmpleado />}
        {vista === 'incentivos' && <Incentivos />}
        {vista === 'horas_extra' && <HorasExtra />}
      </main>
    </div>
  )
}
