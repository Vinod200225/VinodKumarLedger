// Lightweight client-side reminder scheduler.
// Uses the Notification API directly (no server push needed for a personal PWA).
// Reminders are re-scheduled on every app load.

const TIMERS = new Map()

export async function ensurePermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function clearAllScheduled() {
  TIMERS.forEach(t => clearTimeout(t))
  TIMERS.clear()
}

export function scheduleReminder(reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!reminder?.date) return
  const target = new Date(reminder.date + 'T09:00:00')
  const ms = target.getTime() - Date.now()
  if (ms <= 0 || ms > 2147483647) return
  const id = setTimeout(() => {
    new Notification(reminder.title || 'Reminder', {
      body: reminder.notes || (reminder.amount ? `₹${reminder.amount}` : ''),
      icon: '/ledger/icons/192.png',
      tag: 'ledger-' + reminder.id
    })
    TIMERS.delete(reminder.id)
  }, ms)
  TIMERS.set(reminder.id, id)
}

export function scheduleAll(reminders) {
  clearAllScheduled()
  reminders.forEach(scheduleReminder)
}
