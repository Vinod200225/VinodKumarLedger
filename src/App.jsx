import { Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './auth/LoginScreen.jsx'
import PublicView from './views/PublicView.jsx'
import RealView from './views/RealView.jsx'
import { useAuth } from './auth/useAuth.js'
import { ToastProvider } from './components/shared/Toast.jsx'

function Protected({ require, children }) {
  const { mode } = useAuth()
  if (mode !== require) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/public/*"
          element={
            <Protected require="public">
              <PublicView />
            </Protected>
          }
        />
        <Route
          path="/real/*"
          element={
            <Protected require="real">
              <RealView />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
