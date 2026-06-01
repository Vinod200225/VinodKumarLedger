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

export async function mirrorTransactionToOtherView({ currentView, tx }) {
  const otherView = currentView === 'real' ? 'public' : 'real'
  const creds = credsFor(otherView)
  if (!creds.sheetId || !creds.apiKey || !creds.webhookUrl || !creds.secret) {
    throw new Error(`Cannot mirror to ${otherView}: missing credentials`)
  }
  const existingRows = await readSheet({ sheetId: creds.sheetId, apiKey: creds.apiKey, tab: SHEET_TABS.TRANSACTIONS })
  const existingTxs = rowsToTransactions(existingRows)
  const next = [...existingTxs, { ...tx, id: tx.id || Date.now() }]
  await writeSheet({
    webhookUrl: creds.webhookUrl,
    secret: creds.secret,
    sheetId: creds.sheetId,
    tab: SHEET_TABS.TRANSACTIONS,
    values: transactionsToRows(next)
  })
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
