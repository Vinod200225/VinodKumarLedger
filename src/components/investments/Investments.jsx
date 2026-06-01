import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { fmtDate } from '../../utils/date.js'

export default function Investments() {
  const { state } = useApp()

  const groups = useMemo(() => {
    const investmentTxs = (state.transactions || []).filter(
      t => t.category === 'Investment' && t.type === 'expense'
    )
    const bySubcat = {}
    investmentTxs.forEach(t => {
      const key = t.subcategory || 'Unspecified'
      if (!bySubcat[key]) bySubcat[key] = []
      bySubcat[key].push(t)
    })
    return Object.entries(bySubcat)
      .map(([name, txs]) => {
        const sorted = [...txs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        const total = sorted.reduce((s, t) => s + Number(t.amount || 0), 0)
        return { name, total, payments: sorted, count: sorted.length, lastPayment: sorted[0] }
      })
      .sort((a, b) => b.total - a.total)
  }, [state.transactions])

  const grandTotal = groups.reduce((s, g) => s + g.total, 0)

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="label">Total invested (all time)</div>
        <div className="text-3xl font-bold text-slate-50 mt-1">{formatInr(grandTotal, { precise: true })}</div>
        <div className="text-xs text-slate-400 mt-1">
          Sum of all entries with category <span className="text-slate-200">Investment</span>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="card text-center text-slate-400 text-sm py-8">
          No investments logged yet.<br />
          Go to <span className="text-brand-400 font-medium">Daily</span> → add an entry with category <span className="text-slate-200">Investment</span> and specify which one (e.g. <span className="text-slate-200">LIC Policy 1</span>).
        </div>
      )}

      {groups.map(g => (
        <InvestmentCard key={g.name} group={g} />
      ))}
    </div>
  )
}

function InvestmentCard({ group }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-100">{group.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {group.count} payment{group.count === 1 ? '' : 's'}
            {group.lastPayment && ` · last on ${fmtDate(group.lastPayment.date)}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Total invested</div>
          <div className="text-lg font-bold text-good">{formatInr(group.total, { precise: true })}</div>
        </div>
      </div>

      <details className="mt-3">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
          View payment history ({group.payments.length})
        </summary>
        <div className="mt-2 divide-y divide-ink-800">
          {group.payments.map(p => (
            <div key={p.id} className="py-1.5 flex items-center justify-between text-sm">
              <div className="text-slate-300">
                {fmtDate(p.date)}
                {p.note && <span className="text-slate-500"> · {p.note}</span>}
              </div>
              <div className="text-slate-100 font-medium tabular-nums">
                {formatInr(p.amount, { precise: true })}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
