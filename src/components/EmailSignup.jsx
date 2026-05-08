import { useState } from 'react'

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function EmailSignup({ className = '', source = 'generic', showName = false, buttonLabel = 'Subscribe', onSuccess, theme = 'on-dark' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const labelClass = theme === 'on-light' ? 'text-jscolors-charcoal/85' : 'text-jscolors-cream/90'
  const errClass = theme === 'on-light' ? 'text-red-600' : 'text-red-300'
  const okClass = theme === 'on-light' ? 'text-emerald-700' : 'text-emerald-300'

  function handleSubmit(e) {
    e.preventDefault()
    if (showName && !name.trim()) {
      setStatus('error')
      return
    }
    if (!emailOk(email)) {
      setStatus('error')
      return
    }
    setStatus('ok')
    onSuccess?.({ name: name.trim(), email: email.trim(), source })
    setEmail('')
    setName('')
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
            className="w-full rounded-xl border-2 border-jscolors-gold/30 bg-white px-4 py-3 text-jscolors-navy outline-none ring-jscolors-pink/30 transition focus:border-jscolors-gold focus:ring-2"
            placeholder="Alex Taylor"
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
          className="w-full rounded-xl border-2 border-jscolors-gold/30 bg-white px-4 py-3 text-jscolors-navy outline-none ring-jscolors-pink/30 transition focus:border-jscolors-gold focus:ring-2"
          placeholder="hello@example.com"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-jscolors-pink px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
        >
          {buttonLabel}
        </button>
        {status === 'error' && (
          <span className={`text-sm ${errClass}`}>Please enter a valid email{showName ? ' and name' : ''}.</span>
        )}
        {status === 'ok' && <span className={`text-sm ${okClass}`}>You are in — thank you!</span>}
      </div>
    </form>
  )
}
