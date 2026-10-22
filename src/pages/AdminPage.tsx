import { useState } from 'react'
import Navbar from '../components/Navbar'
import InventarioAdmin from '../components/admin/InventarioAdmin'
import PerfilUsuario from '../components/shared/PerfilUsuario'
import VacacionesEmpleado from '../components/shared/VacacionesEmpleado'
import Incentivos from '../components/shared/Incentivos'
import HorasExtra from '../components/shared/HorasExtra'
import BandejaVacaciones from '../components/admin/BandejaVacaciones'
import GestionUsuarios from '../components/admin/GestionUsuarios'
import VisitasMedicas from '../components/admin/VisitasMedicas'

export default function AdminPage() {
  const [vista, setVista] = useState('inventario')

  const handleMenuSelect = (opcion: string) => setVista(opcion)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuSelect={handleMenuSelect} menuActivo={vista} />

      {/* Botones de acción rápida */}
      <div className="px-6 py-3 bg-white border-b flex gap-3 flex-wrap">
        <button
          onClick={() => setVista('inventario')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'inventario' ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📦 Inventario
        </button>
        <button
          onClick={() => setVista('bandeja')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'bandeja' ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📬 Bandeja Solicitudes
        </button>
        <button
          onClick={() => setVista('visitas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'visitas' ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🏥 Visitas Médicas
        </button>
        <button
          onClick={() => setVista('gestion_usuarios')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'gestion_usuarios' ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          👥 Gestión de Empleados
        </button>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {vista === 'inventario' && <InventarioAdmin />}
        {vista === 'usuario' && <PerfilUsuario />}
        {vista === 'vacaciones' && <VacacionesEmpleado />}
        {vista === 'incentivos' && <Incentivos />}
        {vista === 'horas_extra' && <HorasExtra />}
        {vista === 'bandeja' && <BandejaVacaciones />}
        {vista === 'visitas' && <VisitasMedicas />}
        {vista === 'gestion_usuarios' && <GestionUsuarios />}
      </main>
    </div>
  )
}
