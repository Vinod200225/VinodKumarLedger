import { useState, useEffect, useRef } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../config/constants.js'
import { useApp } from '../../context/AppContext.jsx'
import { todayIso } from '../../utils/date.js'

const EMPTY = {
  date: todayIso(),
  type: 'expense',
  category: EXPENSE_CATEGORIES[0],
  subcategory: '',
  amount: '',
  note: '',
  account: ''
}

const INVESTMENT_SUBCATEGORY_SUGGESTIONS = ['LIC Policy 1', 'LIC Policy 2', 'RD (LIC fund)', 'NPS (Yashwin)']

export default function TransactionForm({ initial, onSubmit, onCancel }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(EMPTY)
  const submittingRef = useRef(false)

  const customExpense = state.config?.customCategories?.expense || []
  const customIncome  = state.config?.customCategories?.income  || []

  const accounts = state.accounts || []
  const defaultAccount = accounts[0]?.name || ''

  useEffect(() => {
    if (initial) {
      setForm({ ...EMPTY, account: defaultAccount, ...initial })
    } else {
      setForm({ ...EMPTY, date: todayIso(), account: defaultAccount })
    }
  }, [initial, defaultAccount])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function setType(t) {
    const cats = t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    setForm(f => ({ ...f, type: t, category: cats[0] }))
  }

  function submit(e) {
    e.preventDefault()
    if (submittingRef.current) return       // guard against a double-tap creating two entries
    const amt = Number(form.amount)
    if (!amt || amt <= 0) return
    submittingRef.current = true
    onSubmit({ ...form, amount: amt })
  }

  const categories = form.type === 'income'
    ? [...INCOME_CATEGORIES, ...customIncome]
    : [...EXPENSE_CATEGORIES, ...customExpense]
  const isEdit = !!initial

  function handleCategoryChange(value) {
    if (value === '__add__') {
      const name = (prompt('New category name?') || '').trim()
      if (!name) return
      const key = form.type === 'income' ? 'income' : 'expense'
      const existing = state.config?.customCategories || { expense: [], income: [] }
      const list = existing[key] || []
      if (list.includes(name)) { set('category', name); return }
      dispatch({
        type: 'CONFIG_SET',
        patch: {
          customCategories: { ...existing, [key]: [...list, name] }
        }
      })
      set('category', name)
    } else {
      set('category', value)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-1 p-1 bg-ink-900 rounded-xl">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={'py-2 rounded-lg text-sm font-medium ' + (form.type === 'expense' ? 'bg-bad/20 text-bad' : 'text-slate-400')}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={'py-2 rounded-lg text-sm font-medium ' + (form.type === 'income' ? 'bg-good/20 text-good' : 'text-slate-400')}
        >
          Earning
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            type="date" required
            className="input"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </Field>
        <Field label="Amount (₹)">
          <input
            type="number" min="0" step="0.01" required
            className="input"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <Field label="Category">
        <select className="input" value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
          <option value="__add__">+ Add new category…</option>
        </select>
      </Field>

      {form.category === 'Investment' && (
        <Field label="Which investment? (e.g. LIC Policy 1)">
          <input
            className="input"
            list="investment-subcats"
            value={form.subcategory}
            onChange={e => set('subcategory', e.target.value)}
            placeholder="LIC Policy 1, RD, NPS..."
          />
          <datalist id="investment-subcats">
            {INVESTMENT_SUBCATEGORY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </Field>
      )}

      {accounts.length > 0 && (
        <Field label={form.type === 'income' ? 'Credited to account' : 'Paid from account'}>
          <select className="input" value={form.account} onChange={e => set('account', e.target.value)}>
            <option value="">— None / unspecified —</option>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Note (optional)">
        <input
          className="input"
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="e.g. Cab to airport"
        />
      </Field>

      {!isEdit && (
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>⇄</span> This entry is automatically copied to the other view.
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">
          {isEdit ? 'Save changes' : 'Add entry'}
        </button>
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
