import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useSync } from '../../context/SyncContext.jsx'
import Modal from '../shared/Modal.jsx'
import ReminderForm from './ReminderForm.jsx'
import { useToast } from '../shared/Toast.jsx'
import { ensurePermission, scheduleAll } from '../../services/notifications.js'
import { formatInr } from '../../utils/format.js'
import { fmtDate, daysBetween, todayIso, advanceByRecurrence } from '../../utils/date.js'

export default function ReminderCalendar() {
  const { state, dispatch } = useApp()
  const { syncNow, status: syncStatus } = useSync()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  async function saveAndSync() {
    try {
      await syncNow()
      toast.success('Saved to sheet')
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    }
  }

  useEffect(() => {
    if (permission === 'granted') scheduleAll(state.reminders || [])
  }, [permission, state.reminders])

  async function askPerm() {
    const result = await ensurePermission()
    setPermission(result)
    if (result === 'granted') toast.success('Notifications enabled')
    else if (result === 'denied') toast.error('Notifications blocked in browser settings')
  }

  function save(r) {
    if (editing === 'new') dispatch({ type: 'REMINDER_ADD', r })
    else dispatch({ type: 'REMINDER_UPDATE', r: { ...editing, ...r } })
    setEditing(null)
  }

  function categoryForReminderType(type) {
    const map = {
      Mobile: 'Mobile',
      Insurance: 'Medicines',
      LIC: 'Investment',
      Investment: 'Investment',
      EMI: 'EMI',
      Birthday: 'Family',
      Anniversary: 'Family',
      'Function/Event': 'Family',
      Bill: 'Home'
    }
    return map[type] || 'Other'
  }

  function markPaid(r) {
    const amount = Number(r.amount) || 0
    const nextDate = advanceByRecurrence(r.date, r.recurrence, r.validityDays)
    const moved = nextDate !== r.date
    const confirmMsg = `Mark "${r.title}" as paid today for ${formatInr(amount, { precise: true })}?` +
      (moved ? `\nNext due moves to ${fmtDate(nextDate)}.` : '\n(One-time — reminder will not auto-advance.)')
    if (!confirm(confirmMsg)) return
    dispatch({
      type: 'TX_ADD',
      tx: {
        date: today,
        type: 'expense',
        category: categoryForReminderType(r.type),
        subcategory: ['LIC', 'Investment'].includes(r.type) ? r.title : '',
        amount,
        account: r.account || '',
        note: 'Paid: ' + r.title
      }
    })
    if (moved) dispatch({ type: 'REMINDER_UPDATE', r: { ...r, date: nextDate } })
    toast.success(moved ? 'Paid and rescheduled' : 'Logged as paid')
  }

  const sorted = [...(state.reminders || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const today = todayIso()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="label">Reminders</div>
          <div className="text-xl font-bold text-slate-50">{sorted.length} total</div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost border border-good/30 text-good !px-3 !py-2 text-sm"
            onClick={saveAndSync}
            disabled={syncStatus === 'pushing' || syncStatus === 'pulling'}
            title="Force-save all changes to Google Sheets right now"
          >
            {syncStatus === 'pushing' || syncStatus === 'pulling' ? 'Saving…' : '💾 Save'}
          </button>
          <button className="btn-primary" onClick={() => setEditing('new')}>+ Add</button>
        </div>
      </div>

      {permission !== 'granted' && permission !== 'unsupported' && (
        <div className="card bg-warn/10 border-warn/30">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-warn">
              Enable browser notifications to get a ping on the day of each reminder.
            </div>
            <button className="btn-ghost" onClick={askPerm}>Enable</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          No reminders yet. Add LIC, insurance, EMIs, birthdays.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(r => {
            const days = r.date ? daysBetween(today, r.date) : null
            const tone = days == null ? 'text-slate-500'
              : days < 0 ? 'text-bad'
              : days <= 3 ? 'text-warn'
              : 'text-good'
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate">{r.title}</span>
                      <span className="chip bg-ink-800 text-slate-300">{r.type || 'Reminder'}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {fmtDate(r.date)} · {r.recurrence}
                      {r.amount > 0 && <> · {formatInr(r.amount)}</>}
                    </div>
                    {r.notes && <div className="text-xs text-slate-500 mt-1">{r.notes}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={'text-xs font-medium ' + tone}>
                      {days == null ? '—' :
                        days < 0 ? `${-days}d ago` :
                        days === 0 ? 'Today' : `in ${days}d`}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost !px-2 !py-1 text-xs text-good"
                        onClick={() => markPaid(r)}
                        title="Mark paid today + log transaction + advance date"
                      >✓ Paid</button>
                      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => setEditing(r)}>Edit</button>
                      <button
                        className="btn-ghost !px-2 !py-1 text-xs text-bad"
                        onClick={() => confirm(`Delete "${r.title}"?`) && dispatch({ type: 'REMINDER_DELETE', id: r.id })}
                      >×</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add reminder' : 'Edit reminder'}
        onClose={() => setEditing(null)}
      >
        <ReminderForm
          initial={editing === 'new' ? null : editing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </div>
  )
}
