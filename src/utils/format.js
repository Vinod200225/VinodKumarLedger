export function formatInr(value, { compact = false, precise = false } = {}) {
  const n = Number(value || 0)
  if (compact && Math.abs(n) >= 100000) {
    if (Math.abs(n) >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr'
    return '₹' + (n / 100000).toFixed(2) + ' L'
  }
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: precise ? 2 : 0 })
}

export function formatPercent(value, digits = 0) {
  return Number(value || 0).toFixed(digits) + '%'
}

export function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}
