const PARTS = [
  { key: 'situation', label: 'S — Situation' },
  { key: 'task',      label: 'T — Task' },
  { key: 'action',    label: 'A — Action' },
  { key: 'result',    label: 'R — Result' },
]

export default function StarBreakdown({ breakdown }) {
  if (!breakdown) return null

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {PARTS.map(({ key, label }) => {
        const status = breakdown[key]
        if (status === 'N/A') return null
        const isPresent = status === 'present'
        return (
          <div
            key={key}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs border ${
              isPresent
                ? 'text-green-400 border-green-500/30 bg-green-500/5'
                : status === 'partial'
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/5'
                  : 'text-red-400 border-red-500/30 bg-red-500/5'
            }`}
          >
            <span>{isPresent ? '✓' : status === 'partial' ? '~' : '✗'}</span>
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
