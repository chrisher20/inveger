import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface Visitador {
  id: string
  nombre: string
  contacto: string
  laboratorio: string
  activo: boolean
}

interface Visita {
  id: string
  visitador_id: string
  visitador_nombre: string
  laboratorio: string
  fecha: string
  hora: string
  tipo_visita: string
  productos_ofrecidos: string
  novedades: string
}

const TIPOS_VISITA: { value: string; label: string }[] = [
  { value: 'programar_factura', label: '🧾 Programar Factura' },
  { value: 'visita_cortesia', label: '🤝 Visita de Cortesía' },
  { value: 'oferta_productos', label: '💊 Oferta de Productos' },
  { value: 'entrega_presente', label: '🎁 Entrega de Presente' },
  { value: 'recordatorio_factura', label: '⚠️ Recordatorio Factura Vencida' },
  { value: 'entrega_bonos', label: '💰 Entrega de Bonos en Productos' },
  { value: 'otro', label: '📋 Otro' },
]

const COLORES = ['#1a6abf', '#17a589', '#f39c12', '#e74c3c', '#8e44ad', '#2ecc71', '#95a5a6']

const emptyVisita = {
  visitador_id: '', fecha: format(new Date(), 'yyyy-MM-dd'),
  tipo_visita: 'visita_cortesia', productos_ofrecidos: '', novedades: '',
}

const emptyVisitador = { nombre: '', contacto: '', laboratorio: '' }

