import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  onMenuSelect: (opcion: string) => void
  menuActivo: string
}

const menuItems = [
  { key: 'usuario', label: '👤 Mi Perfil' },
  { key: 'vacaciones', label: '🏖️ Vacaciones' },
  { key: 'incentivos', label: '💰 Incentivos' },
  { key: 'horas_extra', label: '⏰ Horas Extra' },
]

export default function Navbar({ onMenuSelect, menuActivo }: NavbarProps) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="bg-primary-600 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Izquierda: logo + menú */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-widest shrink-0">INVEGER</span>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1 bg-primary-700 hover:bg-primary-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              ☰ Menú
              <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { onMenuSelect(item.key); setOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 transition ${menuActivo === item.key ? 'bg-primary-100 font-semibold text-primary-600' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Derecha: nombre + cerrar sesión */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm opacity-80 truncate max-w-[120px] hidden sm:block">{user?.nombre}</span>
          <button
            onClick={signOut}
            className="bg-white text-primary-600 hover:bg-gray-100 text-xs font-medium px-3 py-1.5 rounded-lg transition shrink-0"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
