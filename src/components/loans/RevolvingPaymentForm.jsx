import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { todayIso } from '../../utils/date.js'

export default function RevolvingPaymentForm({ loan, onSubmit, onCancel }) {
  const { state } = useApp()
  const accounts = state.accounts || []
  const [date, setDate] = useState(todayIso())
  const [paid, setPaid] = useState('')
  const [withdrawn, setWithdrawn] = useState('')
  const [note, setNote] = useState('')
  const [account, setAccount] = useState(accounts[0]?.name || '')

  const paidNum = Number(paid) || 0
  const withdrawnNum = Number(withdrawn) || 0
  const netReduction = paidNum - withdrawnNum

  function submit(e) {
    e.preventDefault()
    if (paidNum <= 0) return
    onSubmit({ date, paid: paidNum, withdrawn: withdrawnNum, note, account })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="text-sm text-slate-300">
        Current outstanding: <span className="font-semibold text-slate-100">₹{loan.principal.toLocaleString('en-IN')}</span>
      </div>

      <Field label="Date">
        <input type="date" required className="input" value={date} onChange={e => setDate(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Paid (₹)">
          <input type="number" min="0" step="0.01" required autoFocus className="input"
            value={paid} onChange={e => setPaid(e.target.value)} placeholder="18000" />
        </Field>
        <Field label="Withdrawn back (₹)">
          <input type="number" min="0" step="0.01" className="input"
            value={withdrawn} onChange={e => setWithdrawn(e.target.value)} placeholder="0" />
        </Field>
      </div>

      {accounts.length > 0 && (
        <Field label="From / to account">
          <select className="input" value={account} onChange={e => setAccount(e.target.value)}>
            <option value="">— None / unspecified —</option>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Note (optional)">
        <input className="input" value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. June minimum payment" />
      </Field>

      <div className={'rounded-lg p-3 text-sm ' + (netReduction > 0 ? 'bg-good/10 text-good' : netReduction < 0 ? 'bg-bad/10 text-bad' : 'bg-ink-800 text-slate-400')}>
        <div className="flex justify-between">
          <span>Net reduction in outstanding</span>
          <span className="font-bold tabular-nums">
            {netReduction >= 0 ? '−' : '+'}₹{Math.abs(netReduction).toLocaleString('en-IN')}
          </span>
        </div>
        {netReduction > 0 && paidNum > 0 && (
          <div className="text-xs mt-1 opacity-80">
            New outstanding will be ₹{Math.max(0, loan.principal - netReduction).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={paidNum <= 0}>Record payment</button>
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
