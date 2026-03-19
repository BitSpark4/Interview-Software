import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { AuthProvider } from './contexts/AuthContext'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import { useSessionValidator } from './hooks/useSessionValidator'

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

// Resets ErrorBoundary on every route change so a crash on one page
// doesn't permanently block navigation to other pages.
function RouteErrorBoundary({ children }) {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      {children}
    </ErrorBoundary>
  )
}

// Runs inside BrowserRouter + AuthProvider — needs both for navigate + user
function SessionGuard() {
  const { expired, handleLoginAgain } = useSessionValidator()
  if (!expired) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#111827', border: '1px solid #374151', borderRadius: 20,
        padding: 40, width: '100%', maxWidth: 400, textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', margin: '0 0 12px 0' }}>
          Session Expired
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 28px 0' }}>
          Your account was logged in on another device.
          For your security, you have been logged out here.
        </p>
        <button
          onClick={handleLoginAgain}
          style={{
            width: '100%', height: 48, background: '#2563EB', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}
        >
          Login Again
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <IconContext.Provider value={{ weight: 'duotone' }}>
        <BrowserRouter>
          <AuthProvider>
            <SessionGuard />
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"    element={<PublicRoute><Landing /></PublicRoute>} />
                  <Route path="/auth"           element={<PublicRoute><Auth /></PublicRoute>} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/interview/setup"   element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
                  <Route path="/interview/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
                  <Route path="/report/:id"        element={<ProtectedRoute><Report /></ProtectedRoute>} />
                  <Route path="/progress"          element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                  <Route path="/upgrade"           element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
                  <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </IconContext.Provider>
    </ErrorBoundary>
  )
}
