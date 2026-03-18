import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'

// Core pages — static imports to avoid Vite re-optimization on lazy load
import Dashboard        from './pages/Dashboard'
import InterviewSetup   from './pages/InterviewSetup'
import InterviewSession from './pages/InterviewSession'

// Lazy-load secondary pages
const Landing       = lazy(() => import('./pages/Landing'))
const Auth          = lazy(() => import('./pages/Auth'))
const Report        = lazy(() => import('./pages/Report'))
const Progress      = lazy(() => import('./pages/Progress'))
const Upgrade       = lazy(() => import('./pages/Upgrade'))
const Profile       = lazy(() => import('./pages/Profile'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Admin         = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"    element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/auth"           element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/dashboard"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/interview/setup"     element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
              <Route path="/interview/session"   element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
              <Route path="/report/:id"          element={<ProtectedRoute><Report /></ProtectedRoute>} />
              <Route path="/progress"            element={<ProtectedRoute><Progress /></ProtectedRoute>} />
              <Route path="/upgrade"             element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
              <Route path="/profile"            element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
