import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { todayIso } from '../../utils/date.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

function project(remaining, monthly, label) {
  const data = []
  let r = remaining
  let i = 0
  while (r > 0 && i < 120) {
    data.push({ month: i, [label]: Math.round(r) })
    r -= monthly
    i++
    if (monthly <= 0) break
  }
  data.push({ month: i, [label]: 0 })
  return data
}

function merge(a, b) {
  const max = Math.max(a.length, b.length)
  const out = []
  for (let i = 0; i < max; i++) {
    out.push({ month: i, ...(a[i] || {}), ...(b[i] || {}) })
  }
  return out
}

export default function WhatIfSimulator() {
  const { state } = useApp()
  const currentMonth = todayIso().slice(0, 7)
  const remaining = state.loans.reduce(
    (s, l) => s + Math.max(0, totalScheduledFor(l) - (l.paid || 0)),
    0
  )
  const baseEmi = state.loans.reduce((s, l) => s + currentEmiFor(l, currentMonth), 0)
  const [extra, setExtra] = useState(0)

  const data = useMemo(() => {
    const base = project(remaining, baseEmi, 'Base')
    const accel = project(remaining, baseEmi + Number(extra || 0), 'Accelerated')
    return merge(base, accel)
  }, [remaining, baseEmi, extra])

  const baseMonths = baseEmi > 0 ? Math.ceil(remaining / baseEmi) : null
  const accelMonths = baseEmi + Number(extra) > 0
    ? Math.ceil(remaining / (baseEmi + Number(extra)))
    : null
  const saved = baseMonths != null && accelMonths != null ? baseMonths - accelMonths : null

  return (
    <div className="card">
      <div className="font-semibold text-slate-100 mb-2">What if I pay extra?</div>
      <label className="block">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-300">Extra per month</span>
          <span className="text-slate-100 font-semibold">{formatInr(extra)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(baseEmi * 2, 50000)}
          step="500"
          value={extra}
          onChange={e => setExtra(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
      </label>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <Cell label="Base" value={baseMonths != null ? `${baseMonths} mo` : '—'} />
        <Cell label="With extra" value={accelMonths != null ? `${accelMonths} mo` : '—'} />
        <Cell label="Saved" value={saved != null ? `${saved} mo` : '—'} tone={saved > 0 ? 'text-good' : 'text-slate-100'} />
      </div>

      <div className="h-56 mt-3">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1f2b4a" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickFormatter={v => `M${v}`} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={v => formatInr(v, { compact: true })} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1f2b4a', borderRadius: 12 }}
              formatter={v => formatInr(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Base" stroke="#94a3b8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Accelerated" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Cell({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg bg-ink-800 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={'text-sm font-semibold mt-0.5 ' + tone}>{value}</div>
    </div>
  )
}
