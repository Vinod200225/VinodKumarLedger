import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { todayIso, advanceByRecurrence } from '../../utils/date.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'

export default function EMIPaymentForm({ loan, onSubmit, onCancel }) {
  const { state } = useApp()
  const accounts = state.accounts || []
  const currentMonth = todayIso().slice(0, 7)
  const thisMonthEmi = currentEmiFor(loan, currentMonth)
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState(String(thisMonthEmi || ''))
  const [account, setAccount] = useState(accounts[0]?.name || '')
  const [advanceDue, setAdvanceDue] = useState(true)
  const [note, setNote] = useState('')

  const amtNum = Number(amount) || 0
  const scheduled = totalScheduledFor(loan)
  const remaining = Math.max(0, scheduled - (loan.paid || 0))
  const nextRemaining = Math.max(0, remaining - amtNum)
  const nextDueDate = loan.dueDate ? advanceByRecurrence(loan.dueDate, 'monthly', 0) : null

  function submit(e) {
    e.preventDefault()
    if (amtNum <= 0) return
    onSubmit({ date, amount: amtNum, account, advanceDue, note, nextDueDate })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="text-sm text-slate-300">
        Remaining: <span className="font-semibold text-slate-100">₹{remaining.toLocaleString('en-IN')}</span>
        {' · This month EMI: '}
        <span className="font-semibold text-slate-100">₹{thisMonthEmi.toLocaleString('en-IN')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" required className="input" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="Amount paid (₹)">
          <input type="number" min="0" step="0.01" required autoFocus className="input"
            value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
      </div>

      {accounts.length > 0 && (
        <Field label="Paid from">
          <select className="input" value={account} onChange={e => setAccount(e.target.value)}>
            <option value="">— None / unspecified —</option>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Note (optional)">
        <input className="input" value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. June EMI" />
      </Field>

      {nextDueDate && (
        <label className="flex items-center gap-2 select-none cursor-pointer text-sm text-slate-300">
          <input
            type="checkbox" checked={advanceDue}
            onChange={e => setAdvanceDue(e.target.checked)}
            className="w-4 h-4 rounded accent-brand-500"
          />
          Advance next due date to {nextDueDate}
        </label>
      )}

      <div className="rounded-lg bg-ink-800 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">After this payment</span>
          <span className="text-slate-100 font-semibold tabular-nums">
            ₹{nextRemaining.toLocaleString('en-IN')} remaining
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={amtNum <= 0}>Record EMI</button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
