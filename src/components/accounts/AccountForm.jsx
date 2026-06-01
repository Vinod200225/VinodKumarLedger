import { useState, useEffect } from 'react'
import { ACCOUNT_TYPES } from '../../config/constants.js'
import { todayIso } from '../../utils/date.js'

const EMPTY = {
  name: '',
  type: 'bank',
  openingBalance: '',
  openingDate: todayIso(),
  notes: ''
}

export default function AccountForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    setForm({ ...EMPTY, openingDate: todayIso(), ...(initial || {}) })
  }, [initial])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      openingBalance: Number(form.openingBalance) || 0
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Name">
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="HDFC, ICICI, Cash..." />
        </Field>
        <Field label="Type">
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Opening balance (₹)">
          <input
            type="number" step="0.01"
            className="input"
            value={form.openingBalance}
            onChange={e => set('openingBalance', e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="As of date">
          <input
            type="date"
            className="input"
            value={form.openingDate}
            onChange={e => set('openingDate', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <input
          className="input"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="e.g. Main account, salary credit"
        />
      </Field>

      <div className="text-xs text-slate-500 bg-ink-800 rounded-lg px-3 py-2">
        Current balance is calculated as: opening + (income to this account) − (expenses from this account), counting only transactions on/after the opening date.
      </div>

      <div className="flex justify-end gap-2 pt-1">
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
