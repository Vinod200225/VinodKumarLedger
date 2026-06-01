import { useApp } from '../../context/AppContext.jsx'
import { daysBetween, todayIso, fmtDate } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'
import { currentEmiFor, totalScheduledFor } from '../../utils/loanPhases.js'

export default function DebtFreeCountdown() {
  const { state } = useApp()
  const goal = state.config?.debtFreeGoal
  const currentMonth = todayIso().slice(0, 7)
  const totalEmi = state.loans.reduce((s, l) => s + currentEmiFor(l, currentMonth), 0)
  const remaining = state.loans.reduce(
    (s, l) => s + Math.max(0, totalScheduledFor(l) - (l.paid || 0)),
    0
  )
  const monthsAtEmi = totalEmi > 0 ? Math.ceil(remaining / totalEmi) : null
  const days = goal ? daysBetween(todayIso(), goal) : null
  const onTrack = monthsAtEmi != null && days != null ? monthsAtEmi * 30 <= days : null

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-100">Debt-free countdown</div>
        {onTrack != null && (
          <span className={'chip ' + (onTrack ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad')}>
            {onTrack ? 'On track' : 'Behind'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <Cell label="Remaining" value={formatInr(remaining, { compact: true })} />
        <Cell label="Months @ EMI" value={monthsAtEmi != null ? `${monthsAtEmi} mo` : '—'} />
        <Cell label="Goal" value={goal ? fmtDate(goal) : '—'} />
      </div>
      {days != null && (
        <div className="text-xs text-slate-400 mt-3">
          {days > 0
            ? `${days} days until goal date.`
            : `Goal date was ${-days} days ago.`}
        </div>
      )}
    </div>
  )
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg bg-ink-800 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-100 mt-0.5">{value}</div>
    </div>
  )
}
