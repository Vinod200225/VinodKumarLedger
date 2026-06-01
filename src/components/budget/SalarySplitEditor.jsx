import { useApp } from '../../context/AppContext.jsx'
import { SPLIT_LABELS, SPLIT_COLORS } from '../../config/splitDefaults.js'
import { formatInr } from '../../utils/format.js'

export default function SalarySplitEditor() {
  const { state, dispatch } = useApp()
  const split = state.config?.splitPostDebt || { invest: 25, savings: 25, lifestyle: 25, family: 25 }
  const salary = Number(state.config?.currentSalary || 0)

  const total = Object.values(split).reduce((s, v) => s + Number(v || 0), 0)
  const ok = total === 100

  function set(key, value) {
    const next = { ...split, [key]: Math.max(0, Math.min(100, Number(value) || 0)) }
    dispatch({ type: 'CONFIG_SET_SPLIT', split: next })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold text-slate-100">Post-debt salary split</div>
        <span className={'chip ' + (ok ? 'bg-good/15 text-good' : 'bg-warn/15 text-warn')}>
          {total}%
        </span>
      </div>
      <div className="text-xs text-slate-500 mb-3">
        How you'll allocate salary once loans are cleared. Edit anytime.
      </div>

      <div className="space-y-3">
        {Object.keys(SPLIT_LABELS).map(key => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-200">{SPLIT_LABELS[key]}</span>
              <span className="text-slate-400">
                {split[key] || 0}% {salary > 0 && <span className="text-slate-500">· {formatInr(salary * (split[key] || 0) / 100)}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0" max="100"
                value={split[key] || 0}
                onChange={e => set(key, e.target.value)}
                className="flex-1 accent-brand-500"
              />
              <input
                type="number"
                min="0" max="100"
                value={split[key] || 0}
                onChange={e => set(key, e.target.value)}
                className="input !w-16 !py-1 text-center"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 h-2 rounded-full bg-ink-800 overflow-hidden flex">
        {Object.keys(SPLIT_LABELS).map(key => (
          <div
            key={key}
            style={{ width: ((split[key] || 0) / Math.max(total, 1) * 100) + '%', background: SPLIT_COLORS[key] }}
          />
        ))}
      </div>

      {!ok && (
        <div className="text-xs text-warn mt-2">
          Splits should add up to 100% (currently {total}%).
        </div>
      )}
    </div>
  )
}
