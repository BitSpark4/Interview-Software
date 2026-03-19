import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { userProfile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isPro   = userProfile?.plan === 'pro'
  const name    = userProfile?.name || 'User'
  const initial = name.charAt(0).toUpperCase()
  const streak  = userProfile?.streak_count

  return (
    <nav className={`flex items-center justify-between px-4 py-4 border-b relative ${
      isPro ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-gray-800'
    }`}>
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <span className="text-blue-400 font-mono font-bold tracking-tight">InterviewIQ</span>
        {isPro && (
          <span className="text-[10px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded-full leading-none">
            PRO
          </span>
        )}
      </Link>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <span className="text-xs text-gray-400 hidden sm:block">🔥 {streak} day streak</span>
        )}

        {/* Avatar circle button */}
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            isPro
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {initial}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10 w-52 py-1 overflow-hidden">

          {/* User info header */}
          <div className={`px-4 py-3 border-b ${isPro ? 'border-amber-500/20 bg-amber-500/5' : 'border-gray-800'}`}>
            <p className="text-white text-sm font-medium truncate">{name}</p>
            {isPro && <p className="text-amber-400 text-xs mt-0.5">Pro · Unlimited interviews</p>}
          </div>

          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            👤 My Profile
          </Link>

          <Link
            to="/progress"
            onClick={() => setMenuOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            📊 My Progress
          </Link>

          {!isPro && (
            <Link
              to="/upgrade"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-gray-800 transition-colors"
            >
              ✦ Upgrade to Pro
            </Link>
          )}

          <div className="border-t border-gray-800 mt-1" />

          <button
            type="button"
            onClick={() => { setMenuOpen(false); signOut() }}
            className="block w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
