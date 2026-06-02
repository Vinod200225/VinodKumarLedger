import { createContext, useContext, useReducer, useMemo, useEffect } from 'react'
import { newId } from '../utils/id.js'
import {
  mockLoansReal, mockLoansPublic,
  mockConfigReal, mockConfigPublic,
  mockReminders, mockTransactions, mockBudget
} from '../config/mockData.js'

const AppContext = createContext(null)

function seed(view) {
  if (view === 'real') {
    return {
      loans: mockLoansReal,
      transactions: mockTransactions,
      reminders: mockReminders,
      budget: mockBudget,
      config: mockConfigReal,
      accounts: []
    }
  }
  return {
    loans: mockLoansPublic,
    transactions: mockTransactions,
    reminders: [],
    budget: mockBudget,
    config: mockConfigPublic,
    accounts: []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload }

    case 'LOAN_ADD':
      return { ...state, loans: [...state.loans, { ...action.loan, id: action.loan.id || newId() }] }
    case 'LOAN_UPDATE':
      return { ...state, loans: state.loans.map(l => l.id === action.loan.id ? { ...l, ...action.loan } : l) }
    case 'LOAN_DELETE':
      return { ...state, loans: state.loans.filter(l => l.id !== action.id) }

    case 'TX_ADD':
      return { ...state, transactions: [...state.transactions, { ...action.tx, id: action.tx.id || newId() }] }
    case 'TX_UPDATE':
      return { ...state, transactions: state.transactions.map(t => t.id === action.tx.id ? { ...t, ...action.tx } : t) }
    case 'TX_DELETE':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.id) }

    case 'REMINDER_ADD':
      return { ...state, reminders: [...state.reminders, { ...action.r, id: action.r.id || newId() }] }
    case 'REMINDER_UPDATE':
      return { ...state, reminders: state.reminders.map(r => r.id === action.r.id ? { ...r, ...action.r } : r) }
    case 'REMINDER_DELETE':
      return { ...state, reminders: state.reminders.filter(r => r.id !== action.id) }

    case 'BUDGET_SET':
      return {
        ...state,
        budget: {
          ...state.budget,
          [action.month]: { ...(state.budget[action.month] || {}), [action.category]: action.value }
        }
      }

    case 'CONFIG_SET':
      return { ...state, config: { ...state.config, ...action.patch } }

    case 'CONFIG_SET_SPLIT':
      return { ...state, config: { ...state.config, splitPostDebt: action.split } }

    case 'ACCOUNT_ADD':
      return { ...state, accounts: [...(state.accounts || []), { ...action.account, id: action.account.id || newId() }] }
    case 'ACCOUNT_UPDATE':
      return { ...state, accounts: (state.accounts || []).map(a => a.id === action.account.id ? { ...a, ...action.account } : a) }
    case 'ACCOUNT_DELETE':
      return { ...state, accounts: (state.accounts || []).filter(a => a.id !== action.id) }

    default:
      return state
  }
}

function storageKey(view) {
  return `ledger:state:v2:${view}`
}

function loadLocal(view) {
  try {
    const raw = localStorage.getItem(storageKey(view))
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function AppProvider({ view, children }) {
  const local = useMemo(() => loadLocal(view), [view])
  const initial = local || seed(view)
  const wasLoadedFromLocal = !!local
  const [state, dispatch] = useReducer(reducer, initial)

  useEffect(() => {
    try { localStorage.setItem(storageKey(view), JSON.stringify(state)) } catch {}
  }, [state, view])

  const value = useMemo(
    () => ({ view, state, dispatch, wasLoadedFromLocal }),
    [view, state, wasLoadedFromLocal]
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
