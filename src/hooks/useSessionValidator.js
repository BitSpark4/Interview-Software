import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSessionValidator() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [expired, setExpired] = useState(false)

  const validate = useCallback(async () => {
    if (!user) return
    const localToken = localStorage.getItem('interviewiq-session-token')
    if (!localToken) return // logged in before this feature — skip

    try {
      const { data } = await supabase
        .from('users')
        .select('active_session_token')
        .eq('id', user.id)
        .single()

      if (data?.active_session_token && data.active_session_token !== localToken) {
        setExpired(true)
      }
    } catch {
      // Network hiccup — don't force logout
    }
  }, [user])

  // Check on every route change
  useEffect(() => { validate() }, [location.pathname, validate])

  // Poll every 5 minutes
  useEffect(() => {
    const id = setInterval(validate, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [validate])

  async function handleLoginAgain() {
    setExpired(false)
    localStorage.clear()
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return { expired, handleLoginAgain }
}
