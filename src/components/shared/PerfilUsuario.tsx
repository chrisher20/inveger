import { useAuth } from '../../context/AuthContext'

const TIPOS: Record<string, string> = {
  asistente_gerencia: 'Asistente de Gerencia',
  medico_general: 'Médico General',
  especialista: 'Especialista',
  enfermera: 'Enfermera',
  microbiologia: 'Microbiología',
  regente: 'Regente',
  auxiliar_farmacia: 'Auxiliar de Farmacia',
  tecnico: 'Técnico',
  mantenimiento: 'Mantenimiento',
  vigilancia: 'Vigilancia',
  aseo: 'Aseo',
}

export default function PerfilUsuario() {
  const { user } = useAuth()
  if (!user) return null

  const campos = [
    ['Nombre completo', user.nombre],
    ['Correo', user.email],
    ['Número de identidad', user.identidad],
    ['Fecha de nacimiento', user.fecha_nacimiento],
    ['Fecha de ingreso', user.fecha_ingreso],
    ['Salario mensual', `L. ${Number(user.salario).toLocaleString('es-HN')}`],
    ['Tipo de usuario', TIPOS[user.tipo_usuario] ?? user.tipo_usuario],
    ...(user.tipo_usuario === 'tecnico' && user.subtipo_tecnico ? [['Especialidad técnica', user.subtipo_tecnico]] : []),
    ['Rol en sistema', user.role === 'admin' ? 'Administrador' : 'Consultor'],
  ]

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-primary-600 mb-4">👤 Mi Perfil</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {campos.map(([label, valor]) => (
          <div key={label} className="flex justify-between px-5 py-3 text-sm">
            <span className="font-medium text-gray-500">{label}</span>
            <span className="text-gray-800">{valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
