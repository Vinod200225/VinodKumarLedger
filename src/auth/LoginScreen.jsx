import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { mode, tryLogin } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode === 'public') navigate('/public', { replace: true })
    if (mode === 'real') navigate('/real', { replace: true })
  }, [mode, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await tryLogin(password)
      if (!result) setError('Incorrect password')
      else navigate('/' + result, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const hashesConfigured =
    !!import.meta.env.VITE_PUBLIC_PASSWORD_HASH ||
    !!import.meta.env.VITE_REAL_PASSWORD_HASH

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl shadow-card">
            VK
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-100">Ledger</h1>
          <p className="text-sm text-slate-400">Personal finance tracker</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label">Username</label>
            <div className="mt-1 input bg-ink-900 cursor-default select-none">
              Vinod
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="input mt-1"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!hashesConfigured && (
            <div className="text-xs text-warn bg-warn/10 border border-warn/30 rounded-lg px-3 py-2">
              No password hashes set in <code>.env</code>. Run the snippet from{' '}
              <code>CLAUDE.md</code> in your browser console, then paste the hash
              into <code>VITE_PUBLIC_PASSWORD_HASH</code> /{' '}
              <code>VITE_REAL_PASSWORD_HASH</code>.
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !password}
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
