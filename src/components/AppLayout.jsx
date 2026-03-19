import { useState, useEffect } from 'react'
import { List } from '@phosphor-icons/react'
import Sidebar from './Sidebar'

const COLLAPSED_KEY = 'sidebar_collapsed'

function useSidebarWidth() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    const id = setInterval(() => {
      try {
        const val = localStorage.getItem(COLLAPSED_KEY) === 'true'
        setCollapsed(c => c !== val ? val : c)
      } catch { /* ignore */ }
    }, 100)
    return () => clearInterval(id)
  }, [])

  return collapsed ? 64 : 228
}

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarWidth = useSidebarWidth()

  return (
    <div className="min-h-screen" style={{ background: '#0B0F19' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center px-4 h-14 border-b border-[#1F2937]"
        style={{ background: '#0F172A' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
        >
          <List size={22} />
        </button>
        <span className="ml-3 text-[#F9FAFB] font-bold text-base">InterviewIQ</span>
      </div>

      {/* Main content */}
      <main
        className="pt-14 md:pt-0 min-h-screen transition-[margin] duration-200"
        style={{ '--sw': `${sidebarWidth}px` }}
      >
        {/*
          Using a CSS custom property + a style tag avoids Tailwind's
          dynamic class purging while still being responsive.
        */}
        <style>{`@media (min-width: 768px) { .app-main-inner { margin-left: var(--sw); } }`}</style>
        <div className="app-main-inner transition-[margin] duration-200">
          {children}
        </div>
      </main>
    </div>
  )
}
