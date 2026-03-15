export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function firstOfNextMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
}

export function updateStreak(lastSessionDate, currentStreak) {
  if (!lastSessionDate) return 1
  const last = new Date(lastSessionDate)
  const today = new Date()
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return currentStreak
  if (diffDays === 1) return currentStreak + 1
  return 1
}
