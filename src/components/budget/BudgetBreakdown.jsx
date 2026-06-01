import { formatInr } from '../../utils/format.js'

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6',
  '#a855f7', '#ec4899', '#3b82f6', '#84cc16', '#f97316',
  '#06b6d4', '#eab308'
]

export default function BudgetBreakdown({ monthBudget, salary }) {
  const entries = Object.entries(monthBudget || {})
    .map(([cat, v]) => ({ name: cat, budgeted: Number(v.budgeted || 0) }))
    .filter(e => e.budgeted > 0)
    .sort((a, b) => b.budgeted - a.budgeted)

  const total = entries.reduce((s, e) => s + e.budgeted, 0)
  const salaryNum = Number(salary) || 0
  const remaining = salaryNum - total

  if (entries.length === 0) {
    return (
      <div className="card text-center text-sm text-slate-400 py-6">
        Add budget amounts above to see the split.
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-semibold text-slate-100">Budget breakdown</div>
        <div className="text-xs text-slate-400">{formatInr(total, { precise: true })} planned</div>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden bg-ink-800 mb-3">
        {entries.map((e, i) => (
          <div
            key={e.name}
            style={{ width: ((e.budgeted / total) * 100) + '%', background: COLORS[i % COLORS.length] }}
            title={`${e.name}: ${formatInr(e.budgeted, { precise: true })}`}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        {entries.map((e, i) => {
          const pct = (e.budgeted / total) * 100
          const pctSalary = salaryNum > 0 ? (e.budgeted / salaryNum) * 100 : null
          return (
            <div key={e.name} className="flex items-center text-sm gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-200 flex-1 truncate">{e.name}</span>
              <span className="text-slate-100 font-semibold tabular-nums w-24 text-right">
                {formatInr(e.budgeted, { precise: true })}
              </span>
              <span className="text-slate-400 text-xs tabular-nums w-12 text-right">
                {pct.toFixed(1)}%
              </span>
              {pctSalary != null && (
                <span className="text-slate-500 text-[10px] tabular-nums w-12 text-right hidden sm:inline">
                  {pctSalary.toFixed(1)}% of salary
                </span>
              )}
            </div>
          )
        })}
      </div>

      {salaryNum > 0 && (
        <div className="mt-3 pt-3 border-t border-ink-800 flex items-center justify-between text-sm">
          <span className="text-slate-400">Vs salary {formatInr(salaryNum)}</span>
          <span className={'font-bold tabular-nums ' + (remaining >= 0 ? 'text-good' : 'text-bad')}>
            {remaining >= 0 ? '+' : ''}{formatInr(remaining, { precise: true })}
            <span className="text-xs text-slate-400 font-normal ml-1">
              {remaining >= 0 ? 'free' : 'over'}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
