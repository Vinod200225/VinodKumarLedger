export default function LoadingSpinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={'flex items-center gap-2 text-slate-400 text-sm ' + className}>
      <span className="inline-block w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  )
}
