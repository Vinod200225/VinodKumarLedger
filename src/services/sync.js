import {
  readSheet,
  writeSheet,
  loansToRows, rowsToLoans,
  transactionsToRows, rowsToTransactions,
  remindersToRows, rowsToReminders,
  budgetToRows, rowsToBudget,
  configToRows, rowsToConfig,
  accountsToRows, rowsToAccounts
} from './sheets.js'
import { SHEET_TABS } from '../config/constants.js'

function credsFor(view) {
  if (view === 'real') {
    return {
      sheetId: import.meta.env.VITE_REAL_SHEET_ID,
      apiKey: import.meta.env.VITE_REAL_SHEET_API_KEY,
      webhookUrl: import.meta.env.VITE_REAL_SHEETS_WEBHOOK,
      secret: import.meta.env.VITE_SHEETS_WEBHOOK_SECRET
    }
  }
  return {
    sheetId: import.meta.env.VITE_PUBLIC_SHEET_ID,
    apiKey: import.meta.env.VITE_PUBLIC_SHEET_API_KEY,
    webhookUrl: import.meta.env.VITE_PUBLIC_SHEETS_WEBHOOK,
    secret: import.meta.env.VITE_SHEETS_WEBHOOK_SECRET
  }
}

// ── Mirroring to the OTHER view's sheet ──────────────────────────────────────
// Every add/edit/delete is reflected in the other sheet so both stay in sync.
// This is operation-based (read → apply one change → write) and keyed by the
// stable Id column, so it preserves all other rows and the two sheets can safely
// diverge later. It NEVER does a blind full-state overwrite of the other sheet.

const ENTITY_CONVERTERS = {
  [SHEET_TABS.TRANSACTIONS]: { to: transactionsToRows, from: rowsToTransactions },
  [SHEET_TABS.LOANS]:        { to: loansToRows,        from: rowsToLoans },
  [SHEET_TABS.REMINDERS]:    { to: remindersToRows,    from: rowsToReminders },
  [SHEET_TABS.ACCOUNTS]:     { to: accountsToRows,     from: rowsToAccounts }
}

// Serialize all mirror writes so two quick ops on the same tab (e.g. a transfer's
// two legs) can't read the same snapshot and clobber each other.
let mirrorChain = Promise.resolve()

export function mirrorOp(args) {
  const run = () => doMirrorOp(args)
  const p = mirrorChain.then(run, run)
  mirrorChain = p.catch(() => {})   // keep the chain alive even if one op fails
  return p                          // caller still sees this op's success/failure
}

async function doMirrorOp({ currentView, tab, op, item, id }) {
  const otherView = currentView === 'real' ? 'public' : 'real'
  const creds = credsFor(otherView)
  // If the other view isn't configured, silently skip — nothing to mirror to.
  if (!creds.sheetId || !creds.apiKey || !creds.webhookUrl || !creds.secret) return
  const conv = ENTITY_CONVERTERS[tab]
  if (!conv) return

  const rows = await readSheet({ sheetId: creds.sheetId, apiKey: creds.apiKey, tab })
  const list = conv.from(rows)
  const matchId = String(op === 'delete' ? id : item?.id)

  let next
  if (op === 'add') {
    if (list.some(e => String(e.id) === matchId)) return   // already mirrored — idempotent
    next = [...list, item]
  } else if (op === 'update') {
    let found = false
    next = list.map(e => {
      if (String(e.id) === matchId) { found = true; return { ...e, ...item } }
      return e
    })
    if (!found) next = [...next, item]                     // not there yet → add so views converge
  } else if (op === 'delete') {
    next = list.filter(e => String(e.id) !== matchId)
  } else {
    return
  }

  if (tab === SHEET_TABS.ACCOUNTS) {
    // Accounts rows include a computed CurrentBalance derived from that sheet's own
    // transactions, so read them to keep the column meaningful.
    const txRows = await readSheet({ sheetId: creds.sheetId, apiKey: creds.apiKey, tab: SHEET_TABS.TRANSACTIONS })
    await writeSheet({
      webhookUrl: creds.webhookUrl, secret: creds.secret, sheetId: creds.sheetId,
      tab, values: accountsToRows(next, rowsToTransactions(txRows))
    })
  } else {
    await writeSheet({
      webhookUrl: creds.webhookUrl, secret: creds.secret, sheetId: creds.sheetId,
      tab, values: conv.to(next)
    })
  }
}

export async function pullAll(creds) {
  const { sheetId, apiKey } = creds
  const safe = async (tab) => {
    try { return await readSheet({ sheetId, apiKey, tab }) }
    catch { return [] }
  }
  const [loans, txs, reminders, budget, config, accounts] = await Promise.all([
    safe(SHEET_TABS.LOANS),
    safe(SHEET_TABS.TRANSACTIONS),
    safe(SHEET_TABS.REMINDERS),
    safe(SHEET_TABS.BUDGET),
    safe(SHEET_TABS.CONFIG),
    safe(SHEET_TABS.ACCOUNTS)
  ])
  return {
    loans: rowsToLoans(loans),
    transactions: rowsToTransactions(txs),
    reminders: rowsToReminders(reminders),
    budget: rowsToBudget(budget),
    config: rowsToConfig(config),
    accounts: rowsToAccounts(accounts)
  }
}

export async function pushAll(creds, state) {
  const { sheetId, webhookUrl, secret } = creds
  const send = (tab, values) => writeSheet({ webhookUrl, secret, sheetId, tab, values })
  await Promise.all([
    send(SHEET_TABS.LOANS,        loansToRows(state.loans)),
    send(SHEET_TABS.TRANSACTIONS, transactionsToRows(state.transactions)),
    send(SHEET_TABS.REMINDERS,    remindersToRows(state.reminders)),
    send(SHEET_TABS.BUDGET,       budgetToRows(state.budget)),
    send(SHEET_TABS.CONFIG,       configToRows(state.config)),
    send(SHEET_TABS.ACCOUNTS,     accountsToRows(state.accounts || [], state.transactions || []))
  ])
}

export function makeDebouncedPush(creds, getState, { delay = 1000 } = {}) {
  let timer = null
  let pending = null
  return function trigger(onDone) {
    if (timer) clearTimeout(timer)
    pending = onDone
    timer = setTimeout(async () => {
      timer = null
      const cb = pending
      pending = null
      try {
        await pushAll(creds, getState())
        cb?.(null)
      } catch (err) {
        cb?.(err)
      }
    }, delay)
  }
}
