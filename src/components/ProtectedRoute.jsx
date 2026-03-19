import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Spinner size={24} color="border-blue-500" />
      </div>
    )
  }

  if (!user) {
    // Preserve the page the user was trying to reach
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  return children
}
