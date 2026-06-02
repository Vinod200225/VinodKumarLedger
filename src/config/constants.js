export const LOAN_STATUS = {
  ACTIVE: 'active',
  INFORMAL: 'informal',
  CLOSED: 'closed'
}

export const LOAN_KINDS = [
  { value: 'standard',  label: 'Standard EMI' },
  { value: 'revolving', label: 'Revolving credit (Slice, CC)' }
]

export const LOAN_SOURCES = [
  'Loan App',
  'Bank',
  'Personal',
  'Friend/Family',
  'Credit Card',
  'Other'
]

export const EXPENSE_CATEGORIES = [
  'Home',
  'Mobile',
  'Vehicle',
  'Transport',
  'EMI',
  'Slice',
  'Investment',
  'Family',
  'Lifestyle',
  'Food/Dining',
  'Medicines',
  'Subscriptions',
  'Other'
]

export const INCOME_CATEGORIES = [
  'Salary',
  'Side income',
  'Loan returned',
  'Investment return',
  'Gift',
  'Other'
]

export const REMINDER_RECURRENCE = [
  { value: 'once', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' }
]

export const REMINDER_TYPES = [
  'EMI',
  'Insurance',
  'LIC',
  'Investment',
  'Mobile',
  'Birthday',
  'Anniversary',
  'Function/Event',
  'Bill',
  'Other'
]

export const SHEET_TABS = {
  TRANSACTIONS: 'Transactions',
  LOANS: 'Loans',
  BUDGET: 'Budget',
  REMINDERS: 'Reminders',
  CONFIG: 'Config',
  ACCOUNTS: 'Accounts'
}

export const ACCOUNT_TYPES = [
  { value: 'bank',   label: 'Bank' },
  { value: 'wallet', label: 'Wallet / Savings' },
  { value: 'cash',   label: 'Cash' },
  { value: 'credit', label: 'Credit / Slice' }
]

export const SYNC_DEBOUNCE_MS = 300

// Sync flows ONE WAY: from the master sheet (sheet 1, Vinod@4115 = the "public" view)
// to the other sheet (sheet 2, Malavika@1925 = the "real" view). Edits made directly
// in sheet 2 are NOT pushed back, so extra data you add there stays only there.
export const MASTER_VIEW = 'public'
