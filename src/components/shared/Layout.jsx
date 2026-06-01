import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { useSync } from '../../context/SyncContext.jsx'
import { useToast } from './Toast.jsx'
import SyncStatusBadge from './SyncStatusBadge.jsx'
import Nav from './Nav.jsx'

export default function Layout({ children, basePath }) {
  const { logout } = useAuth()
  const { pullFromSheet, status } = useSync()
  const toast = useToast()
  const navigate = useNavigate()

  async function handlePull() {
    if (!confirm('Pull from Google Sheet? This will overwrite any local edits not yet synced.')) return
    try {
      await pullFromSheet()
      toast.success('Pulled fresh from sheet')
    } catch (err) {
      toast.error('Pull failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-full pb-24">
      <header className="sticky top-0 z-20 bg-ink-950/90 backdrop-blur border-b border-ink-800 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
            VK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-100 truncate">Ledger</div>
            <SyncStatusBadge />
          </div>
          <button
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-ink-700"
            onClick={handlePull}
            disabled={status === 'pulling' || status === 'pushing'}
            title="Replace local data with what's in Google Sheet"
          >
            ↓ Pull
          </button>
          <button
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-ink-700"
            onClick={() => { logout(); navigate('/', { replace: true }) }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {children}
      </main>

      <Nav basePath={basePath} />
    </div>
  )
}
