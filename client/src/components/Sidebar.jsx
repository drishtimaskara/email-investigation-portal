import { NavLink } from 'react-router-dom'
import Icon from './Icons'

const LABELS = [
  { name: 'Work', color: 'text-sky-500' },
  { name: 'Personal', color: 'text-emerald-500' },
  { name: 'Urgent', color: 'text-red-500' },
  { name: 'Billing', color: 'text-blue-600' },
]

const linkClass = ({ isActive }) =>
  `flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
    isActive ? 'bg-brand-100 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function Sidebar({ open, emails, onCompose }) {
  const count = (folder) => emails.filter((e) => e.folder === folder).length

  const items = [
    { to: '/inbox', label: 'Inbox', icon: 'inbox', badge: count('inbox') },
    { to: '/starred', label: 'Starred', icon: 'star' },
    { to: '/sent', label: 'Sent', icon: 'send' },
    { to: '/drafts', label: 'Drafts', icon: 'file', badge: count('drafts') },
    { to: '/trash', label: 'Trash', icon: 'trash' },
    { to: '/hints', label: 'Hints & Insights', icon: 'bulb' },
  ]

  return (
    <aside
      className={`shrink-0 overflow-hidden transition-[width] duration-200 ${open ? 'w-60' : 'w-0'}`}
      inert={!open}
    >
      <div className="flex h-full w-60 flex-col gap-1 px-3 py-3">
        <button
          type="button"
          onClick={onCompose}
          className="mb-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Icon name="pencil" className="size-4" />
          Compose
        </button>

        <nav className="flex flex-col gap-0.5" aria-label="Folders">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <Icon name={item.icon} className="size-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="text-xs font-medium text-slate-500">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-xs font-medium text-slate-500">Labels</p>
          {LABELS.map((label) => (
            <NavLink key={label.name} to={`/label/${label.name.toLowerCase()}`} className={linkClass}>
              <Icon name="tag" className={`size-4 ${label.color}`} />
              {label.name}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Icon name="cloud" className="size-4 text-slate-400" />
              Storage
            </span>
            <span className="text-slate-500">20%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/5 rounded-full bg-brand-600" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">3 GB of 15 GB used</p>
        </div>
      </div>
    </aside>
  )
}
