import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr, pct } from '../../utils/format.js'
import { fmtDate, daysBetween, todayIso, monthsBetween } from '../../utils/date.js'
import { currentEmiFor, currentPhase, nextPhase, totalScheduledFor } from '../../utils/loanPhases.js'

function healthFor(dueDate, status) {
  if (status !== 'active' || !dueDate) return { color: 'bg-ink-700 text-slate-300', label: status === 'informal' ? 'Informal' : 'No date' }
  const days = daysBetween(todayIso(), dueDate)
  if (days < 0)  return { color: 'bg-bad/20 text-bad',  label: `Overdue ${-days}d` }
  if (days <= 7) return { color: 'bg-warn/20 text-warn', label: `Due in ${days}d` }
  return { color: 'bg-good/20 text-good', label: `Due in ${days}d` }
}

export default function LoanCard({ loan, onEdit, onDelete, onRecordPayment, onPayEmi }) {
  const { state } = useApp()
  const isRevolving = loan.kind === 'revolving'
  const currentMonth = todayIso().slice(0, 7)
  const hasPhases = Array.isArray(loan.phases) && loan.phases.length > 0
  const scheduledTotal = totalScheduledFor(loan)
  const displayPrincipal = hasPhases ? scheduledTotal : (loan.principal || 0)
  const remaining = Math.max(0, displayPrincipal - (loan.paid || 0))
  const progress = pct(loan.paid || 0, displayPrincipal || 1)
  const thisMonthEmi = currentEmiFor(loan, currentMonth)
  const phase = currentPhase(loan, currentMonth)
  const upcoming = nextPhase(loan, currentMonth)
  const health = healthFor(loan.dueDate, loan.status)

  const linkedTxs = useMemo(() => {
    const name = loan.name || ''
    return (state.transactions || [])
      .filter(t => (t.note || '').startsWith(name + ' '))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [state.transactions, loan.name])

  // Has this month's EMI already been recorded for this loan? If so, hide the
  // "Pay EMI" button until next month (or until that transaction is deleted).
  const emiPaidThisMonth = useMemo(() => {
    if (isRevolving) return false
    const name = loan.name || ''
    return (state.transactions || []).some(t =>
      t.category === 'EMI' &&
      (t.subcategory === name || (t.note || '').startsWith(name)) &&
      (t.date || '').slice(0, 7) === currentMonth
    )
  }, [state.transactions, loan.name, currentMonth, isRevolving])

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100 truncate">{loan.name}</h3>
            {isRevolving && <span className="chip bg-brand-500/20 text-brand-300">Revolving</span>}
            <span className={'chip ' + health.color}>{health.label}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{loan.source || '—'}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="btn-ghost !px-2 !py-1 text-xs">Edit</button>
          <button onClick={onDelete} className="btn-ghost !px-2 !py-1 text-xs text-bad">×</button>
        </div>
      </div>

      {isRevolving ? (
        <>
          <div className="mt-3 rounded-lg bg-gradient-to-br from-bad/10 to-ink-800 px-3 py-2 border border-bad/20">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Current outstanding</div>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">{formatInr(loan.principal, { precise: true })}</div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Min payment: <span className="text-slate-200 font-medium">{formatInr(loan.emi)}</span></span>
            <span>Due: <span className="text-slate-200 font-medium">{fmtDate(loan.dueDate)}</span></span>
          </div>
          {onRecordPayment && loan.status === 'active' && (
            <button
              onClick={onRecordPayment}
              className="btn-primary w-full mt-3 !py-2 text-sm"
            >
              + Record payment
            </button>
          )}
          {linkedTxs.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                Payment history ({linkedTxs.length})
              </summary>
              <div className="mt-2 divide-y divide-ink-800">
                {linkedTxs.map(t => (
                  <div key={t.id} className="py-1.5 flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      {fmtDate(t.date)} · <span className={t.type === 'income' ? 'text-good' : 'text-slate-400'}>
                        {t.type === 'income' ? 'Withdraw' : 'Paid'}
                      </span>
                      {t.note && <span className="text-slate-500"> · {t.note.replace(loan.name + ' ', '')}</span>}
                    </div>
                    <div className={'font-semibold tabular-nums ' + (t.type === 'income' ? 'text-good' : 'text-bad')}>
                      {t.type === 'income' ? '+' : '−'}{formatInr(t.amount, { precise: true })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gradient-to-br from-brand-500/10 to-ink-800 px-3 py-2 border border-brand-500/20">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                {hasPhases ? "This month's EMI" : "Monthly EMI"}
              </div>
              <div className="text-xl font-bold text-brand-300 tabular-nums">{formatInr(thisMonthEmi, { precise: true })}</div>
              {phase && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Phase {phase.index + 1} of {phase.of} · {fmtMonth(phase.startMonth)}–{fmtMonth(phase.endMonth)}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-ink-800 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Remaining</div>
              <div className="text-xl font-bold text-bad tabular-nums">{formatInr(remaining)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total scheduled {formatInr(displayPrincipal)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Paid {formatInr(loan.paid)}</span>
              <span>{progress}% · Total {formatInr(displayPrincipal)}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {upcoming && (
            <div className="mt-2 rounded-lg bg-warn/5 border border-warn/20 px-2.5 py-1.5 text-xs text-warn/90">
              Next phase: <span className="font-semibold">{formatInr(upcoming.amount)}</span>/mo from {fmtMonth(upcoming.startMonth)}
              {upcoming.endMonth !== upcoming.startMonth && <> to {fmtMonth(upcoming.endMonth)}</>}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Next due: <span className="text-slate-200 font-medium">{fmtDate(loan.dueDate)}</span></span>
            {loan.endDate && <span>Ends: <span className="text-slate-200 font-medium">{fmtDate(loan.endDate)}</span></span>}
          </div>

          {hasPhases && (
            <details className="mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                All phases ({loan.phases.length})
              </summary>
              <div className="mt-1.5 space-y-0.5">
                {loan.phases.map((p, i) => {
                  const months = monthsBetween(p.startMonth, p.endMonth)
                  const isCurrent = phase?.index === i
                  return (
                    <div
                      key={i}
                      className={'flex items-center justify-between text-xs px-2 py-1 rounded ' + (isCurrent ? 'bg-brand-500/10 text-brand-200' : 'text-slate-400')}
                    >
                      <span>
                        {fmtMonth(p.startMonth)}{p.endMonth !== p.startMonth && ` – ${fmtMonth(p.endMonth)}`}
                        <span className="text-slate-500"> · {months}mo</span>
                      </span>
                      <span className="tabular-nums">
                        {formatInr(p.amount)}/mo
                        <span className="text-slate-500"> · {formatInr(p.amount * months)}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </details>
          )}

          {onPayEmi && loan.status === 'active' && !emiPaidThisMonth && (
            <button
              onClick={onPayEmi}
              className="btn-primary w-full mt-3 !py-2 text-sm"
            >
              + Pay this month's EMI{thisMonthEmi > 0 && <> · {formatInr(thisMonthEmi)}</>}
            </button>
          )}
          {onPayEmi && loan.status === 'active' && emiPaidThisMonth && (
            <div className="mt-3 rounded-lg bg-good/10 border border-good/30 px-3 py-2 text-sm text-good text-center font-medium">
              ✓ This month's EMI paid
            </div>
          )}
          {linkedTxs.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                Payment history ({linkedTxs.length})
              </summary>
              <div className="mt-2 divide-y divide-ink-800">
                {linkedTxs.map(t => (
                  <div key={t.id} className="py-1.5 flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      {fmtDate(t.date)}
                      {t.note && <span className="text-slate-500"> · {t.note.replace(loan.name + ' ', '')}</span>}
                    </div>
                    <div className="font-semibold tabular-nums text-bad">
                      −{formatInr(t.amount, { precise: true })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
      {loan.endDate && (
        <div className="mt-1 text-xs text-slate-500">
          {loan.status === 'closed' ? 'Closed on' : 'Ends'}: <span className="text-slate-300 font-medium">{fmtDate(loan.endDate)}</span>
        </div>
      )}
    </div>
  )
}

function Cell({ label, value, tone = 'text-slate-100' }) {
  return (
    <div className="rounded-lg bg-ink-800 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={'text-sm font-semibold ' + tone}>{value}</div>
    </div>
  )
}

function fmtMonth(monthKey) {
  if (!monthKey) return '—'
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}
