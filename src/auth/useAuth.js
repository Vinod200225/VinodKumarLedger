import { useState, useEffect, useCallback } from 'react'
import { sha256Hex } from './hashPassword.js'

const STORAGE_KEY = 'ledger:mode'

function readStoredMode() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === 'public' || v === 'real') return v
  } catch {}
  return null
}

export function useAuth() {
  const [mode, setMode] = useState(readStoredMode)

  useEffect(() => {
    try {
      if (mode) sessionStorage.setItem(STORAGE_KEY, mode)
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [mode])

  const tryLogin = useCallback(async password => {
    const hash = await sha256Hex(password)
    const pub = import.meta.env.VITE_PUBLIC_PASSWORD_HASH
    const real = import.meta.env.VITE_REAL_PASSWORD_HASH
    if (pub && hash === pub) { setMode('public'); return 'public' }
    if (real && hash === real) { setMode('real'); return 'real' }
    return null
  }, [])

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    setMode(null)
  }, [])

  return { mode, tryLogin, logout }
}
