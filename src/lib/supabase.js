import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the JWT and refresh token in localStorage so users stay
    // logged in across browser sessions and page reloads.
    persistSession: true,

    // Automatically refresh the access token ~60 seconds before it
    // expires using the stored refresh token — no user action required.
    autoRefreshToken: true,

    // Parse tokens from the URL hash on landing after email-verification
    // or OAuth redirects (e.g. /auth?mode=login&verified=true).
    detectSessionInUrl: true,

    // Namespace this app's localStorage key to avoid collisions if the
    // same domain hosts multiple Supabase-backed applications.
    storageKey: 'interviewiq_auth',
  },
})
