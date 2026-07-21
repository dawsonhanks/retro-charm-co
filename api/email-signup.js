import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Persist an email signup to Supabase.
 * Blank/invalid emails are rejected; duplicates are treated as success.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  const email = rawEmail.toLowerCase()
  const source = typeof req.body?.source === 'string' && req.body.source.trim() ? req.body.source.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('email_signups').upsert(
      { email, source },
      { onConflict: 'email', ignoreDuplicates: true },
    )

    if (error) {
      console.error('[email-signup] Supabase error:', error)
      // Still acknowledge so the form can show success; email capture should not block UX.
      return res.status(200).json({ ok: true, stored: false })
    }

    return res.status(200).json({ ok: true, stored: true })
  } catch (error) {
    console.error('[email-signup] unexpected error:', error)
    return res.status(200).json({ ok: true, stored: false })
  }
}
