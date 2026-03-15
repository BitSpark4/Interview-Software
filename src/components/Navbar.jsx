import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { userProfile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isPro  = userProfile?.plan === 'pro'
  const name   = userProfile?.name?.split(' ')[0] || 'Menu'
  const streak = userProfile?.streak_count

  return (
    <nav className={`flex items-center justify-between px-4 py-4 border-b relative ${
      isPro ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-gray-800'
    }`}>
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <span className="text-emerald-400 font-mono font-bold tracking-tight">InterviewIQ</span>
        {isPro && (
          <span className="text-[10px] font-mono font-bold bg-emerald-500 text-black px-1.5 py-0.5 rounded-full leading-none">
            PRO
          </span>
        )}
      </Link>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <span className="text-xs text-gray-400 hidden sm:block">🔥 {streak} day streak</span>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isPro ? 'text-emerald-300 hover:text-emerald-200' : 'text-gray-300 hover:text-white'
          }`}
        >
          {isPro && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          )}
          {name} ▾
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10 w-52 py-1 overflow-hidden">

          {/* Pro member header inside dropdown */}
          {isPro && (
            <div className="px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-500 text-black px-1.5 py-0.5 rounded-full">PRO</span>
              <span className="text-emerald-400 text-xs font-medium">Pro Member · Unlimited</span>
            </div>
          )}

          <Link
            to="/progress"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            My Progress
          </Link>

          {isPro ? (
            <Link
              to="/upgrade"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-500 hover:text-gray-400 hover:bg-gray-800 transition-colors"
            >
              Manage Subscription
            </Link>
          ) : (
            <Link
              to="/upgrade"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-gray-800 transition-colors"
            >
              ✦ Upgrade to Pro
            </Link>
          )}

          <button
            type="button"
            onClick={() => { setMenuOpen(false); signOut() }}
            className="block w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
