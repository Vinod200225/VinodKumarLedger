import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../shared/Toast.jsx'
import Modal from '../shared/Modal.jsx'
import TransactionForm from '../transactions/TransactionForm.jsx'
import TransferForm from '../transactions/TransferForm.jsx'
import { useMirror } from '../../hooks/useMirror.js'
import { newId } from '../../utils/id.js'
import { SHEET_TABS } from '../../config/constants.js'
import { todayIso } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'

export default function QuickActions() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const mirror = useMirror()
  const [open, setOpen] = useState(null)  // null | 'salary' | 'income' | 'expense' | 'transfer'

  const monthKey = todayIso().slice(0, 7)
  const salary = Number(state.config?.currentSalary || 0)
  const accounts = state.accounts || []
  const primaryAccount = accounts[0]?.name || ''

  const salaryThisMonth = useMemo(() => {
    return (state.transactions || []).find(
      t => t.type === 'income' && t.category === 'Salary' && t.date?.startsWith(monthKey)
    )
  }, [state.transactions, monthKey])

  function presetFor(kind) {
    if (kind === 'salary') {
      return {
        date: todayIso(),
        type: 'income',
        category: 'Salary',
        amount: salary || '',
        account: primaryAccount,
        note: ''
      }
    }
    if (kind === 'income') {
      return {
        date: todayIso(),
        type: 'income',
        category: 'Side income',
        amount: '',
        account: primaryAccount,
        note: ''
      }
    }
    return {
      date: todayIso(),
      type: 'expense',
      account: primaryAccount,
      amount: '',
      note: ''
    }
  }

  function handleSubmit(tx) {
    const withId = { ...tx, id: newId() }
    dispatch({ type: 'TX_ADD', tx: withId })
    toast.success(tx.type === 'income' ? 'Earning logged' : 'Expense logged')
    setOpen(null)
    mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: withId })
  }

  function handleTransfer({ date, from, to, amount, note }) {
    const suffix = note ? `: ${note}` : ''
    const outTx = {
      id: newId(), date, type: 'expense', category: 'Transfer',
      account: from, amount, note: `→ ${to}${suffix}`
    }
    const inTx = {
      id: newId(), date, type: 'income', category: 'Transfer',
      account: to, amount, note: `← ${from}${suffix}`
    }
    dispatch({ type: 'TX_ADD', tx: outTx })
    dispatch({ type: 'TX_ADD', tx: inTx })
    toast.success(`Transferred ${formatInr(amount, { precise: true })} · ${from} → ${to}`)
    setOpen(null)
    mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: outTx })
    mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: inTx })
  }

  return (
    <>
      <div className="card">
        <div className="font-semibold text-slate-100 mb-2">Quick add</div>

        {!salaryThisMonth && salary > 0 && (
          <button
            className="btn-primary w-full mb-2 !py-2.5 text-sm"
            onClick={() => setOpen('salary')}
          >
            💰 Log this month's salary · {formatInr(salary)}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-ghost !py-2 text-sm border border-good/30 text-good"
            onClick={() => setOpen('income')}
          >
            + Earning
          </button>
          <button
            className="btn-ghost !py-2 text-sm border border-bad/30 text-bad"
            onClick={() => setOpen('expense')}
          >
            − Expense
          </button>
        </div>

        <button
          className="btn-ghost w-full mt-2 !py-2 text-sm"
          onClick={() => setOpen('transfer')}
        >
          ⇄ Self transfer (move between accounts)
        </button>
      </div>

      <Modal
        open={open !== null}
        title={
          open === 'salary'   ? 'Log salary received' :
          open === 'income'   ? 'Log earning' :
          open === 'transfer' ? 'Transfer between accounts' :
          'Log expense'
        }
        onClose={() => setOpen(null)}
      >
        {open === 'transfer' ? (
          <TransferForm onSubmit={handleTransfer} onCancel={() => setOpen(null)} />
        ) : open ? (
          <TransactionForm
            initial={presetFor(open)}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(null)}
          />
        ) : null}
      </Modal>
    </>
  )
}
