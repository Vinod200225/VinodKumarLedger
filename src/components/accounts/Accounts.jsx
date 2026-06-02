import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../shared/Toast.jsx'
import Modal from '../shared/Modal.jsx'
import AccountForm from './AccountForm.jsx'
import { formatInr } from '../../utils/format.js'
import { fmtDate } from '../../utils/date.js'
import { ACCOUNT_TYPES, SHEET_TABS } from '../../config/constants.js'
import { useMirror } from '../../hooks/useMirror.js'
import { newId } from '../../utils/id.js'

export function computeAccountBalance(account, transactions) {
  if (!account) return 0
  const opening = Number(account.openingBalance) || 0
  const openingDate = account.openingDate || ''
  const delta = (transactions || []).reduce((sum, t) => {
    if (t.account !== account.name) return sum
    if (openingDate && t.date < openingDate) return sum
    const amt = Number(t.amount) || 0
    return t.type === 'income' ? sum + amt : sum - amt
  }, 0)
  return opening + delta
}

const typeLabel = v => (ACCOUNT_TYPES.find(t => t.value === v) || {}).label || v

export default function Accounts() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const mirror = useMirror()
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const accountsWithBalance = useMemo(() => {
    return (state.accounts || []).map(a => ({
      ...a,
      currentBalance: computeAccountBalance(a, state.transactions)
    }))
  }, [state.accounts, state.transactions])

  const grandTotal = accountsWithBalance.reduce((s, a) => s + a.currentBalance, 0)

  function save(form) {
    if (editing) {
      const account = { ...editing, ...form }
      dispatch({ type: 'ACCOUNT_UPDATE', account })
      toast.success('Account updated')
      setShowForm(false)
      setEditing(null)
      mirror(SHEET_TABS.ACCOUNTS, 'update', { item: account })
    } else {
      const account = { ...form, id: newId() }
      dispatch({ type: 'ACCOUNT_ADD', account })
      toast.success('Account added')
      setShowForm(false)
      setEditing(null)
      mirror(SHEET_TABS.ACCOUNTS, 'add', { item: account })
    }
  }

  function handleDelete(a) {
    if (!confirm(`Delete account "${a.name}"? Existing transactions linked to it will keep the name but stop counting toward any balance.`)) return
    dispatch({ type: 'ACCOUNT_DELETE', id: a.id })
    toast.success('Account deleted')
    mirror(SHEET_TABS.ACCOUNTS, 'delete', { id: a.id })
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label">All accounts</div>
            <div className="text-2xl font-bold text-slate-50 mt-0.5">
              {formatInr(grandTotal, { precise: true })}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            + Add
          </button>
        </div>
      </div>

      {accountsWithBalance.length === 0 ? (
        <div className="card text-center text-slate-400 text-sm py-8">
          No accounts yet. Tap <span className="text-brand-400 font-medium">+ Add</span> to add HDFC, ICICI, etc.
        </div>
      ) : (
        accountsWithBalance.map(a => {
          const delta = a.currentBalance - (Number(a.openingBalance) || 0)
          return (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-100 truncate">{a.name}</h3>
                    <span className="chip bg-ink-800 text-slate-300">{typeLabel(a.type)}</span>
                  </div>
                  {a.notes && <div className="text-xs text-slate-500 mt-0.5">{a.notes}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => { setEditing(a); setShowForm(true) }}>Edit</button>
                  <button className="btn-ghost !px-2 !py-1 text-xs text-bad" onClick={() => handleDelete(a)}>×</button>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-ink-800 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Current balance</div>
                <div className={'text-2xl font-bold ' + (a.currentBalance < 0 ? 'text-bad' : 'text-slate-100')}>
                  {formatInr(a.currentBalance, { precise: true })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Opening {formatInr(a.openingBalance, { precise: true })}
                  {a.openingDate && ` on ${fmtDate(a.openingDate)}`}
                  {' · '}
                  <span className={delta >= 0 ? 'text-good' : 'text-bad'}>
                    {delta >= 0 ? '+' : '−'}{formatInr(Math.abs(delta), { precise: true })} since
                  </span>
                </div>
              </div>
            </div>
          )
        })
      )}

      <Modal
        open={showForm}
        title={editing ? 'Edit account' : 'Add account'}
        onClose={() => { setShowForm(false); setEditing(null) }}
      >
        <AccountForm
          initial={editing}
          onSubmit={save}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}
