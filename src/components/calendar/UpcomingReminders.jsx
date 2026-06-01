import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { fmtShortDate, daysBetween, todayIso } from '../../utils/date.js'

export default function UpcomingReminders({ limit = 5, basePath }) {
  const { state } = useApp()
  const today = todayIso()
  const upcoming = [...(state.reminders || [])]
    .filter(r => r.date && daysBetween(today, r.date) >= -1)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-100">Upcoming</div>
        {basePath && (
          <Link to={`${basePath}/calendar`} className="text-xs text-brand-400 hover:underline">
            View all →
          </Link>
        )}
      </div>
      {upcoming.length === 0 ? (
        <div className="text-sm text-slate-400">Nothing scheduled.</div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {upcoming.map(r => {
            const days = daysBetween(today, r.date)
            const tone = days < 0 ? 'text-bad' : days <= 3 ? 'text-warn' : 'text-slate-300'
            return (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-slate-100 truncate">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.type || 'Reminder'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={'text-xs font-medium ' + tone}>
                    {fmtShortDate(r.date)} · {days < 0 ? `${-days}d ago` : days === 0 ? 'Today' : `in ${days}d`}
                  </div>
                  {r.amount > 0 && <div className="text-xs text-slate-400">{formatInr(r.amount)}</div>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
