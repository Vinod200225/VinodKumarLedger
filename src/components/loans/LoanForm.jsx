import { useState, useEffect } from 'react'
import { LOAN_STATUS, LOAN_SOURCES, LOAN_KINDS } from '../../config/constants.js'

const EMPTY = {
  name: '',
  kind: 'standard',
  principal: 0,
  paid: 0,
  emi: 0,
  dueDate: '',
  endDate: '',
  source: LOAN_SOURCES[0],
  status: LOAN_STATUS.ACTIVE
}

export default function LoanForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    setForm({ ...EMPTY, ...(initial || {}) })
  }, [initial])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      principal: Number(form.principal) || 0,
      paid: Number(form.paid) || 0,
      emi: Number(form.emi) || 0,
      dueDate: form.dueDate || null,
      endDate: form.endDate || null,
      kind: form.kind || 'standard'
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Name">
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Kind">
          <select className="input" value={form.kind} onChange={e => set('kind', e.target.value)}>
            {LOAN_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={form.kind === 'revolving' ? 'Outstanding (₹)' : 'Principal (₹)'}>
          <input type="number" min="0" step="0.01" className="input" value={form.principal} onChange={e => set('principal', e.target.value)} />
        </Field>
        <Field label={form.kind === 'revolving' ? 'Paid to date (₹)' : 'Paid so far (₹)'}>
          <input type="number" min="0" step="0.01" className="input" value={form.paid} onChange={e => set('paid', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={form.kind === 'revolving' ? 'Min payment (₹/mo)' : 'EMI (₹/mo)'}>
          <input type="number" min="0" step="0.01" className="input" value={form.emi} onChange={e => set('emi', e.target.value)} />
        </Field>
        <Field label="Next due date">
          <input type="date" className="input" value={form.dueDate || ''} onChange={e => set('dueDate', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="End / close date">
          <input type="date" className="input" value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} />
        </Field>
        <Field label="Source">
          <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
            {LOAN_SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value={LOAN_STATUS.ACTIVE}>Active</option>
            <option value={LOAN_STATUS.INFORMAL}>Informal</option>
            <option value={LOAN_STATUS.CLOSED}>Closed</option>
          </select>
        </Field>
      </div>
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
