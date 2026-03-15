import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PublicRoute from './components/PublicRoute'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'

// Lazy-load all pages — each page chunk downloads only when first visited
const Landing         = lazy(() => import('./pages/Landing'))
const Auth            = lazy(() => import('./pages/Auth'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const InterviewSetup  = lazy(() => import('./pages/InterviewSetup'))
const InterviewSession= lazy(() => import('./pages/InterviewSession'))
const Report          = lazy(() => import('./pages/Report'))
const Progress        = lazy(() => import('./pages/Progress'))
const Upgrade         = lazy(() => import('./pages/Upgrade'))
const Profile         = lazy(() => import('./pages/Profile'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))

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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
