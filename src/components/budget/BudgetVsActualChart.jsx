import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatInr } from '../../utils/format.js'

export default function BudgetVsActualChart({ month, categories }) {
  const data = (categories || []).map(c => ({
    name: c.name,
    Budgeted: c.budgeted || 0,
    Actual: c.actual || 0
  }))

  if (!data.length) {
    return (
      <div className="card text-center text-sm text-slate-400">
        Set a budget for any category to see the chart.
      </div>
    )
  }

  return (
    <div className="card">
      <div className="font-semibold text-slate-100 mb-1">Budget vs Actual</div>
      <div className="text-xs text-slate-400 mb-3">{month}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2b4a" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => formatInr(v, { compact: true })} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1f2b4a', borderRadius: 12 }}
              formatter={v => formatInr(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Budgeted" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Actual" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
