import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../shared/Toast.jsx'
import Modal from '../shared/Modal.jsx'
import TransactionForm from '../transactions/TransactionForm.jsx'
import { mirrorTransactionToOtherView } from '../../services/sync.js'
import { todayIso } from '../../utils/date.js'
import { formatInr } from '../../utils/format.js'

export default function QuickActions() {
  const { view, state, dispatch } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState(null)  // null | 'salary' | 'income' | 'expense'

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

  async function handleSubmit(tx, { duplicate }) {
    const withId = { ...tx, id: Date.now() }
    dispatch({ type: 'TX_ADD', tx: withId })
    toast.success(tx.type === 'income' ? 'Earning logged' : 'Expense logged')
    if (duplicate) {
      try {
        await mirrorTransactionToOtherView({ currentView: view, tx: withId })
        toast.success('Mirrored to other view')
      } catch (err) { toast.error('Mirror failed: ' + err.message) }
    }
    setOpen(null)
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
      </div>

      <Modal
        open={open !== null}
        title={
          open === 'salary' ? 'Log salary received' :
          open === 'income' ? 'Log earning' :
          'Log expense'
        }
        onClose={() => setOpen(null)}
      >
        {open && (
          <TransactionForm
            initial={presetFor(open)}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(null)}
          />
        )}
      </Modal>
    </>
  )
}
