import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#0B0F19' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile top bar — hamburger only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center px-4 h-14 border-b border-[#1F2937]"
        style={{ background: '#0F172A' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 text-[#F9FAFB] font-bold text-base">InterviewIQ</span>
      </div>

      {/* Main content — offset by sidebar on desktop, full-width on mobile */}
      <main className="md:ml-[228px] pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
