export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function monthKey(d = new Date()) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toISOString().slice(0, 7)
}

export function daysBetween(a, b) {
  const dA = typeof a === 'string' ? new Date(a) : a
  const dB = typeof b === 'string' ? new Date(b) : b
  return Math.round((dB - dA) / 86400000)
}

export function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtShortDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export function addDays(isoOrDate, n) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : new Date(isoOrDate)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function advanceByRecurrence(isoDate, recurrence, validityDays) {
  if (validityDays && validityDays > 0) return addDays(isoDate, validityDays)
  const months = { monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 }[recurrence]
  if (!months) return isoDate
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// Inclusive month count between two YYYY-MM keys. monthsBetween("2026-06","2026-11") = 6.
export function monthsBetween(startKey, endKey) {
  if (!startKey || !endKey) return 0
  const [sy, sm] = startKey.split('-').map(Number)
  const [ey, em] = endKey.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm) + 1
}
