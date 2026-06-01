import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { EXPENSE_CATEGORIES } from '../../config/constants.js'
import { monthKey } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'
import SalarySplitEditor from './SalarySplitEditor.jsx'
import BudgetVsActualChart from './BudgetVsActualChart.jsx'
import BudgetBreakdown from './BudgetBreakdown.jsx'

export default function BudgetPlanner() {
  const { state, dispatch } = useApp()
  const [month, setMonth] = useState(monthKey())

  const monthBudget = state.budget?.[month] || {}
  const totalBudget = Object.values(monthBudget).reduce((s, v) => s + Number(v.budgeted || 0), 0)
  const totalActual = Object.values(monthBudget).reduce((s, v) => s + Number(v.actual || 0), 0)

  function setRow(cat, patch) {
    const next = { ...(monthBudget[cat] || { budgeted: 0, actual: 0 }), ...patch }
    dispatch({ type: 'BUDGET_SET', month, category: cat, value: next })
  }

  function setSalary(field, value) {
    dispatch({ type: 'CONFIG_SET', patch: { [field]: Number(value) || 0 } })
  }

  const chartCats = EXPENSE_CATEGORIES
    .map(c => ({ name: c, ...(monthBudget[c] || {}) }))
    .filter(c => (c.budgeted || 0) > 0 || (c.actual || 0) > 0)

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
            <div className="text-xs text-slate-400">Budget · Actual</div>
            <div className="text-sm font-semibold text-slate-100">
              {formatInr(totalBudget)} · <span className={totalActual > totalBudget ? 'text-bad' : 'text-good'}>{formatInr(totalActual)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const row = monthBudget[cat] || { budgeted: 0, actual: 0 }
            const over = row.actual > row.budgeted && row.budgeted > 0
            return (
              <div key={cat} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <span className="text-sm text-slate-200">{cat}</span>
                <input
                  type="number" min="0" placeholder="Budget"
                  value={row.budgeted || ''}
                  onChange={e => setRow(cat, { budgeted: Number(e.target.value) || 0 })}
                  className="input !w-24 !py-1 text-right"
                />
                <input
                  type="number" min="0" placeholder="Actual"
                  value={row.actual || ''}
                  onChange={e => setRow(cat, { actual: Number(e.target.value) || 0 })}
                  className={'input !w-24 !py-1 text-right ' + (over ? '!border-bad/60 text-bad' : '')}
                />
              </div>
            )
          })}
        </div>
      </div>

      <BudgetBreakdown monthBudget={monthBudget} salary={state.config?.currentSalary} />

      <BudgetVsActualChart month={month} categories={chartCats} />

      <SalarySplitEditor />
    </div>
  )
}
