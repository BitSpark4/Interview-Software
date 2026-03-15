const AUTH_ERRORS = {
  'Invalid login credentials':                'Invalid email or password.',
  'Email not confirmed':                      'Please verify your email before signing in.',
  'User already registered':                  'An account with this email already exists. Sign in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Unable to validate email address':         'Please enter a valid email address.',
}

export function getErrorMessage(error) {
  if (!navigator.onLine) return 'No internet connection. Please check and try again.'

  const msg = error?.message || error?.error_description || String(error || '')
  return AUTH_ERRORS[msg] || msg || 'Something went wrong. Please try again.'
}