export default function VisitasMedicas() {
  const { user } = useAuth()
  const [vista, setVista] = useState<'hoy' | 'nueva' | 'visitadores' | 'reportes' | 'filtrar'>('hoy')
  const [visitadores, setVisitadores] = useState<Visitador[]>([])
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [formVisita, setFormVisita] = useState({ ...emptyVisita })
  const [formVisitador, setFormVisitador] = useState({ ...emptyVisitador })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroLab, setFiltroLab] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroNombre, setFiltroNombre] = useState('')

  const fetchData = async () => {
    const { data: vs } = await supabase.from('visitadores').select('*').order('nombre')
    const { data: vi } = await supabase.from('visitas').select('*').order('fecha', { ascending: false })
    if (vs) setVisitadores(vs as Visitador[])
    if (vi) setVisitas(vi as Visita[])
  }

  useEffect(() => { fetchData() }, [])

  const visitasHoy = visitas.filter(v => v.fecha === format(new Date(), 'yyyy-MM-dd'))

  const handleCrearVisitador = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('visitadores').insert([formVisitador])
    setFormVisitador({ ...emptyVisitador })
    setMsg('✅ Visitador agregado')
    fetchData()
    setLoading(false)
  }

  const handleCrearVisita = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const visitador = visitadores.find(v => v.id === formVisita.visitador_id)
    if (!visitador) { setMsg('Selecciona un visitador'); setLoading(false); return }

    await supabase.from('visitas').insert([{
      ...formVisita,
      visitador_nombre: visitador.nombre,
      laboratorio: visitador.laboratorio,
      hora: new Date().toISOString(),
      created_by: user?.id,
    }])
    setMsg('✅ Visita registrada')
    setFormVisita({ ...emptyVisita })
    fetchData()
    setLoading(false)
  }

  // Datos para gráficos
  const visitasPorLab = Object.entries(
    visitas.reduce((acc, v) => { acc[v.laboratorio] = (acc[v.laboratorio] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  const visitasPorTipo = Object.entries(
    visitas.reduce((acc, v) => { acc[v.tipo_visita] = (acc[v.tipo_visita] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: TIPOS_VISITA.find(t => t.value === name)?.label.replace(/^[^\s]+\s/, '') ?? name,
    value
  }))

  // Filtrado
  const visitasFiltradas = visitas.filter(v => {
    if (filtroFecha && v.fecha !== filtroFecha) return false
    if (filtroLab && !v.laboratorio.toLowerCase().includes(filtroLab.toLowerCase())) return false
    if (filtroTipo && v.tipo_visita !== filtroTipo) return false
    if (filtroNombre && !v.visitador_nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false
    return true
  })

  const tabs = [
    { key: 'hoy', label: `📅 Hoy (${visitasHoy.length})` },
    { key: 'nueva', label: '+ Nueva Visita' },
    { key: 'visitadores', label: '👤 Visitadores' },
    { key: 'reportes', label: '📊 Reportes' },
    { key: 'filtrar', label: '🔍 Filtrar' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-600 mb-4">🏥 Visitas Médicas</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setVista(t.key as typeof vista); setMsg('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === t.key ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="mb-3 text-sm text-green-600 font-medium">{msg}</p>}

      {/* HOY */}
      {vista === 'hoy' && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Visitas de hoy — {format(new Date(), 'dd/MM/yyyy')}</h3>
          {visitasHoy.length === 0 && <p className="text-gray-400">No hay visitas registradas hoy.</p>}
          <div className="space-y-3">
            {visitasHoy.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-800">{v.visitador_nombre}</p>
                  <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                    {TIPOS_VISITA.find(t => t.value === v.tipo_visita)?.label}
                  </span>
                </div>
                <p className="text-gray-500">🏭 {v.laboratorio}</p>
                {v.productos_ofrecidos && <p className="text-gray-600">💊 {v.productos_ofrecidos}</p>}
                {v.novedades && <p className="text-gray-600">📝 {v.novedades}</p>}
                <p className="text-gray-400 text-xs mt-1">{format(new Date(v.hora), 'HH:mm')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NUEVA VISITA */}
      {vista === 'nueva' && (
        <div className="max-w-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Registrar visita</h3>
          <form onSubmit={handleCrearVisita} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Visitador</label>
              <select value={formVisita.visitador_id}
                onChange={e => setFormVisita(f => ({ ...f, visitador_id: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Selecciona un visitador...</option>
                {visitadores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre} — {v.laboratorio}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" value={formVisita.fecha}
                onChange={e => setFormVisita(f => ({ ...f, fecha: e.target.value }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de visita</label>
              <select value={formVisita.tipo_visita}
                onChange={e => setFormVisita(f => ({ ...f, tipo_visita: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
                {TIPOS_VISITA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Productos ofrecidos</label>
              <input type="text" value={formVisita.productos_ofrecidos}
                onChange={e => setFormVisita(f => ({ ...f, productos_ofrecidos: e.target.value }))}
                placeholder="Ej: Amoxicilina 500mg, Ibuprofeno..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Novedades / Observaciones</label>
              <textarea value={formVisita.novedades}
                onChange={e => setFormVisita(f => ({ ...f, novedades: e.target.value }))}
                rows={3} placeholder="Detalles adicionales de la visita..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-60">
              {loading ? 'Guardando...' : 'Registrar Visita'}
            </button>
          </form>
        </div>
      )}

      {/* VISITADORES */}
      {vista === 'visitadores' && (
        <div>
          <div className="max-w-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Agregar visitador</h3>
            <form onSubmit={handleCrearVisitador} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {([['nombre','Nombre completo'],['contacto','Teléfono / Correo'],['laboratorio','Laboratorio']] as [string,string][]).map(([name,label]) => (
                <div key={name}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input type="text" value={(formVisitador as Record<string,string>)[name]}
                    onChange={e => setFormVisitador(f => ({ ...f, [name]: e.target.value }))}
                    required className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="w-full bg-accent-500 text-white py-2 rounded-lg font-medium hover:bg-accent-600 transition disabled:opacity-60">
                {loading ? 'Guardando...' : '+ Agregar Visitador'}
              </button>
            </form>
          </div>

          <h3 className="font-semibold text-gray-700 mb-3">Visitadores registrados ({visitadores.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visitadores.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm">
                <p className="font-semibold text-gray-800">{v.nombre}</p>
                <p className="text-primary-600">🏭 {v.laboratorio}</p>
                <p className="text-gray-500">📞 {v.contacto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTES */}
      {vista === 'reportes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Total visitas', visitas.length, 'bg-primary-50 text-primary-700'],
              ['Visitas hoy', visitasHoy.length, 'bg-green-50 text-green-700'],
              ['Laboratorios', new Set(visitas.map(v => v.laboratorio)).size, 'bg-yellow-50 text-yellow-700'],
              ['Visitadores', visitadores.length, 'bg-purple-50 text-purple-700'],
            ].map(([label, val, cls]) => (
              <div key={String(label)} className={`rounded-xl p-4 ${cls}`}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-sm opacity-80">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Visitas por laboratorio</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitasPorLab}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1a6abf" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Distribución por tipo de visita</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={visitasPorTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {visitasPorTipo.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* FILTRAR */}
      {vista === 'filtrar' && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Por fecha</label>
              <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Por laboratorio</label>
              <input type="text" value={filtroLab} onChange={e => setFiltroLab(e.target.value)}
                placeholder="Nombre del laboratorio..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Por tipo de visita</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Todos</option>
                {TIPOS_VISITA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Por visitador</label>
              <input type="text" value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)}
                placeholder="Nombre del visitador..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">{visitasFiltradas.length} resultado(s)</p>
          <div className="space-y-3">
            {visitasFiltradas.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-800">{v.visitador_nombre}</p>
                  <span className="bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                    {TIPOS_VISITA.find(t => t.value === v.tipo_visita)?.label}
                  </span>
                </div>
                <p className="text-gray-500">🏭 {v.laboratorio} · 📅 {v.fecha}</p>
                {v.productos_ofrecidos && <p className="text-gray-600">💊 {v.productos_ofrecidos}</p>}
                {v.novedades && <p className="text-gray-600">📝 {v.novedades}</p>}
              </div>
            ))}
            {visitasFiltradas.length === 0 && <p className="text-gray-400">No hay resultados.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
