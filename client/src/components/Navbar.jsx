import { Link } from 'react-router-dom'
import Icon from './Icons'
import { currentUser } from '../data/emails'

const initials = currentUser.name
  .split(' ')
  .map((part) => part[0])
  .join('')

export default function Navbar({ query, onQueryChange, onToggleSidebar }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
      <button type="button" className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle side panel">
        <Icon name="menu" />
      </button>

      <Link to="/inbox" className="flex items-center gap-2 pr-4">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
          <Icon name="mail" className="size-[18px]" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">Mailbox</span>
      </Link>

      <label className="relative mx-auto block w-full max-w-xl">
        <span className="sr-only">Search mail</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by subject, sender or message"
          className="h-10 w-full rounded-full bg-slate-100 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-2 focus:outline-brand-600"
        />
      </label>

      <Link
        to="/hints"
        className="flex h-9 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 text-[12px] font-medium text-brand-700 transition-colors hover:bg-brand-100"
      >
        <Icon name="bulb" className="size-3.5" />
        Hints &amp; Insights
      </Link>

      <button type="button" className="icon-btn" aria-label="Help">
        <Icon name="help" />
      </button>
      <button type="button" className="icon-btn" aria-label="Settings">
        <Icon name="settings" />
      </button>

      <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3">
        <span className="grid size-8 place-items-center rounded-full bg-rose-700 text-xs font-semibold text-white" aria-hidden="true">
          {initials}
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-medium text-slate-900">{currentUser.name}</p>
          <p className="text-[11px] text-slate-500">{currentUser.email}</p>
        </div>
      </div>
    </header>
  )
}