import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PageLoader from './PageLoader'

export default function AdminRoute({ children }) {
  const { user, userProfile, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/auth" replace />
  if (!userProfile) return <PageLoader />
  if (!userProfile.is_admin) return <Navigate to="/dashboard" replace />

  return children
}
