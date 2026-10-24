import { Link } from 'react-router-dom'
import Icon from './Icons'
import { useAuth } from '../auth/useAuth'

const protagonist = {
  name: 'Navya Mulay',
  email: 'navya.mulay@campus.example',
}

const initials = 'NM'

export default function Navbar({ query, onQueryChange, onToggleSidebar }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
      <button
        type="button"
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle side panel"
      >
        <Icon name="menu" />
      </button>

      <Link to="/inbox" className="flex items-center gap-2 pr-3">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
          <Icon name="mail" className="size-[18px]" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-slate-900 hidden sm:inline">
          Mailbox
        </span>
      </Link>

      <label className="relative mx-auto block w-full max-w-xl">
        <span className="sr-only">Search mail</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
        />
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
        className="flex h-9 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 text-[12px] font-medium text-brand-700 transition-colors hover:bg-brand-100 whitespace-nowrap"
      >
        <Icon name="bulb" className="size-3.5" />
        Hints &amp; Insights
      </Link>

      {user?.role === 'admin' && (
        <Link
          to="/admin"
          className="flex h-9 items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 text-[12px] font-medium text-purple-700 transition-colors hover:bg-purple-100 whitespace-nowrap"
        >
          Admin Panel
        </Link>
      )}

      {/* Protagonist Mailbox Badge */}
      <div
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5"
        title="Active Investigation Target: Protagonist Navya Mulay"
      >
        <span
          className="grid size-7 place-items-center rounded-full bg-rose-700 text-[11px] font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="leading-tight text-left hidden md:block">
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] font-semibold text-slate-900">{protagonist.name}</p>
            <span className="rounded bg-rose-100 px-1 py-0.2 text-[9px] font-medium text-rose-800">
              Subject
            </span>
          </div>
          <p className="text-[10px] text-slate-500">{protagonist.email}</p>
        </div>
      </div>

      {/* Current Logged-in Investigator / Admin */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
        <div className="text-right text-[11px] leading-tight hidden lg:block">
          <p className="font-semibold text-slate-800">
            {user?.displayName || user?.username}
          </p>
          <p className="text-slate-400 capitalize">{user?.role || 'player'}</p>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out of investigation portal"
          className="flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Exit
        </button>
      </div>
    </header>
  )
}
