import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Medicamento } from '../../types'
import { format } from 'date-fns'

const emptyForm: Omit<Medicamento, 'id' | 'created_by'> = {
  nombre: '',
  laboratorio: '',
  cantidad_actual: 0,
  fecha_vencimiento: '',
  ubicacion: '',
  fecha_creacion: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
}

export default function InventarioAdmin() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [preview, setPreview] = useState<typeof emptyForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchMedicamentos = async () => {
    const { data } = await supabase.from('medicamentos').select('*').order('nombre')
    if (data) setMedicamentos(data as Medicamento[])
  }

  useEffect(() => { fetchMedicamentos() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'cantidad_actual' ? Number(value) : value }))
  }

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()
    setPreview({ ...form })
  }

  const handleGuardar = async () => {
    setLoading(true)
    if (editId) {
      await supabase.from('medicamentos').update(preview!).eq('id', editId)
    } else {
      await supabase.from('medicamentos').insert([{ ...preview, fecha_creacion: new Date().toISOString() }])
    }
    await fetchMedicamentos()
    setPreview(null)
    setForm({ ...emptyForm })
    setShowForm(false)
    setEditId(null)
    setLoading(false)
  }

  const handleEditar = (med: Medicamento) => {
    setForm({
      nombre: med.nombre,
      laboratorio: med.laboratorio,
      cantidad_actual: med.cantidad_actual,
      fecha_vencimiento: med.fecha_vencimiento,
      ubicacion: med.ubicacion,
      fecha_creacion: med.fecha_creacion,
    })
    setEditId(med.id)
    setPreview(null)
    setShowForm(true)
  }

  const filtrados = medicamentos.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary-600">📦 Inventario de Medicamentos</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm }); setPreview(null) }}
          className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          + Agregar Producto
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full mb-4 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {/* Lista */}
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
                <button
                  onClick={() => handleEditar(med)}
                  className="mt-2 text-primary-500 hover:underline text-sm"
                >
                  ✏️ Editar
                </button>
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && <p className="text-gray-400 text-center py-8">No se encontraron productos.</p>}
      </div>

      {/* Modal Formulario */}
      {showForm && !preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-primary-600 mb-4">{editId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handlePreview} className="space-y-3">
              {([
                ['nombre', 'Nombre del producto', 'text'],
                ['laboratorio', 'Laboratorio', 'text'],
                ['cantidad_actual', 'Cantidad actual', 'number'],
                ['fecha_vencimiento', 'Fecha de vencimiento', 'date'],
                ['ubicacion', 'Ubicación en bodega', 'text'],
              ] as [string, string, string][]).map(([name, label, type]) => (
                <div key={name}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    name={name}
                    type={type}
                    value={(form as Record<string, string | number>)[name] as string}
                    onChange={handleChange}
                    required
                    min={type === 'number' ? 0 : undefined}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de creación</label>
                <input
                  type="datetime-local"
                  value={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 bg-gray-100 text-gray-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-green-600 mb-4">✅ Resumen del producto</h3>
            <div className="space-y-2 text-sm bg-gray-50 rounded-xl p-4 mb-4">
              <p><span className="font-medium">Nombre:</span> {preview.nombre}</p>
              <p><span className="font-medium">Laboratorio:</span> {preview.laboratorio}</p>
              <p><span className="font-medium">Cantidad:</span> {preview.cantidad_actual}</p>
              <p><span className="font-medium">Vencimiento:</span> {preview.fecha_vencimiento}</p>
              <p><span className="font-medium">Ubicación:</span> {preview.ubicacion}</p>
              <p><span className="font-medium">Fecha de creación:</span> {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPreview(null)} className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg font-medium hover:bg-yellow-200 transition">
                ✏️ Modificar
              </button>
              <button onClick={handleGuardar} disabled={loading} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-60">
                {loading ? 'Guardando...' : '✔ Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
