export type UserRole = 'admin' | 'consultor'

export type TipoUsuario =
  | 'asistente_gerencia'
  | 'medico_general'
  | 'especialista'
  | 'enfermera'
  | 'microbiologia'
  | 'regente'
  | 'auxiliar_farmacia'
  | 'tecnico'
  | 'mantenimiento'
  | 'vigilancia'
  | 'aseo'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  nombre: string
  identidad: string
  fecha_nacimiento: string
  fecha_ingreso: string
  salario: number
  tipo_usuario: TipoUsuario
  subtipo_tecnico?: string
  created_at: string
}

export interface Medicamento {
  id: string
  nombre: string
  laboratorio: string
  cantidad_actual: number
  fecha_vencimiento: string
  ubicacion: string
  fecha_creacion: string
  created_by: string
}

export interface SolicitudVacaciones {
  id: string
  empleado_id: string
  empleado_nombre: string
  dias_solicitados: number
  fecha_inicio: string
  fecha_fin: string
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_negociacion'
  comentario_admin?: string
  fecha_solicitud: string
}

export interface HistorialVacaciones {
  id: string
  empleado_id: string
  tipo: 'acumulacion' | 'descuento'
  dias: number
  descripcion: string
  fecha: string
  saldo_resultante: number
}

export interface HoraExtra {
  id: string
  empleado_id: string
  fecha: string
  horas_diurnas: number
  horas_nocturnas: number
  horas_feriado: number
  salario_hora: number
  total_pagar: number
  created_at: string
}
