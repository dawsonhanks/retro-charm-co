/**
 * Submit an email to /api/email-signup.
 * Network/server failures are swallowed so the UI can still show success.
 * @param {string} email
 */
export async function submitEmailSignup(email) {
  try {
    const res = await fetch('/api/email-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      console.warn('[email-signup] request failed:', res.status)
      return { ok: false }
    }

    return { ok: true }
  } catch (error) {
    console.warn('[email-signup] network error:', error)
    return { ok: false }
  }
}
