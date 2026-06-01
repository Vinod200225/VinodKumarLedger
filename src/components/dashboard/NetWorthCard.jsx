import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { todayIso } from '../../utils/date.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'

export default function NetWorthCard() {
  const { state } = useApp()
  const activeLoans = state.loans.filter(l => l.status === 'active')
  const currentMonth = todayIso().slice(0, 7)

  const totalDebt = state.loans.reduce((s, l) => {
    if (l.kind === 'revolving') return s + Math.max(0, l.principal || 0)
    return s + Math.max(0, totalScheduledFor(l) - (l.paid || 0))
  }, 0)

  const fixedEmi = activeLoans
    .filter(l => l.kind !== 'revolving')
    .reduce((s, l) => s + currentEmiFor(l, currentMonth), 0)

  const revolvingMin = activeLoans
    .filter(l => l.kind === 'revolving')
    .reduce((s, l) => s + Number(l.emi || 0), 0)

  return (
    <div className="card relative overflow-hidden border-bad/40 bg-gradient-to-br from-bad/15 via-ink-900 to-ink-900">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-bad/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-bad font-bold">⚠ Total outstanding debt</span>
        </div>
        <div className="mt-1 text-5xl sm:text-6xl font-extrabold text-slate-50 tabular-nums leading-none">
          {formatInr(totalDebt)}
        </div>
        <div className="text-xs text-bad/80 mt-2 font-medium">
          Work hard. Clear it. Then build.
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-ink-800/80 px-3 py-2 border border-ink-700">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Fixed EMI</div>
            <div className="text-base font-semibold text-slate-100 tabular-nums">{formatInr(fixedEmi)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">monthly</div>
          </div>
          <div className="rounded-xl bg-ink-800/80 px-3 py-2 border border-ink-700">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Revolving min</div>
            <div className="text-base font-semibold text-warn tabular-nums">{formatInr(revolvingMin)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">net varies</div>
          </div>
          <div className="rounded-xl bg-ink-800/80 px-3 py-2 border border-ink-700">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Active</div>
            <div className="text-base font-semibold text-slate-100 tabular-nums">{activeLoans.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">loans</div>
          </div>
        </div>
      </div>
    </div>
  )
}
