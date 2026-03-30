const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body)

    if (!name || !email || !subject || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    await resend.emails.send({
      from: 'InterviewIQ Contact <noreply@getinterviewiq.in>',
      to: ['support@getinterviewiq.in'],
      replyTo: email,
      subject: `[Contact Form] ${subject} — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;
          background: #0A0F1E; color: #F8FAFC; padding: 40px 32px; border-radius: 12px;">

          <div style="margin-bottom: 28px;">
            <span style="font-size: 24px; font-weight: 800; color: #2563EB;">IQ</span>
            <span style="font-size: 18px; font-weight: 700; color: #F8FAFC; margin-left: 8px;">InterviewIQ</span>
            <p style="font-size: 13px; color: #64748B; margin: 4px 0 0;">Contact Form Submission</p>
          </div>

          <div style="background: #0F172A; border: 1px solid #1E293B; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-size: 13px; width: 80px;">From:</td>
                <td style="padding: 6px 0; color: #F8FAFC; font-size: 14px; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-size: 13px;">Email:</td>
                <td style="padding: 6px 0; color: #2563EB; font-size: 14px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B; font-size: 13px;">Subject:</td>
                <td style="padding: 6px 0; color: #F59E0B; font-size: 14px; font-weight: 600;">${subject}</td>
              </tr>
            </table>
          </div>

          <div style="background: #111827; border: 1px solid #1E293B; border-radius: 10px; padding: 20px 24px;">
            <p style="font-size: 13px; color: #64748B; margin: 0 0 12px;">Message:</p>
            <p style="font-size: 15px; color: #94A3B8; line-height: 1.8; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1E293B;
            font-size: 12px; color: #4B5563;">
            InterviewIQ — Built for India 🇮🇳 | Reply directly to this email to respond to ${name}
          </div>
        </div>
      `,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Contact email error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
    }
  }
}
