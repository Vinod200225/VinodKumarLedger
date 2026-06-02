import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { todayIso } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'

// Move money between your own accounts (e.g. HDFC → ICICI for an Apple Music payment).
// A transfer does NOT change your total income/expense — it only shifts the balance
// from one account to another.
export default function TransferForm({ onSubmit, onCancel }) {
  const { state } = useApp()
  const accounts = state.accounts || []

  const [date, setDate] = useState(todayIso())
  const [from, setFrom] = useState(accounts[0]?.name || '')
  const [to, setTo] = useState(accounts[1]?.name || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const submittingRef = useRef(false)

  const amt = Number(amount) || 0
  const sameAccount = from && to && from === to
  const valid = amt > 0 && from && to && !sameAccount

  function submit(e) {
    e.preventDefault()
    if (submittingRef.current || !valid) return
    submittingRef.current = true
    onSubmit({ date, from, to, amount: amt, note })
  }

  if (accounts.length < 2) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-300">
          You need at least two accounts to transfer between them. Add your accounts
          (HDFC, ICICI, etc.) first from the Accounts screen.
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn-ghost" onClick={onCancel}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Date">
        <input type="date" required className="input" value={date} onChange={e => setDate(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="From account">
          <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="To account">
          <select className="input" value={to} onChange={e => setTo(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Amount (₹)">
        <input
          type="number" min="0" step="0.01" required autoFocus className="input"
          value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 199"
        />
      </Field>

      <Field label="Note (optional)">
        <input className="input" value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. Apple Music payment" />
      </Field>

      {sameAccount && (
        <div className="text-xs text-bad">Pick two different accounts.</div>
      )}

      {valid && (
        <div className="rounded-lg bg-ink-800 p-3 text-sm text-slate-300">
          {formatInr(amt, { precise: true })} moves from{' '}
          <span className="text-slate-100 font-semibold">{from}</span> →{' '}
          <span className="text-slate-100 font-semibold">{to}</span>.
          <div className="text-xs text-slate-500 mt-1">Doesn't count as income or expense.</div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={!valid}>Transfer</button>
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
