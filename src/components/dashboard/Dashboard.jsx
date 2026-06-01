import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import NetWorthCard from './NetWorthCard.jsx'
import CashFlowSummary from './CashFlowSummary.jsx'
import MonthProjection from './MonthProjection.jsx'
import AccountBalancesCard from './AccountBalancesCard.jsx'
import QuickActions from './QuickActions.jsx'
import DebtFreeCountdown from '../projection/DebtFreeCountdown.jsx'
import UpcomingReminders from '../calendar/UpcomingReminders.jsx'
import IOSInstallGuide from '../shared/IOSInstallGuide.jsx'

export default function Dashboard({ basePath }) {
  const { state } = useApp()

  return (
    <div className="space-y-4">
      <IOSInstallGuide />

      <NetWorthCard />

      <QuickActions />

      <AccountBalancesCard basePath={basePath} />

      <MonthProjection />

      <CashFlowSummary />

      <DebtFreeCountdown />

      <UpcomingReminders limit={3} basePath={basePath} />

      <div className="grid grid-cols-2 gap-3">
        <Link to={`${basePath}/daily`} className="card hover:bg-ink-800 transition-colors">
          <div className="text-2xl">📝</div>
          <div className="mt-1 font-semibold text-slate-100">Daily ledger</div>
          <div className="text-xs text-slate-400">Log expense / earning</div>
        </Link>
        <Link to={`${basePath}/loans`} className="card hover:bg-ink-800 transition-colors">
          <div className="text-2xl">💳</div>
          <div className="mt-1 font-semibold text-slate-100">Manage loans</div>
          <div className="text-xs text-slate-400">{state.loans.length} total</div>
        </Link>
        <Link to={`${basePath}/budget`} className="card hover:bg-ink-800 transition-colors">
          <div className="text-2xl">📊</div>
          <div className="mt-1 font-semibold text-slate-100">Budget</div>
          <div className="text-xs text-slate-400">Plan + split</div>
        </Link>
        <Link to={`${basePath}/investments`} className="card hover:bg-ink-800 transition-colors">
          <div className="text-2xl">📈</div>
          <div className="mt-1 font-semibold text-slate-100">Investments</div>
          <div className="text-xs text-slate-400">LIC, RD, NPS</div>
        </Link>
      </div>
    </div>
  )
}
