export const validators = {

  email(email) {
    if (!email) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
    if (email.length > 255) return 'Email too long'
    return null
  },

  password(password) {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Minimum 6 characters'
    if (password.length > 72) return 'Password too long'
    return null
  },

  name(name) {
    if (!name || name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.length > 100) return 'Name too long'
    if (!/^[a-zA-Z\s\u0900-\u097F'.-]+$/.test(name)) return 'Name contains invalid characters'
    return null
  },

  interviewAnswer(answer) {
    if (!answer || !answer.trim()) return 'Please write an answer'
    if (answer.trim().length < 10) return 'Answer too short (min 10 characters)'
    if (answer.length > 5000) return 'Answer too long (max 5000 characters)'
    return null
  },

  sanitize(text) {
    if (!text) return ''
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  },
}
