import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AppUser, TipoUsuario } from '../../types'

const TIPOS: { value: TipoUsuario; label: string }[] = [
  { value: 'asistente_gerencia', label: 'Asistente de Gerencia' },
  { value: 'medico_general', label: 'Médico General' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'enfermera', label: 'Enfermera' },
  { value: 'microbiologia', label: 'Microbiología' },
  { value: 'regente', label: 'Regente' },
  { value: 'auxiliar_farmacia', label: 'Auxiliar de Farmacia' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'vigilancia', label: 'Vigilancia' },
  { value: 'aseo', label: 'Aseo' },
]

const emptyForm = {
  email: '', password: '', nombre: '', identidad: '',
  fecha_nacimiento: '', fecha_ingreso: '', salario: '',
  tipo_usuario: 'enfermera' as TipoUsuario, subtipo_tecnico: '', role: 'consultor' as 'admin' | 'consultor',
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<AppUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('nombre')
    if (data) setUsuarios(data as AppUser[])
  }

  useEffect(() => { fetchUsuarios() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    // Registrar usuario con signUp (no requiere service_role)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setMsg('Error al crear usuario: ' + (authError?.message ?? 'desconocido'))
      setLoading(false)
      return
    }

    // Confirmar email automáticamente via SQL (ya tenemos RLS abierta)
    // Insertar en tabla usuarios
    const { error: dbError } = await supabase.from('usuarios').insert([{
      id: authData.user.id,
      email: form.email,
      nombre: form.nombre,
      identidad: form.identidad,
      fecha_nacimiento: form.fecha_nacimiento,
      fecha_ingreso: form.fecha_ingreso,
      salario: Number(form.salario),
      tipo_usuario: form.tipo_usuario,
      subtipo_tecnico: form.tipo_usuario === 'tecnico' ? form.subtipo_tecnico : null,
      role: form.role,
    }])

    if (dbError) {
      setMsg('Error al guardar datos: ' + dbError.message)
    } else {
      setMsg('✅ Usuario creado. Ve a Supabase → Authentication → Users y confirma el email manualmente si no puede ingresar.')
      setForm({ ...emptyForm })
      setShowForm(false)
      fetchUsuarios()
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary-600">👥 Gestión de Empleados</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          + Nuevo Empleado
        </button>
      </div>

      {msg && <p className="mb-3 text-sm text-green-600 font-medium">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usuarios.map(u => (
          <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm space-y-1">
            <p className="font-semibold text-gray-800 text-base">{u.nombre}</p>
            <p className="text-gray-500">{TIPOS.find(t => t.value === u.tipo_usuario)?.label}</p>
            <p><span className="font-medium">Identidad:</span> {u.identidad}</p>
            <p><span className="font-medium">Ingreso:</span> {u.fecha_ingreso}</p>
            <p><span className="font-medium">Salario:</span> L. {Number(u.salario).toLocaleString('es-HN')}</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
              {u.role === 'admin' ? 'Administrador' : 'Consultor'}
            </span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-8">
            <h3 className="text-lg font-bold text-primary-600 mb-4">Nuevo Empleado</h3>
            <form onSubmit={handleCrear} className="space-y-3">
              {([
                ['email', 'Correo electrónico', 'email'],
                ['password', 'Contraseña (mín. 8 caracteres)', 'password'],
                ['nombre', 'Nombre completo', 'text'],
                ['identidad', 'Número de identidad', 'text'],
                ['fecha_nacimiento', 'Fecha de nacimiento', 'date'],
                ['fecha_ingreso', 'Fecha de ingreso', 'date'],
                ['salario', 'Salario mensual (L.)', 'number'],
              ] as [string, string, string][]).map(([name, label, type]) => (
                <div key={name}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    name={name}
                    type={type}
                    value={(form as Record<string, string>)[name]}
                    onChange={handleChange}
                    required
                    minLength={name === 'password' ? 8 : undefined}
                    min={type === 'number' ? 0 : undefined}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de usuario</label>
                <select
                  name="tipo_usuario"
                  value={form.tipo_usuario}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {form.tipo_usuario === 'tecnico' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de técnico</label>
                  <input
                    name="subtipo_tecnico"
                    type="text"
                    value={form.subtipo_tecnico}
                    onChange={handleChange}
                    placeholder="Ej: Técnico en radiología"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Rol en el sistema</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="consultor">Consultor (solo ver)</option>
                  <option value="admin">Administrador (gestión completa)</option>
                </select>
              </div>

              {msg && <p className="text-red-500 text-sm">{msg}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-60">
                  {loading ? 'Creando...' : 'Crear Empleado'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setMsg('') }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
