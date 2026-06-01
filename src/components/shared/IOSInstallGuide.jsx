import { useState, useEffect } from 'react'

const KEY = 'ledger:dismissedIosGuide'

function isIosSafari() {
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

export default function IOSInstallGuide() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (!isIosSafari()) return
    if (localStorage.getItem(KEY) === '1') return
    setShow(true)
  }, [])

  if (!show) return null

  return (
    <div className="card border-brand-500/40 bg-brand-600/10">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1 text-sm text-slate-200">
          <div className="font-semibold mb-1">Install on iPhone</div>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
            <li>Tap the <b>Share</b> button in Safari</li>
            <li>Choose <b>Add to Home Screen</b></li>
            <li>Name it <b>Ledger</b> and tap Add</li>
          </ol>
        </div>
        <button
          onClick={() => { localStorage.setItem(KEY, '1'); setShow(false) }}
          className="text-slate-400 hover:text-slate-200 text-xl leading-none"
          aria-label="Dismiss"
        >×</button>
      </div>
    </div>
  )
}
