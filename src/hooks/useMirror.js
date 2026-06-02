import { useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/shared/Toast.jsx'
import { mirrorOp } from '../services/sync.js'

// Returns mirror(tab, op, { item } | { id }) — fire-and-forget.
// Copies the change to the OTHER view's sheet so both sheets stay in sync.
// op is 'add' | 'update' | 'delete'.
export function useMirror() {
  const { view } = useApp()
  const toast = useToast()
  return useCallback((tab, op, payload) => {
    mirrorOp({ currentView: view, tab, op, ...payload })
      .catch(err => toast.error('Sync to other view failed: ' + err.message))
  }, [view, toast])
}
