import { useState } from 'react'

export function useUsage(userProfile) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const isPro = userProfile?.plan === 'pro'
  const interviewsUsed = userProfile?.interviews_used ?? 0
  const interviewsLimit = isPro ? Infinity : 3
  const canStartInterview = isPro || interviewsUsed < 3
  const interviewsLeft = isPro ? 'Unlimited' : Math.max(0, 3 - interviewsUsed)

  const resetDate = (() => {
    const now = new Date()
    const firstNext = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return firstNext.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
  })()

  return {
    interviewsUsed,
    interviewsLimit,
    canStartInterview,
    interviewsLeft,
    resetDate,
    isPro,
    showUpgradeModal,
    setShowUpgradeModal,
  }
}
