import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { EXPENSE_CATEGORIES } from '../../config/constants.js'
import { monthKey } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'
import BudgetVsActualChart from './BudgetVsActualChart.jsx'
import BudgetBreakdown from './BudgetBreakdown.jsx'

const toArr = v => Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])

export default function BudgetPlanner() {
  const { state, dispatch } = useApp()
  const [month, setMonth] = useState(monthKey())

  const monthBudget = state.budget?.[month] || {}

  // "Actual" is computed automatically from what you actually spent this month —
  // every expense (daily, EMI, Slice, loans, etc.) rolls up by its category.
  // Self-transfers are not spending, so they're excluded.
  const actualByCat = useMemo(() => {
    const out = {}
    ;(state.transactions || []).forEach(t => {
      if (t.type !== 'expense' || t.category === 'Transfer') return
      if ((t.date || '').slice(0, 7) !== month) return
      const cat = t.category || 'Other'
      out[cat] = (out[cat] || 0) + (Number(t.amount) || 0)
    })
    return out
  }, [state.transactions, month])

  // Show built-in categories + any custom ones + anything actually spent this month.
  const customExpense = toArr(state.config?.customCategories?.expense)
  const categories = useMemo(() => {
    return Array.from(new Set([
      ...EXPENSE_CATEGORIES,
      ...customExpense,
      ...Object.keys(actualByCat),
      ...Object.keys(monthBudget)
    ])).filter(Boolean)
  }, [customExpense, actualByCat, monthBudget])

  const totalBudget = categories.reduce((s, c) => s + Number(monthBudget[c]?.budgeted || 0), 0)
  const totalActual = categories.reduce((s, c) => s + Number(actualByCat[c] || 0), 0)

  function setBudgeted(cat, budgeted) {
    // Store the plan; snapshot the current computed actual alongside it.
    dispatch({ type: 'BUDGET_SET', month, category: cat, value: { budgeted, actual: actualByCat[cat] || 0 } })
  }

  function setSalary(field, value) {
    dispatch({ type: 'CONFIG_SET', patch: { [field]: Number(value) || 0 } })
  }

  const chartCats = categories
    .map(c => ({ name: c, budgeted: Number(monthBudget[c]?.budgeted || 0), actual: Number(actualByCat[c] || 0) }))
    .filter(c => c.budgeted > 0 || c.actual > 0)

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="block">
          <span className="label">Monthly in-hand salary (₹)</span>
          <input
            type="number" min="0" step="0.01"
            className="input mt-1"
            value={state.config?.currentSalary || ''}
            onChange={e => setSalary('currentSalary', e.target.value)}
            placeholder="e.g. 39510"
          />
          <div className="text-xs text-slate-500 mt-1.5">
            Edit anytime you change jobs or get a raise. This view's number is independent from the other view.
          </div>
        </label>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="label">Monthly budget</div>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="input mt-1 !w-40"
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Plan · Spent</div>
            <div className="text-sm font-semibold text-slate-100">
              {formatInr(totalBudget)} · <span className={totalActual > totalBudget ? 'text-bad' : 'text-good'}>{formatInr(totalActual)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
          <span>Category</span>
          <span className="w-24 text-right">Plan</span>
          <span className="w-24 text-right">Spent (auto)</span>
        </div>

        <div className="space-y-2">
          {categories.map(cat => {
            const budgeted = Number(monthBudget[cat]?.budgeted || 0)
            const actual = Number(actualByCat[cat] || 0)
            const over = actual > budgeted && budgeted > 0
            return (
              <div key={cat} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <span className="text-sm text-slate-200 truncate">{cat}</span>
                <input
                  type="number" min="0" placeholder="Budget"
                  value={monthBudget[cat]?.budgeted || ''}
                  onChange={e => setBudgeted(cat, Number(e.target.value) || 0)}
                  className="input !w-24 !py-1 text-right"
                />
                <div className={'w-24 text-right text-sm tabular-nums font-medium ' + (over ? 'text-bad' : actual > 0 ? 'text-slate-200' : 'text-slate-500')}>
                  {formatInr(actual, { precise: true })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-[11px] text-slate-500 mt-3">
          "Spent" fills in automatically from your daily entries, EMIs, Slice and loan
          payments — anything with a matching category.
        </div>
      </div>

      <BudgetBreakdown monthBudget={monthBudget} salary={state.config?.currentSalary} />

      <BudgetVsActualChart month={month} categories={chartCats} />
    </div>
  )
}
