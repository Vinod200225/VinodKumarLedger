import { useSync } from '../../context/SyncContext.jsx'

const COPY = {
  idle: 'Idle',
  pulling: 'Pulling…',
  pushing: 'Syncing…',
  ok: 'Synced',
  error: 'Sync error',
  unconfigured: 'Local only'
}

const COLOR = {
  idle: 'bg-ink-700 text-slate-300',
  pulling: 'bg-brand-600/20 text-brand-400',
  pushing: 'bg-brand-600/20 text-brand-400',
  ok: 'bg-good/15 text-good',
  error: 'bg-bad/15 text-bad',
  unconfigured: 'bg-warn/15 text-warn'
}

export default function SyncStatusBadge() {
  const { status, lastSyncAt, error, syncNow, configured } = useSync()
  const label = COPY[status] || status
  const time = lastSyncAt
    ? lastSyncAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null
  return (
    <button
      onClick={syncNow}
      disabled={!configured}
      title={error || (time ? `Last synced ${time}` : 'Tap to sync now')}
      className={'chip ' + (COLOR[status] || COLOR.idle) + ' hover:opacity-90'}
    >
      <span className={'w-1.5 h-1.5 rounded-full ' + (
        status === 'ok' ? 'bg-good' :
        status === 'error' ? 'bg-bad' :
        status === 'unconfigured' ? 'bg-warn' :
        'bg-brand-400 animate-pulse'
      )} />
      {label}
      {time && status === 'ok' && <span className="opacity-60 ml-1">{time}</span>}
    </button>
  )
}
