import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, TrendingUp, Play, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Home' },
  { to: '/profile',         icon: User,            label: 'Profile' },
  { to: '/interview/setup', icon: Play,            label: 'Practice' },
  { to: '/progress',        icon: TrendingUp,      label: 'Progress' },
]

export default function BottomNav() {
  const { userProfile } = useAuth()
  const isPro = userProfile?.plan === 'pro'

  const items = isPro
    ? NAV
    : [...NAV, { to: '/upgrade', icon: Zap, label: 'Upgrade' }]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-20 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={to === '/upgrade' && !isActive ? 'text-emerald-400' : ''} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
