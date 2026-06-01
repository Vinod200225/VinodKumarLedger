import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: 'dashboard',  label: 'Home',     icon: '🏠' },
  { to: 'daily',      label: 'Daily',    icon: '📝' },
  { to: 'loans',      label: 'Loans',    icon: '💳' },
  { to: 'budget',     label: 'Budget',   icon: '📊' },
  { to: 'calendar',   label: 'Reminders', icon: '🗓️' },
  { to: 'projection', label: 'Projection', icon: '📈' }
]

export default function Nav({ basePath }) {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-ink-900/95 backdrop-blur border-t border-ink-700 safe-bottom z-30">
      <div className="max-w-3xl mx-auto grid grid-cols-6">
        {TABS.map(t => {
          const to = `${basePath}/${t.to}`
          const active = pathname.startsWith(to)
          return (
            <NavLink
              key={t.to}
              to={to}
              className={[
                'flex flex-col items-center justify-center py-2 text-[11px] font-medium',
                active ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              ].join(' ')}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="mt-1">{t.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
