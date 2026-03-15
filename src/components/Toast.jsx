import { useState, useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

export default function Toast({ message, subText, onClose, duration = 5000 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger slide-in on mount
    const t1 = setTimeout(() => setVisible(true), 10)
    const t2 = setTimeout(() => handleClose(), duration)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        minWidth: 300,
        background: '#111827',
        border: '1px solid rgba(34,197,94,0.3)',
        borderLeft: '4px solid #22C55E',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: 10, right: 12,
          color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2.5" style={{ marginBottom: subText ? 4 : 0 }}>
        <CheckCircle size={18} color="#22C55E" />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>{message}</p>
      </div>

      {subText && (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0 28px' }}>{subText}</p>
      )}
    </div>
  )
}
