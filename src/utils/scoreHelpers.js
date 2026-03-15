export function scoreColor(score) {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 5) return 'text-amber-400'
  return 'text-red-400'
}

export function scoreBorderColor(score) {
  if (score >= 8) return 'border-emerald-500/30'
  if (score >= 5) return 'border-amber-500/30'
  return 'border-red-500/30'
}

export function verdict(score) {
  if (score >= 8) return 'Ready'
  if (score >= 6) return 'Almost Ready'
  return 'Needs Work'
}

export function verdictColor(v) {
  if (v === 'Ready') return 'bg-emerald-500/20 text-emerald-400'
  if (v === 'Almost Ready') return 'bg-amber-500/20 text-amber-400'
  return 'bg-red-500/20 text-red-400'
}
