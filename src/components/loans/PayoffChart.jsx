import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatInr } from '../../utils/format.js'
import { todayIso } from '../../utils/date.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'

export default function PayoffChart({ loans }) {
  const currentMonth = todayIso().slice(0, 7)
  const totalEmi = loans.reduce((s, l) => s + currentEmiFor(l, currentMonth), 0)
  let remaining = loans.reduce((s, l) => s + Math.max(0, totalScheduledFor(l) - (l.paid || 0)), 0)
  const data = []
  let i = 0
  const start = new Date()
  while (remaining > 0 && i < 60) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    const monthKey = d.toISOString().slice(0, 7)
    const monthEmi = loans.reduce((s, l) => s + currentEmiFor(l, monthKey), 0)
    data.push({ month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), debt: Math.round(remaining) })
    remaining -= monthEmi
    i++
    if (monthEmi <= 0) break
  }
  data.push({ month: 'Done', debt: 0 })

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-100">Combined payoff timeline</div>
        <div className="text-xs text-slate-400">{formatInr(totalEmi)}/mo</div>
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2b4a" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => formatInr(v, { compact: true })} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1f2b4a', borderRadius: 12 }}
              formatter={v => formatInr(v)}
            />
            <Line type="monotone" dataKey="debt" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
