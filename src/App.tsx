import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ConsultorPage from './pages/ConsultorPage'

function ProtectedRoute({ children, role }: { children: JSX.Element; role: 'admin' | 'consultor' }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-primary-500">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/consultor'} replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-primary-500">Cargando...</div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/consultor'} replace />} />
      <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
      <Route path="/consultor" element={<ProtectedRoute role="consultor"><ConsultorPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
