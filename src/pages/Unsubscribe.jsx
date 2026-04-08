/**
 * Unsubscribe page — /unsubscribe?token={base64(userId)}
 * Inserts 'unsubscribed' into email_notifications to permanently block automated emails.
 */
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing | done | error

  useEffect(() => {
    async function handle() {
      const token = params.get('token')
      if (!token) { setStatus('error'); return }
      try {
        const userId = atob(token)
        if (!userId) { setStatus('error'); return }

        // Check not already unsubscribed
        const { data: existing } = await supabase
          .from('email_notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'unsubscribed')
          .maybeSingle()

        if (!existing) {
          await supabase.from('email_notifications').insert({ user_id: userId, notification_type: 'unsubscribed' })
        }
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }
    handle()
  }, [params])

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F19', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {status === 'processing' && (
          <p style={{ color: '#9CA3AF', fontSize: 15 }}>Processing your request…</p>
        )}
        {status === 'done' && (<>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>You're unsubscribed</p>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>You won't receive automated email reminders from InterviewIQ anymore.</p>
          <Link to="/dashboard" style={{ display: 'inline-block', background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
            Go to Dashboard
          </Link>
        </>)}
        {status === 'error' && (
          <p style={{ color: '#EF4444', fontSize: 15 }}>Invalid unsubscribe link. Please contact support.</p>
        )}
      </div>
    </div>
  )
}
