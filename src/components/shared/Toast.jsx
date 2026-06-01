import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const api = {
    info: m => push(m, 'info'),
    success: m => push(m, 'success'),
    error: m => push(m, 'error')
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto rounded-xl px-4 py-2 text-sm font-medium shadow-card border',
              t.type === 'error'   ? 'bg-bad/15 border-bad/40 text-bad' :
              t.type === 'success' ? 'bg-good/15 border-good/40 text-good' :
                                     'bg-ink-800 border-ink-700 text-slate-200'
            ].join(' ')}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
