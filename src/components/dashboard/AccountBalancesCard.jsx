import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { formatInr } from '../../utils/format.js'
import { computeAccountBalance } from '../accounts/Accounts.jsx'

const ACCOUNT_ACCENT = {
  bank:   { dot: 'bg-blue-400',    bar: 'from-blue-500/15' },
  wallet: { dot: 'bg-purple-400',  bar: 'from-purple-500/15' },
  cash:   { dot: 'bg-emerald-400', bar: 'from-emerald-500/15' },
  credit: { dot: 'bg-rose-400',    bar: 'from-rose-500/15' }
}

export default function AccountBalancesCard({ basePath }) {
  const { state } = useApp()
  const accounts = state.accounts || []

  const withBalance = useMemo(
    () => accounts.map(a => ({ ...a, balance: computeAccountBalance(a, state.transactions) })),
    [accounts, state.transactions]
  )
  const total = withBalance.reduce((s, a) => s + a.balance, 0)

  if (accounts.length === 0) return null

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-slate-100">Account balances</div>
          <Link to={`${basePath}/accounts`} className="text-xs text-brand-400 hover:underline">
            Manage →
          </Link>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <div className="text-3xl font-bold text-slate-50 tabular-nums">
            {formatInr(total, { precise: true })}
          </div>
          <span className="text-xs text-slate-400">total liquid</span>
        </div>
        <ul className="space-y-1.5">
          {withBalance.map(a => {
            const accent = ACCOUNT_ACCENT[a.type] || ACCOUNT_ACCENT.bank
            return (
              <li
                key={a.id}
                className={'flex items-center justify-between text-sm rounded-lg px-2.5 py-1.5 bg-gradient-to-r ' + accent.bar + ' to-ink-800'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={'w-2 h-2 rounded-full shrink-0 ' + accent.dot} />
                  <span className="text-slate-100 font-medium truncate">{a.name}</span>
                </div>
                <span className={'font-semibold tabular-nums ' + (a.balance < 0 ? 'text-bad' : 'text-slate-50')}>
                  {formatInr(a.balance, { precise: true })}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
