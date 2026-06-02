import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { todayIso, daysBetween } from '../../utils/date.js'

function currentMonthKey() {
  return todayIso().slice(0, 7)
}

function monthLabel(key) {
  const d = new Date(key + '-01')
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export default function MonthProjection() {
  const { state } = useApp()
  const monthKey = currentMonthKey()

  const data = useMemo(() => {
    const txs = (state.transactions || []).filter(t => t.date && t.date.startsWith(monthKey) && t.category !== 'Transfer')
    const incomeLogged = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expenseLogged = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)

    const salary = Number(state.config?.currentSalary || 0)
    const salaryAlreadyLogged = txs.some(t => t.type === 'income' && t.category === 'Salary')
    const expectedSalaryComponent = salaryAlreadyLogged ? 0 : salary

    const budgetForMonth = state.budget?.[monthKey] || {}
    const plannedExpense = Object.values(budgetForMonth).reduce((s, v) => s + Number(v.budgeted || 0), 0)

    const today = todayIso()
    const remindersDueThisMonth = (state.reminders || []).filter(r => {
      if (!r.date) return false
      const sameMonth = r.date.startsWith(monthKey)
      const inFuture = daysBetween(today, r.date) >= 0
      return sameMonth && inFuture
    })
    const remindersTotal = remindersDueThisMonth.reduce((s, r) => s + Number(r.amount || 0), 0)

    const totalIncome = expectedSalaryComponent + incomeLogged
    const totalOut = Math.max(plannedExpense, expenseLogged)
    const projectedBalance = totalIncome - totalOut

    // Pace-based forecast
    const dayOfMonth = Number(today.slice(8, 10))
    const totalDays = daysInMonth(monthKey)
    const daysRemaining = Math.max(0, totalDays - dayOfMonth)
    const paceDaily = dayOfMonth > 0 ? expenseLogged / dayOfMonth : 0
    const paceProjectedExtra = paceDaily * daysRemaining
    const paceProjectedTotalSpend = expenseLogged + paceProjectedExtra + remindersTotal
    const paceProjectedBalance = totalIncome - paceProjectedTotalSpend

    return {
      salary, incomeLogged, totalIncome, salaryAlreadyLogged,
      plannedExpense, expenseLogged, totalOut,
      remindersDueThisMonth, remindersTotal,
      projectedBalance,
      // pace
      dayOfMonth, totalDays, daysRemaining, paceDaily,
      paceProjectedTotalSpend, paceProjectedBalance
    }
  }, [state, monthKey])

  if (!data.salary && !data.plannedExpense && !data.incomeLogged && !data.expenseLogged) {
    return null
  }

  const overBudget = data.expenseLogged > data.plannedExpense && data.plannedExpense > 0

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-semibold text-slate-100">{monthLabel(monthKey)} outlook</div>
        <div className={'text-sm font-bold ' + (data.projectedBalance >= 0 ? 'text-good' : 'text-bad')}>
          {data.projectedBalance >= 0 ? '+' : ''}{formatInr(data.projectedBalance, { precise: true })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-ink-800 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Income expected</div>
          <div className="font-semibold text-good mt-0.5">{formatInr(data.totalIncome, { precise: true })}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Salary {formatInr(data.salary)}
            {data.incomeLogged > 0 && <> + extras {formatInr(data.incomeLogged, { precise: true })}</>}
          </div>
        </div>

        <div className="rounded-lg bg-ink-800 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Money out</div>
          <div className={'font-semibold mt-0.5 ' + (overBudget ? 'text-bad' : 'text-slate-100')}>
            {formatInr(data.totalOut, { precise: true })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Planned {formatInr(data.plannedExpense)}
            {data.expenseLogged > 0 && <> · spent {formatInr(data.expenseLogged, { precise: true })}</>}
          </div>
        </div>
      </div>

      {data.remindersDueThisMonth.length > 0 && (
        <div className="mt-3 rounded-lg bg-warn/10 border border-warn/30 p-2">
          <div className="flex items-baseline justify-between">
            <div className="text-xs text-warn font-medium">
              {data.remindersDueThisMonth.length} reminder{data.remindersDueThisMonth.length === 1 ? '' : 's'} due this month
            </div>
            <div className="text-xs text-warn font-semibold">
              {formatInr(data.remindersTotal, { precise: true })}
            </div>
          </div>
          <div className="text-[11px] text-warn/80 mt-1 truncate">
            {data.remindersDueThisMonth.slice(0, 3).map(r => r.title).join(' · ')}
            {data.remindersDueThisMonth.length > 3 && ` +${data.remindersDueThisMonth.length - 3} more`}
          </div>
        </div>
      )}

    </div>
  )
}
