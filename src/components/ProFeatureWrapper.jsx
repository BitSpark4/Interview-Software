import { useNavigate } from 'react-router-dom'

export default function ProFeatureWrapper({
  children,
  userProfile,
  featureName,
  description,
  compact = false,
}) {
  const navigate = useNavigate()
  const isPro = userProfile?.plan === 'pro'

  if (isPro) return children

  return (
    <div style={{ position: 'relative' }}>

      {/* Blurred preview of content */}
      <div style={{
        filter: 'blur(3px)',
        opacity: 0.4,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11,15,25,0.75)',
        borderRadius: 12,
        padding: 16,
        textAlign: 'center',
      }}>

        {/* Lock icon */}
        <div style={{
          width:  compact ? 32 : 44,
          height: compact ? 32 : 44,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          fontSize: compact ? 14 : 18,
        }}>
          🔒
        </div>

        {/* Feature name */}
        {!compact && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', margin: '0 0 4px' }}>
            {featureName}
          </p>
        )}

        {/* Description */}
        {!compact && description && (
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px', lineHeight: 1.5 }}>
            {description}
          </p>
        )}

        {/* Upgrade button */}
        <button
          onClick={() => navigate('/upgrade')}
          style={{
            background: '#F59E0B',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: compact ? '5px 14px' : '8px 20px',
            fontSize: compact ? 11 : 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#D97706'}
          onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}
        >
          {compact ? 'Pro Only' : 'Unlock with Pro — ₹199/mo'}
        </button>
      </div>
    </div>
  )
}
