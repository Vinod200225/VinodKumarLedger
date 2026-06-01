import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '../context/AppContext.jsx'
import { SyncProvider } from '../context/SyncContext.jsx'
import Layout from '../components/shared/Layout.jsx'
import Dashboard from '../components/dashboard/Dashboard.jsx'
import LoanTracker from '../components/loans/LoanTracker.jsx'
import BudgetPlanner from '../components/budget/BudgetPlanner.jsx'
import ReminderCalendar from '../components/calendar/ReminderCalendar.jsx'
import FinancialProjection from '../components/projection/FinancialProjection.jsx'
import Transactions from '../components/transactions/Transactions.jsx'
import Investments from '../components/investments/Investments.jsx'
import Accounts from '../components/accounts/Accounts.jsx'

const BASE = '/real'

export default function RealView() {
  return (
    <AppProvider view="real">
      <SyncProvider>
        <Layout basePath={BASE}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<Dashboard basePath={BASE} />} />
            <Route path="daily"      element={<Transactions />} />
            <Route path="accounts"   element={<Accounts />} />
            <Route path="investments" element={<Investments />} />
            <Route path="loans"      element={<LoanTracker />} />
            <Route path="budget"     element={<BudgetPlanner />} />
            <Route path="calendar"   element={<ReminderCalendar />} />
            <Route path="projection" element={<FinancialProjection />} />
            <Route path="*"          element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Layout>
      </SyncProvider>
    </AppProvider>
  )
}
