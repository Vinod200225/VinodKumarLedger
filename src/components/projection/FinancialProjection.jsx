import { useApp } from '../../context/AppContext.jsx'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { formatInr } from '../../utils/format.js'
import { todayIso } from '../../utils/date.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'
import DebtFreeCountdown from './DebtFreeCountdown.jsx'
import WhatIfSimulator from './WhatIfSimulator.jsx'

export default function FinancialProjection() {
  const { state } = useApp()

  const currentMonth = todayIso().slice(0, 7)
  let remaining = state.loans.reduce((s, l) => s + Math.max(0, totalScheduledFor(l) - (l.paid || 0)), 0)
  const currentSalary = Number(state.config?.currentSalary || 0)
  const newSalary = Number(state.config?.newSalary || currentSalary)
  const switchDate = new Date(state.config?.newSalaryStartDate || Date.now())

  const data = []
  let savings = 0
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() + i)
    // EMI varies per month for phased loans
    const monthKey = d.toISOString().slice(0, 7)
    const monthEmi = state.loans.reduce((s, l) => s + currentEmiFor(l, monthKey), 0)
    const salary = d >= switchDate ? newSalary : currentSalary
    const debt = Math.max(0, remaining)
    if (remaining > 0) {
      remaining = Math.max(0, remaining - monthEmi)
    } else {
      savings += salary * 0.6
    }
    data.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      Debt: Math.round(debt),
      Savings: Math.round(savings),
      Salary: salary
    })
  }

  const debtFreeIdx = data.findIndex(d => d.Debt === 0)

  return (
    <div className="space-y-4">
      <DebtFreeCountdown />

      <div className="card">
        <div className="font-semibold text-slate-100 mb-1">24-month projection</div>
        <div className="text-xs text-slate-400 mb-2">Debt drops → savings start accumulating</div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="dbt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2b4a" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => formatInr(v, { compact: true })} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1f2b4a', borderRadius: 12 }}
                formatter={v => formatInr(v)}
              />
              {debtFreeIdx > -1 && (
                <ReferenceLine
                  x={data[debtFreeIdx].month}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: 'Debt-free', position: 'top', fill: '#818cf8', fontSize: 11 }}
                />
              )}
              <Area type="monotone" dataKey="Debt" stroke="#ef4444" fill="url(#dbt)" strokeWidth={2} />
              <Area type="monotone" dataKey="Savings" stroke="#22c55e" fill="url(#sav)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Assumes 60% of post-debt salary flows to savings. Adjust in the budget split.
        </div>
      </div>

      <WhatIfSimulator />
    </div>
  )
}
