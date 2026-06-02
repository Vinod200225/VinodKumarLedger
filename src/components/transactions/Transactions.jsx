import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../shared/Toast.jsx'
import Modal from '../shared/Modal.jsx'
import TransactionForm from './TransactionForm.jsx'
import { formatInr } from '../../utils/format.js'
import { fmtDate, monthKey } from '../../utils/date.js'
import { newId } from '../../utils/id.js'
import { useMirror } from '../../hooks/useMirror.js'
import { SHEET_TABS } from '../../config/constants.js'

export default function Transactions() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const mirror = useMirror()
  const [month, setMonth] = useState(monthKey())
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const accounts = state.accounts || []

  const monthTxs = useMemo(
    () => (state.transactions || []).filter(t => {
      if (!t.date || t.date.slice(0, 7) !== month) return false
      if (filterAccount && t.account !== filterAccount) return false
      if (filterCategory && t.category !== filterCategory) return false
      return true
    }),
    [state.transactions, month, filterAccount, filterCategory]
  )

  const availableCategories = useMemo(() => {
    const set = new Set()
    ;(state.transactions || []).forEach(t => {
      if (t.date?.slice(0, 7) === month) set.add(t.category)
    })
    return Array.from(set).filter(Boolean).sort()
  }, [state.transactions, month])

  const grouped = useMemo(() => {
    const byDate = {}
    monthTxs.forEach(t => {
      (byDate[t.date] = byDate[t.date] || []).push(t)
    })
    return Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]))
  }, [monthTxs])

  const totals = useMemo(() => {
    let income = 0, expense = 0
    monthTxs.forEach(t => {
      if (t.category === 'Transfer') return   // self-transfers move money, they aren't income/expense
      if (t.type === 'income') income += Number(t.amount) || 0
      else expense += Number(t.amount) || 0
    })
    return { income, expense, net: income - expense }
  }, [monthTxs])

  function handleSubmit(tx) {
    if (editing) {
      const updated = { ...tx, id: editing.id }
      dispatch({ type: 'TX_UPDATE', tx: updated })
      toast.success('Entry updated')
      setShowForm(false)
      setEditing(null)
      mirror(SHEET_TABS.TRANSACTIONS, 'update', { item: updated })
    } else {
      const withId = { ...tx, id: newId() }
      dispatch({ type: 'TX_ADD', tx: withId })
      toast.success('Entry added')
      setShowForm(false)
      setEditing(null)
      mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: withId })
    }
  }

  function handleEdit(tx) {
    setEditing(tx)
    setShowForm(true)
  }

  function handleDelete(tx) {
    if (!confirm(`Delete this ${t2(tx.type)} of ${formatInr(tx.amount, { precise: true })}?`)) return
    dispatch({ type: 'TX_DELETE', id: tx.id })
    toast.success('Entry deleted')
    mirror(SHEET_TABS.TRANSACTIONS, 'delete', { id: tx.id })
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="label">Month</div>
            <input
              type="month"
              className="input mt-1 !w-40"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            + Add
          </button>
        </div>

        {(accounts.length > 0 || availableCategories.length > 0) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {accounts.length > 0 && (
              <select
                className="input !py-1.5 text-sm"
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
              >
                <option value="">All accounts</option>
                {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            )}
            {availableCategories.length > 0 && (
              <select
                className="input !py-1.5 text-sm"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Tile label="Earned" value={formatInr(totals.income, { precise: true })} tone="text-good" />
          <Tile label="Spent" value={formatInr(totals.expense, { precise: true })} tone="text-bad" />
          <Tile label="Net" value={formatInr(totals.net, { precise: true })} tone={totals.net >= 0 ? 'text-good' : 'text-bad'} />
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="card text-center text-slate-400 text-sm py-8">
          No entries for this month. Tap <span className="text-brand-400 font-medium">+ Add</span> to log one.
        </div>
      )}

      {grouped.map(([date, txs]) => {
        const dayTotal = txs.reduce((s, t) => {
          if (t.category === 'Transfer') return s
          return s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
        }, 0)
        return (
          <div key={date} className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-200">{fmtDate(date)}</div>
              <div className={'text-xs font-medium ' + (dayTotal >= 0 ? 'text-good' : 'text-bad')}>
                {dayTotal >= 0 ? '+' : ''}{formatInr(dayTotal, { precise: true })}
              </div>
            </div>
            <div className="divide-y divide-ink-800">
              {txs.map(t => {
                const isXfer = t.category === 'Transfer'
                return (
                <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-100 truncate">
                      <span className={'inline-block w-1.5 h-1.5 rounded-full mr-2 ' + (isXfer ? 'bg-slate-400' : t.type === 'income' ? 'bg-good' : 'bg-bad')} />
                      {isXfer ? 'Transfer' : t.category}
                      {t.note && <span className="text-slate-400"> · {t.note}</span>}
                    </div>
                  </div>
                  <div className={'text-sm font-semibold tabular-nums ' + (isXfer ? 'text-slate-400' : t.type === 'income' ? 'text-good' : 'text-bad')}>
                    {isXfer ? '⇄ ' : t.type === 'income' ? '+' : '−'}{formatInr(t.amount, { precise: true })}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(t)} className="btn-ghost !px-2 !py-1 text-xs">Edit</button>
                    <button onClick={() => handleDelete(t)} className="btn-ghost !px-2 !py-1 text-xs text-bad">×</button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )
      })}

      <Modal
        open={showForm}
        title={editing ? 'Edit entry' : 'Add entry'}
        onClose={() => { setShowForm(false); setEditing(null) }}
      >
        <TransactionForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      </Modal>
    </div>
  )
}

function Tile({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-ink-800 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={'text-sm font-semibold ' + tone}>{value}</div>
    </div>
  )
}

function t2(t) { return t === 'income' ? 'earning' : 'expense' }
