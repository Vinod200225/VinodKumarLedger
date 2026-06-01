import { monthsBetween } from './date.js'

// A "phase" is { startMonth: 'YYYY-MM', endMonth: 'YYYY-MM', amount: number }

export function totalScheduledFor(loan) {
  if (loan?.phases?.length) {
    return loan.phases.reduce((s, p) => s + Number(p.amount || 0) * monthsBetween(p.startMonth, p.endMonth), 0)
  }
  return Number(loan?.principal || 0)
}

export function currentEmiFor(loan, monthKey) {
  if (!loan?.phases?.length) return Number(loan?.emi || 0)
  // exact match — phase covering this month
  const exact = loan.phases.find(p => p.startMonth <= monthKey && monthKey <= p.endMonth)
  if (exact) return Number(exact.amount || 0)
  // before any phase starts → first upcoming phase
  const upcoming = loan.phases.find(p => p.startMonth > monthKey)
  if (upcoming) return Number(upcoming.amount || 0)
  // all phases past → last phase amount as informational fallback
  return Number(loan.phases[loan.phases.length - 1]?.amount || 0)
}

export function currentPhase(loan, monthKey) {
  if (!loan?.phases?.length) return null
  let idx = loan.phases.findIndex(p => p.startMonth <= monthKey && monthKey <= p.endMonth)
  if (idx === -1) {
    // fallback to upcoming
    idx = loan.phases.findIndex(p => p.startMonth > monthKey)
  }
  if (idx === -1) idx = loan.phases.length - 1
  return { ...loan.phases[idx], index: idx, of: loan.phases.length }
}

export function nextPhase(loan, monthKey) {
  if (!loan?.phases?.length) return null
  const next = loan.phases.find(p => p.startMonth > monthKey)
  return next || null
}

export function lastEndMonth(loan) {
  if (!loan?.phases?.length) return null
  return loan.phases[loan.phases.length - 1].endMonth
}
