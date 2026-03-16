import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutGrid, Play, BarChart2,
  User, LogOut, X, Shield,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const MAIN_NAV = [
  { to: '/dashboard',       icon: LayoutGrid, label: 'Dashboard',          match: p => p.startsWith('/dashboard') },
  { to: '/interview/setup', icon: Play,        label: 'Practice Interview', match: p => p.startsWith('/interview') },
  { to: '/progress',        icon: BarChart2,   label: 'Progress Analytics', match: p => p.startsWith('/progress') },
]

const ACCOUNT_NAV = [
  { to: '/profile', icon: User, label: 'Profile', match: p => p === '/profile' },
]

function NavItem({ to, icon: Icon, label, onClick, isActive, adminStyle, collapsed }) {
  const activeColor = adminStyle ? '#F59E0B' : '#22C55E'
  const activeBg    = adminStyle ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'

  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center cursor-pointer transition-all duration-150 ${
        isActive ? 'font-semibold' : 'text-[#9CA3AF] font-medium hover:text-[#F9FAFB]'
      } ${collapsed ? 'justify-center' : 'gap-[10px]'}`}
      style={{
        height: 40,
        paddingLeft:  collapsed ? 0 : (isActive ? 13 : 12),
        paddingRight: collapsed ? 0 : 12,
        marginLeft:   collapsed ? 8 : (isActive ? 0 : 8),
        marginRight:  8,
        borderRadius: collapsed
          ? 8
          : isActive ? '0 8px 8px 0' : 8,
        background: isActive ? activeBg : 'transparent',
        borderLeft: (!collapsed && isActive) ? `3px solid ${activeColor}` : '3px solid transparent',
        fontSize: 14,
        color: isActive ? activeColor : undefined,
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <Icon size={16} color={isActive ? activeColor : '#6B7280'} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) {
    return <div style={{ height: 1, margin: '12px 12px 8px 12px', background: '#1F2937' }} />
  }
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
      color: '#6B7280', padding: '16px 16px 8px 16px', letterSpacing: '0.05em',
    }}>
      {label}
    </p>
  )
}

const COLLAPSED_KEY = 'sidebar_collapsed'

export default function Sidebar({ mobileOpen, onClose }) {
  const { userProfile, signOut } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed) } catch { /* ignore */ }
  }, [collapsed])

  const isPro    = userProfile?.plan === 'pro'
  const name     = userProfile?.name || 'User'
  const initial  = name.charAt(0).toUpperCase()

  const width = collapsed ? 64 : 228

  const content = (isMobile = false) => (
    <div
      className="flex flex-col h-full transition-all duration-200"
      style={{ background: '#0F172A', width: '100%' }}
    >
      {/* Logo area */}
      <div
        className="flex items-center shrink-0"
        style={{
          padding: collapsed && !isMobile ? '20px 0 16px 0' : '20px 16px 16px 16px',
          borderBottom: '1px solid #1F2937',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        }}
      >
        {collapsed && !isMobile ? (
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 32, height: 32, background: '#22C55E', borderRadius: 8 }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: '#000' }}>IQ</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32, background: '#22C55E', borderRadius: 8 }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: '#000' }}>IQ</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>InterviewIQ</span>
              {isPro && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#22C55E',
                  background: '#1E3A2F', border: '1px solid #22C55E',
                  padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                }}>
                  PRO
                </span>
              )}
            </div>
            {isMobile && onClose && (
              <button onClick={onClose} className="md:hidden shrink-0" style={{ color: '#6B7280' }}>
                <X size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        <SectionLabel label="MAIN" collapsed={collapsed && !isMobile} />
        <div className="space-y-0.5">
          {MAIN_NAV.map((item, i) => (
            <NavItem
              key={`main-${i}`}
              {...item}
              onClick={isMobile ? onClose : undefined}
              isActive={item.match(pathname)}
              collapsed={collapsed && !isMobile}
            />
          ))}
        </div>

        <SectionLabel label="ACCOUNT" collapsed={collapsed && !isMobile} />
        <div className="space-y-0.5">
          {ACCOUNT_NAV.map((item, i) => (
            <NavItem
              key={`acc-${i}`}
              {...item}
              onClick={isMobile ? onClose : undefined}
              isActive={item.match(pathname)}
              collapsed={collapsed && !isMobile}
            />
          ))}
        </div>

        {userProfile?.is_admin && (
          <>
            <SectionLabel label="ADMIN" collapsed={collapsed && !isMobile} />
            <NavItem
              to="/admin" icon={Shield} label="Admin"
              onClick={isMobile ? onClose : undefined}
              isActive={pathname === '/admin'}
              adminStyle
              collapsed={collapsed && !isMobile}
            />
          </>
        )}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div style={{ borderTop: '1px solid #1F2937', padding: '8px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 28, height: 28,
              color: '#4B5563',
              background: 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#9CA3AF' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4B5563' }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      )}

      {/* Bottom user area */}
      {!collapsed || isMobile ? (
        <div style={{ borderTop: '1px solid #1F2937', padding: '12px 16px' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { navigate('/profile'); if (isMobile) onClose?.() }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div
                className="flex items-center justify-center shrink-0 text-black font-bold"
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#22C55E', fontSize: 14, fontWeight: 700 }}
              >
                {initial}
              </div>
              <div className="text-left min-w-0">
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }} className="truncate">{name}</p>
                <p style={{ fontSize: 11, color: '#6B7280' }}>{isPro ? 'Pro Plan' : 'Free Plan'}</p>
              </div>
            </button>
          </div>
          <button
            onClick={() => { if (isMobile) onClose?.(); signOut() }}
            className="flex items-center gap-2 w-full transition-colors"
            style={{ padding: '8px 4px', fontSize: 13, color: '#6B7280', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      ) : (
        /* Collapsed bottom: just avatar + signout icon */
        <div style={{ borderTop: '1px solid #1F2937', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/profile')}
            title={name}
            className="flex items-center justify-center text-black font-bold"
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#22C55E', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {initial}
          </button>
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="flex items-center justify-center transition-colors"
            style={{ width: 32, height: 32, color: '#4B5563', cursor: 'pointer', borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:block fixed left-0 top-0 h-screen z-20 overflow-hidden transition-all duration-200"
        style={{ width, borderRight: '1px solid #1F2937' }}
      >
        {content(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />
          <aside
            className="md:hidden fixed left-0 top-0 h-screen z-40 overflow-hidden"
            style={{ width: 228, borderRight: '1px solid #1F2937' }}
          >
            {content(true)}
          </aside>
        </>
      )}
    </>
  )
}
