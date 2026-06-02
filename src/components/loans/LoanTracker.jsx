import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useToast } from '../shared/Toast.jsx'
import Modal from '../shared/Modal.jsx'
import LoanCard from './LoanCard.jsx'
import LoanForm from './LoanForm.jsx'
import RevolvingPaymentForm from './RevolvingPaymentForm.jsx'
import EMIPaymentForm from './EMIPaymentForm.jsx'
import PayoffChart from './PayoffChart.jsx'
import { formatInr } from '../../utils/format.js'
import { totalScheduledFor } from '../../utils/loanPhases.js'
import { useMirror } from '../../hooks/useMirror.js'
import { newId } from '../../utils/id.js'
import { SHEET_TABS } from '../../config/constants.js'

export default function LoanTracker() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const mirror = useMirror()
  const [editing, setEditing] = useState(null)         // null | 'new' | loan object
  const [recording, setRecording] = useState(null)     // null | loan object (revolving)
  const [payingEmi, setPayingEmi] = useState(null)     // null | loan object (standard)

  const total = state.loans.reduce((s, l) => {
    if (l.kind === 'revolving') return s + Math.max(0, l.principal || 0)
    return s + Math.max(0, totalScheduledFor(l) - (l.paid || 0))
  }, 0)
  const closed = state.loans.filter(l => l.status === 'closed')
  const open = state.loans.filter(l => l.status !== 'closed')

  function save(form) {
    if (editing === 'new') {
      const loan = { ...form, id: newId() }
      dispatch({ type: 'LOAN_ADD', loan })
      setEditing(null)
      mirror(SHEET_TABS.LOANS, 'add', { item: loan })
    } else {
      const loan = { ...editing, ...form }
      dispatch({ type: 'LOAN_UPDATE', loan })
      setEditing(null)
      mirror(SHEET_TABS.LOANS, 'update', { item: loan })
    }
  }

  function recordRevolvingPayment({ date, paid, withdrawn, note, account }) {
    const loan = recording
    const net = paid - withdrawn
    const newOutstanding = Math.max(0, (loan.principal || 0) - net)
    const updatedLoan = { ...loan, principal: newOutstanding, paid: (loan.paid || 0) + net }
    dispatch({ type: 'LOAN_UPDATE', loan: updatedLoan })
    setRecording(null)
    mirror(SHEET_TABS.LOANS, 'update', { item: updatedLoan })

    // Log ONLY the net difference as a single transaction (paid 18k, withdrew 15k
    // → one expense of 3k), so it never inflates earnings with a fake "income".
    if (net !== 0) {
      const tx = {
        id: newId(),
        date,
        type: net >= 0 ? 'expense' : 'income',
        category: 'Slice',
        amount: Math.abs(net),
        account: account || '',
        note: note ? `${loan.name} payment: ${note}` : `${loan.name} payment`
      }
      dispatch({ type: 'TX_ADD', tx })
      mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: tx })
    }
    toast.success(`Recorded · net reduction ${formatInr(net, { precise: true })}`)
  }

  function recordEmiPayment({ date, amount, account, advanceDue, note, nextDueDate }) {
    const loan = payingEmi
    const newPaid = (loan.paid || 0) + amount
    const updated = { ...loan, paid: newPaid }
    if (advanceDue && nextDueDate) updated.dueDate = nextDueDate
    dispatch({ type: 'LOAN_UPDATE', loan: updated })
    setPayingEmi(null)
    mirror(SHEET_TABS.LOANS, 'update', { item: updated })

    const tx = {
      id: newId(),
      date,
      type: 'expense',
      category: 'EMI',
      subcategory: loan.name,
      amount,
      account: account || '',
      note: note ? `${loan.name} EMI: ${note}` : `${loan.name} EMI`
    }
    dispatch({ type: 'TX_ADD', tx })
    mirror(SHEET_TABS.TRANSACTIONS, 'add', { item: tx })
    toast.success(`EMI logged · ${formatInr(amount, { precise: true })}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label">All loans</div>
          <div className="text-xl font-bold text-slate-50">{formatInr(total)} outstanding</div>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>+ Add loan</button>
      </div>

      {open.length > 0 && <PayoffChart loans={open} />}

      <div className="space-y-3">
        {open.map(loan => (
          <LoanCard
            key={loan.id}
            loan={loan}
            onEdit={() => setEditing(loan)}
            onDelete={() => {
              if (confirm(`Delete "${loan.name}"?`)) {
                dispatch({ type: 'LOAN_DELETE', id: loan.id })
                mirror(SHEET_TABS.LOANS, 'delete', { id: loan.id })
              }
            }}
            onRecordPayment={loan.kind === 'revolving' ? () => setRecording(loan) : undefined}
            onPayEmi={loan.kind !== 'revolving' ? () => setPayingEmi(loan) : undefined}
          />
        ))}
        {open.length === 0 && (
          <div className="card text-center text-slate-400 text-sm">
            🎉 No active loans. Add one to start tracking.
          </div>
        )}
      </div>

      {closed.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer text-sm text-slate-400">Closed loans ({closed.length})</summary>
          <div className="space-y-2 mt-3">
            {closed.map(l => (
              <div key={l.id} className="flex justify-between text-sm">
                <span className="text-slate-300">{l.name}</span>
                <span className="text-slate-500">{formatInr(l.principal)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add loan' : 'Edit loan'}
        onClose={() => setEditing(null)}
      >
        <LoanForm
          initial={editing === 'new' ? null : editing}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      </Modal>

      <Modal
        open={recording !== null}
        title={recording ? `Record payment · ${recording.name}` : ''}
        onClose={() => setRecording(null)}
      >
        {recording && (
          <RevolvingPaymentForm
            loan={recording}
            onSubmit={recordRevolvingPayment}
            onCancel={() => setRecording(null)}
          />
        )}
      </Modal>

      <Modal
        open={payingEmi !== null}
        title={payingEmi ? `Pay EMI · ${payingEmi.name}` : ''}
        onClose={() => setPayingEmi(null)}
      >
        {payingEmi && (
          <EMIPaymentForm
            loan={payingEmi}
            onSubmit={recordEmiPayment}
            onCancel={() => setPayingEmi(null)}
          />
        )}
      </Modal>
    </div>
  )
}
