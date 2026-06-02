import { useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/shared/Toast.jsx'
import { mirrorOp } from '../services/sync.js'
import { MASTER_VIEW } from '../config/constants.js'

// Returns mirror(tab, op, { item } | { id }) — fire-and-forget.
// Copies the change to sheet 2 — but ONLY when you're working in the master sheet
// (sheet 1). Edits you make directly in sheet 2 are never pushed back to sheet 1.
// op is 'add' | 'update' | 'delete'.
export function useMirror() {
  const { view } = useApp()
  const toast = useToast()
  return useCallback((tab, op, payload) => {
    if (view !== MASTER_VIEW) return     // one-way: sheet 1 → sheet 2 only
    mirrorOp({ currentView: view, tab, op, ...payload })
      .catch(err => toast.error('Sync to other view failed: ' + err.message))
  }, [view, toast])
}
