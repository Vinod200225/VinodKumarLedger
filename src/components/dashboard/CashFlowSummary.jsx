import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { monthKey } from '../../utils/date.js'

export default function CashFlowSummary() {
  const { state } = useApp()
  const mk = monthKey()
  const month = state.transactions.filter(t => (t.date || '').startsWith(mk) && t.category !== 'Transfer')
  const income = month.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
  const expense = month.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
  const net = income - expense

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="label">This month</div>
        <div className="text-xs text-slate-500">{mk}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Cell label="Income" value={income} tone="text-good" />
        <Cell label="Expense" value={expense} tone="text-bad" />
        <Cell label="Net" value={net} tone={net >= 0 ? 'text-good' : 'text-bad'} />
      </div>
    </div>
  )
}

function Cell({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-ink-800 px-3 py-2">
      <div className="label">{label}</div>
      <div className={'text-sm font-semibold ' + tone}>{formatInr(value)}</div>
    </div>
  )
}
