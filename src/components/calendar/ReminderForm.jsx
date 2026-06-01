import { useState, useEffect } from 'react'
import { REMINDER_RECURRENCE, REMINDER_TYPES } from '../../config/constants.js'
import { useApp } from '../../context/AppContext.jsx'

const EMPTY = {
  title: '',
  date: '',
  recurrence: 'once',
  amount: 0,
  type: REMINDER_TYPES[0],
  validityDays: 0,
  account: '',
  notes: ''
}

export default function ReminderForm({ initial, onSubmit, onCancel }) {
  const { state } = useApp()
  const accounts = state.accounts || []
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    setForm({ ...EMPTY, ...(initial || {}) })
  }, [initial])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      amount: Number(form.amount) || 0,
      validityDays: Number(form.validityDays) || 0
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Title">
        <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" required className="input" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Recurrence">
          <select className="input" value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
            {REMINDER_RECURRENCE.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {REMINDER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Plan validity (days) — for auto-renewal">
          <input
            type="number" min="0"
            className="input"
            value={form.validityDays}
            onChange={e => set('validityDays', e.target.value)}
            placeholder="e.g. 28, 84, 365"
          />
        </Field>
        {accounts.length > 0 && (
          <Field label="Pays from">
            <select className="input" value={form.account} onChange={e => set('account', e.target.value)}>
              <option value="">— choose at payment time —</option>
              {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <Field label="Notes">
        <textarea rows="2" className="input" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
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
