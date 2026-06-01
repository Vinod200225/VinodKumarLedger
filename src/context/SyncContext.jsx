import { createContext, useContext, useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { pullAll, pushAll, makeDebouncedPush } from '../services/sync.js'
import { useApp } from './AppContext.jsx'
import { SYNC_DEBOUNCE_MS } from '../config/constants.js'

const SyncContext = createContext(null)

function credsForView(view) {
  if (view === 'real') {
    return {
      sheetId: import.meta.env.VITE_REAL_SHEET_ID,
      apiKey: import.meta.env.VITE_REAL_SHEET_API_KEY,
      webhookUrl: import.meta.env.VITE_REAL_SHEETS_WEBHOOK,
      secret: import.meta.env.VITE_SHEETS_WEBHOOK_SECRET
    }
  }
  return {
    sheetId: import.meta.env.VITE_PUBLIC_SHEET_ID,
    apiKey: import.meta.env.VITE_PUBLIC_SHEET_API_KEY,
    webhookUrl: import.meta.env.VITE_PUBLIC_SHEETS_WEBHOOK,
    secret: import.meta.env.VITE_SHEETS_WEBHOOK_SECRET
  }
}

export function SyncProvider({ children }) {
  const { view, state, dispatch, wasLoadedFromLocal } = useApp()
  const creds = useMemo(() => credsForView(view), [view])
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const [status, setStatus] = useState('idle')   // idle | pulling | pushing | ok | error | unconfigured
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [error, setError] = useState(null)

  const configured = Boolean(creds.sheetId && creds.apiKey)

  // Initial pull
  // If we have local data (wasLoadedFromLocal), DON'T hydrate from sheet on startup.
  // Local is the source of truth; the sheet is just a backup. This avoids races where
  // an in-flight push gets clobbered by a stale pull after a quick refresh.
  // To pick up edits made directly in Google Sheets, the user taps the Sync badge.
  useEffect(() => {
    let cancelled = false
    if (!configured) {
      setStatus('unconfigured')
      return
    }
    setStatus('pulling')
    pullAll(creds)
      .then(payload => {
        if (cancelled) return
        const hasAnything =
          payload.loans?.length || payload.transactions?.length ||
          payload.reminders?.length || Object.keys(payload.budget || {}).length ||
          Object.keys(payload.config || {}).length
        if (hasAnything && !wasLoadedFromLocal) {
          dispatch({ type: 'HYDRATE', payload })
        }
        setStatus('ok')
        setLastSyncAt(new Date())
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => { cancelled = true }
  }, [configured]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto debounced push
  const triggerRef = useRef(null)
  useEffect(() => {
    if (!creds.webhookUrl || !creds.secret) {
      triggerRef.current = null
      return
    }
    triggerRef.current = makeDebouncedPush(
      creds,
      () => stateRef.current,
      { delay: SYNC_DEBOUNCE_MS }
    )
  }, [creds])

  // Fire push on state change (skip the initial mount value)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (!triggerRef.current) return
    setStatus('pushing')
    triggerRef.current(err => {
      if (err) {
        setError(err.message)
        setStatus('error')
      } else {
        setError(null)
        setStatus('ok')
        setLastSyncAt(new Date())
      }
    })
  }, [state])

  const syncNow = useCallback(async () => {
    if (!configured) return
    try {
      setStatus('pushing')
      if (creds.webhookUrl && creds.secret) {
        await pushAll(creds, stateRef.current)
      }
      const payload = await pullAll(creds)
      dispatch({ type: 'HYDRATE', payload })
      setStatus('ok')
      setLastSyncAt(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [creds, configured, dispatch])

  // Pull ONLY — overwrite local state with sheet data, ignoring local.
  // Use when sheet has been edited directly OR when local got out of sync.
  const pullFromSheet = useCallback(async () => {
    if (!configured) return
    try {
      setStatus('pulling')
      const payload = await pullAll(creds)
      dispatch({ type: 'HYDRATE', payload })
      setStatus('ok')
      setLastSyncAt(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [creds, configured, dispatch])

  const value = useMemo(
    () => ({ status, lastSyncAt, error, syncNow, pullFromSheet, configured }),
    [status, lastSyncAt, error, syncNow, pullFromSheet, configured]
  )
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
