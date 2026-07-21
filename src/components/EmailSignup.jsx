import { useState } from 'react'
import { submitEmailSignup } from '../utils/emailSignupApi'

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function EmailSignup({
  className = '',
  source = 'generic',
  showName = false,
  buttonLabel = 'Subscribe',
  onSuccess,
  theme = 'on-dark',
  successMessage = "You're on the list! Watch your inbox for new charm drops and restocks.",
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const labelClass = theme === 'on-light' ? 'text-jscolors-ink/85' : 'text-jscolors-cream/90'
  const errClass = theme === 'on-light' ? 'text-red-600' : 'text-red-300'
  const okClass = theme === 'on-light' ? 'text-emerald-700' : 'text-emerald-300'
  const isBusy = status === 'submitting' || status === 'ok'

  async function handleSubmit(e) {
    e.preventDefault()
    if (isBusy) return
    if (showName && !name.trim()) {
      setStatus('error')
      return
    }
    if (!emailOk(email.trim())) {
      setStatus('error')
      return
    }

    const trimmedEmail = email.trim()
    setStatus('submitting')

    // Always show success after a valid submit — duplicates and backend errors should not block UX.
    await submitEmailSignup(trimmedEmail, source)
    setStatus('ok')
    onSuccess?.({ name: name.trim(), email: trimmedEmail, source })
  }

  return (
    <form onSubmit={handleSubmit} className={`${className} flex flex-col gap-3`} noValidate>
      {showName && (
        <label className={`block text-left text-sm ${labelClass}`}>
          <span className="mb-1 block font-medium">Name</span>
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-jscolors-gold/30 bg-white px-4 py-3 text-jscolors-ink outline-none ring-jscolors-pink/30 transition focus:border-jscolors-gold focus:ring-2"
            placeholder="Alex Taylor"
            required={showName}
            disabled={isBusy}
          />
        </label>
      )}
      <label className={`block text-left text-sm ${labelClass}`}>
        <span className="mb-1 block font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border-2 border-jscolors-gold/30 bg-white px-4 py-3 text-jscolors-ink outline-none ring-jscolors-pink/30 transition focus:border-jscolors-gold focus:ring-2"
          placeholder="hello@example.com"
          required
          disabled={isBusy}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-full bg-jscolors-blue px-6 py-3 text-sm font-semibold text-jscolors-cream shadow-md transition hover:bg-jscolors-blue-hover disabled:opacity-70"
        >
          {status === 'ok' ? 'Submitted' : status === 'submitting' ? 'Submitting…' : buttonLabel}
        </button>
        {status === 'error' && (
          <span className={`text-sm ${errClass}`}>Please enter a valid email{showName ? ' and name' : ''}.</span>
        )}
        {status === 'ok' && <span className={`text-sm ${okClass}`}>{successMessage}</span>}
      </div>
    </form>
  )
}
