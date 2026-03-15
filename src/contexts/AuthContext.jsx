import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser]               = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading]         = useState(true)
  const lastFetchedUserId             = useRef(null)
  const mounted                       = useRef(true)

  useEffect(() => {
    mounted.current = true

    // ── Step 1: Read initial session from localStorage (fast path) ──────────
    // getSession() reads localStorage synchronously if the token is still valid.
    // Race against 3 s so a paused/slow Supabase project never blocks the UI.
    async function initAuth() {
      try {
        const timeout  = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('auth_init_timeout')), 3000)
        )
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeout,
        ])

        if (!mounted.current) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Fetch profile non-blocking — does NOT delay setLoading(false)
        if (currentUser) {
          lastFetchedUserId.current = currentUser.id
          fetchProfile(currentUser.id) // intentionally not awaited
        }
      } catch {
        // Timeout or Supabase error — treat as logged-out, unblock UI
        if (mounted.current) setUser(null)
      } finally {
        // ── UI unblocks here, regardless of profile fetch status ────────────
        if (mounted.current) setLoading(false)
      }
    }

    initAuth()

    // ── Step 2: Listen for subsequent auth changes only ─────────────────────
    // We skip INITIAL_SESSION here because step 1 already handled it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return

        // Skip INITIAL_SESSION — already handled above without blocking
        if (event === 'INITIAL_SESSION') return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          if (currentUser.id !== lastFetchedUserId.current) {
            lastFetchedUserId.current = currentUser.id
            fetchProfile(currentUser.id) // non-blocking
          }
        } else {
          lastFetchedUserId.current = null
          setUserProfile(null)
        }
      }
    )

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetches profile in the background — never blocks the auth loading state
  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, email, name, plan, interviews_used, total_sessions, average_score, streak_count, resume_url, resume_filename, resume_uploaded_at, skills, target_role, created_at')
        .eq('id', userId)
        .single()
      if (mounted.current) setUserProfile(data ?? null)
    } catch {
      // users table may not exist yet (migrations pending) — not fatal
      if (mounted.current) setUserProfile(null)
    }
  }

  async function signUp(name, email, password) {
    const redirectTo = `${window.location.origin}/auth?mode=login&verified=true`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: redirectTo },
    })
    if (error) {
      if (error.message.includes('already registered'))
        throw new Error('Account already exists. Sign in instead.')
      throw new Error(error.message)
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Invalid email or password. Please try again.')
    navigate('/dashboard')
  }

  async function signOut() {
    try {
      // Clear all cached session data
      sessionStorage.clear()
      localStorage.removeItem('interviewiq_auth')

      await supabase.auth.signOut()
    } catch (err) {
      console.error('signOut error:', err)
    } finally {
      setUser(null)
      setUserProfile(null)
      lastFetchedUserId.current = null
      navigate('/')
    }
  }

  async function refreshProfile() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) fetchProfile(currentUser.id)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
