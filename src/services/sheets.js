const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function readSheet({ sheetId, apiKey, tab }) {
  if (!sheetId || !apiKey) throw new Error('Sheet ID or API key missing')
  const url = `${BASE}/${sheetId}/values/${encodeURIComponent(tab)}?key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sheets read failed (${res.status}): ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.values || []
}

export async function writeSheet({ webhookUrl, secret, sheetId, tab, values }) {
  if (!webhookUrl) throw new Error('Sheets webhook not configured')
  const res = await fetch(webhookUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret, sheetId, tab, values })
  })
  if (!res.ok) {
    throw new Error(`Sheets write failed (${res.status})`)
  }
  const out = await res.json()
  if (!out.ok) throw new Error(`Apps Script: ${out.error}`)
  return out
}

function sortLoans(loans) {
  const order = { active: 0, informal: 1, closed: 2 }
  return [...loans].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
}

function serializePhases(phases) {
  if (!phases || !phases.length) return ''
  try { return JSON.stringify(phases) } catch { return '' }
}

function deserializePhases(s) {
  if (!s || typeof s !== 'string') return []
  try {
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function loansToRows(loans) {
  return [
    ['Name', 'Kind', 'Principal', 'AmountPaid', 'EMI', 'DueDate', 'EndDate', 'Source', 'Status', 'Phases'],
    ...sortLoans(loans).map(l => [
      l.name, l.kind || 'standard',
      l.principal, l.paid, l.emi,
      l.dueDate || '', l.endDate || '',
      l.source || '', l.status,
      serializePhases(l.phases)
    ])
  ]
}

export function rowsToLoans(rows) {
  if (!rows || rows.length < 2) return []
  const [, ...data] = rows
  return data.filter(r => r[0]).map((r, i) => ({
    id: i + 1,
    name: r[0] || '',
    kind: r[1] || 'standard',
    principal: Number(r[2]) || 0,
    paid: Number(r[3]) || 0,
    emi: Number(r[4]) || 0,
    dueDate: r[5] || null,
    endDate: r[6] || null,
    source: r[7] || '',
    status: r[8] || 'active',
    phases: deserializePhases(r[9])
  }))
}

function sortTransactionsDesc(txs) {
  return [...txs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function transactionsToRows(txs) {
  return [
    ['Date', 'Category', 'Subcategory', 'Amount', 'Note', 'Type', 'Account'],
    ...sortTransactionsDesc(txs).map(t => [t.date, t.category, t.subcategory || '', t.amount, t.note || '', t.type, t.account || ''])
  ]
}

export function rowsToTransactions(rows) {
  if (!rows || rows.length < 2) return []
  const [, ...data] = rows
  return data.filter(r => r[0]).map((r, i) => ({
    id: i + 1,
    date: r[0],
    category: r[1] || '',
    subcategory: r[2] || '',
    amount: Number(r[3]) || 0,
    note: r[4] || '',
    type: r[5] || 'expense',
    account: r[6] || ''
  }))
}

export function accountsToRows(accounts, transactions = []) {
  function currentBalance(a) {
    const opening = Number(a.openingBalance) || 0
    const openingDate = a.openingDate || ''
    let delta = 0
    transactions.forEach(t => {
      if (t.account !== a.name) return
      if (openingDate && t.date < openingDate) return
      const amt = Number(t.amount) || 0
      delta += t.type === 'income' ? amt : -amt
    })
    return opening + delta
  }
  return [
    ['Name', 'Type', 'OpeningBalance', 'OpeningDate', 'CurrentBalance', 'Notes'],
    ...accounts.map(a => [a.name, a.type || 'bank', a.openingBalance || 0, a.openingDate || '', currentBalance(a), a.notes || ''])
  ]
}

export function rowsToAccounts(rows) {
  if (!rows || rows.length < 2) return []
  const [, ...data] = rows
  // Header may have either old (5 cols) or new (6 cols with CurrentBalance) schema.
  // Notes lives in r[5] in new schema, r[4] in old. CurrentBalance is computed-only — never read back.
  return data.filter(r => r[0]).map((r, i) => ({
    id: i + 1,
    name: r[0] || '',
    type: r[1] || 'bank',
    openingBalance: Number(r[2]) || 0,
    openingDate: r[3] || '',
    notes: (r[5] !== undefined ? r[5] : r[4]) || ''
  }))
}

function sortRemindersAsc(rs) {
  return [...rs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

export function remindersToRows(rs) {
  return [
    ['Title', 'Date', 'RecurrenceType', 'Amount', 'Type', 'ValidityDays', 'Account', 'Notes'],
    ...sortRemindersAsc(rs).map(r => [r.title, r.date, r.recurrence, r.amount, r.type || '', r.validityDays || '', r.account || '', r.notes || ''])
  ]
}

export function rowsToReminders(rows) {
  if (!rows || rows.length < 2) return []
  const [, ...data] = rows
  return data.filter(r => r[0]).map((r, i) => ({
    id: i + 1,
    title: r[0],
    date: r[1],
    recurrence: r[2] || 'once',
    amount: Number(r[3]) || 0,
    type: r[4] || '',
    validityDays: Number(r[5]) || 0,
    account: r[6] || '',
    notes: r[7] || ''
  }))
}

export function budgetToRows(budget) {
  const rows = [['Month', 'Category', 'Budgeted', 'Actual']]
  Object.entries(budget || {}).forEach(([month, cats]) => {
    Object.entries(cats || {}).forEach(([cat, v]) => {
      rows.push([month, cat, v.budgeted || 0, v.actual || 0])
    })
  })
  return rows
}

export function rowsToBudget(rows) {
  const out = {}
  if (!rows || rows.length < 2) return out
  const [, ...data] = rows
  data.forEach(r => {
    if (!r[0] || !r[1]) return
    const month = r[0], cat = r[1]
    out[month] = out[month] || {}
    out[month][cat] = { budgeted: Number(r[2]) || 0, actual: Number(r[3]) || 0 }
  })
  return out
}

export function configToRows(config) {
  const rows = [['Key', 'Value']]
  const flat = flatten(config)
  Object.entries(flat).forEach(([k, v]) => rows.push([k, String(v)]))
  return rows
}

export function rowsToConfig(rows) {
  const out = {}
  if (!rows || rows.length < 2) return out
  const [, ...data] = rows
  data.forEach(r => {
    if (!r[0]) return
    out[r[0]] = r[1]
  })
  return unflatten(out)
}

function flatten(obj, prefix = '', acc = {}) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, acc)
    else acc[key] = v
  })
  return acc
}

function unflatten(flat) {
  const out = {}
  Object.entries(flat).forEach(([k, v]) => {
    const parts = k.split('.')
    let cur = out
    parts.forEach((p, i) => {
      if (i === parts.length - 1) {
        const num = Number(v)
        cur[p] = !Number.isNaN(num) && v !== '' && /^-?\d+(\.\d+)?$/.test(v) ? num : v
      } else {
        cur[p] = cur[p] || {}
        cur = cur[p]
      }
    })
  })
  return out
}
