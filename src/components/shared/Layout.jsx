import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { useSync } from '../../context/SyncContext.jsx'
import { useToast } from './Toast.jsx'
import SyncStatusBadge from './SyncStatusBadge.jsx'
import Nav from './Nav.jsx'

export default function Layout({ children, basePath }) {
  const { logout } = useAuth()
  const { pullFromSheet, status, isMaster, syncAllToOtherView } = useSync()
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

  async function handleSyncAll() {
    if (!confirm('Copy ALL data from this sheet to Sheet 2?\n\nIt adds/updates everything here into Sheet 2 (transactions, loans, reminders, accounts, budget, debt settings) and keeps any extra data already in Sheet 2. Salary is not copied.')) return
    try {
      toast.info?.('Syncing to Sheet 2…')
      await syncAllToOtherView()
      toast.success('Everything synced to Sheet 2')
    } catch (err) {
      toast.error('Sync to Sheet 2 failed: ' + err.message)
    }
  }

  return (
    <div className="min-h-full pb-24">
      <header className="sticky top-0 z-20 bg-ink-950/90 backdrop-blur border-b border-ink-800 safe-top">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Row 1: identity + sign out */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              VK
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">Ledger</div>
            </div>
            <button
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-ink-700 shrink-0"
              onClick={() => { logout(); navigate('/', { replace: true }) }}
            >
              Sign out
            </button>
          </div>

          {/* Row 2: sync controls — wraps cleanly on narrow screens, no overlap */}
          <div className="mt-2 flex items-center flex-wrap gap-2">
            <SyncStatusBadge />
            <button
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-ink-700"
              onClick={handlePull}
              disabled={status === 'pulling' || status === 'pushing'}
              title="Replace local data with what's in Google Sheet"
            >
              ↓ Pull
            </button>
            {isMaster && (
              <button
                className="text-xs text-brand-300 hover:text-brand-200 px-2 py-1 rounded-lg border border-brand-500/40"
                onClick={handleSyncAll}
                disabled={status === 'pulling' || status === 'pushing'}
                title="Copy all data from this sheet into Sheet 2 (keeps Sheet 2 extras; salary not copied)"
              >
                ⇄ Sync to Sheet 2
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {children}
      </main>

      <Nav basePath={basePath} />
    </div>
  )
}
