/**
 * ReferralRedirect — captures referral code from URL and redirects to signup.
 * Route: /ref/:referralCode
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReferralRedirect() {
  const { referralCode } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (referralCode?.trim()) {
      localStorage.setItem('interviewiq_referral_code', referralCode.trim().toUpperCase())
    }
    navigate('/auth', { replace: true })
  }, [referralCode, navigate])

  return null
}
