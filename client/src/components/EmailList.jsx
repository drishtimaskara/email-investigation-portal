import { useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import Icon from './Icons'

const PAGE_SIZE = 8
const FOLDERS = ['inbox', 'starred', 'sent', 'drafts', 'trash']

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  const opts = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

// Remount the list whenever the folder changes, so page and selection reset.
export default function EmailList() {
  const { folder } = useParams()
  return <EmailListView key={folder} folder={folder} />
}

function EmailListView({ folder }) {
  const { emails, query } = useOutletContext()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(() => new Set())
  const [noticeOpen, setNoticeOpen] = useState(true)

  if (!FOLDERS.includes(folder)) {
    return <p className="p-6 text-sm text-slate-500">This folder does not exist.</p>
  }

  let inScope
  if (folder === 'starred') {
    inScope = emails.filter((e) => e.isStarred && e.folder !== 'trash')
  } else {
    inScope = emails.filter((e) => e.folder === folder)
  }

  const q = query.trim().toLowerCase()
  const matches = q
    ? inScope.filter((e) => [e.subject, e.senderName, e.senderEmail, e.body].some((f) => f.toLowerCase().includes(q)))
    : inScope

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const rows = matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const rangeStart = matches.length ? current * PAGE_SIZE + 1 : 0
  const rangeEnd = current * PAGE_SIZE + rows.length

  const allSelected = rows.length > 0 && rows.every((e) => selected.has(e.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      rows.forEach((e) => (allSelected ? next.delete(e.id) : next.add(e.id)))
      return next
    })
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const showRecipient = folder === 'sent' || folder === 'drafts'

  return (
    <section className="flex flex-col gap-2 pr-3">
      <h1 className="sr-only capitalize">{folder}</h1>

      {folder === 'trash' && noticeOpen && (
        <div role="status" className="flex items-center justify-between gap-4 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white">
          <span>Emails in Trash are deleted forever after 30 days.</span>
          <button type="button" onClick={() => setNoticeOpen(false)} className="font-medium text-brand-100 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex h-11 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          aria-label="Select all emails on this page"
          className="mr-2 size-4 rounded accent-brand-600"
        />
        <button type="button" className="icon-btn !size-8" aria-label="Refresh" onClick={() => setPage(0)}>
          <Icon name="refresh" className="size-4" />
        </button>
        <button type="button" className="icon-btn !size-8" aria-label="Delete selected">
          <Icon name="trash" className="size-4" />
        </button>
        <button type="button" className="icon-btn !size-8" aria-label="More actions">
          <Icon name="more" className="size-4" />
        </button>

        <span className="ml-auto inline-flex h-6 items-center gap-1.5 rounded-md bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Synchronised
        </span>
        <span className="mx-3 text-xs text-slate-500">
          {rangeStart}-{rangeEnd} of {matches.length}
        </span>
        <button
          type="button"
          className="icon-btn !size-8 disabled:opacity-40"
          aria-label="Newer"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        >
          <Icon name="chevronLeft" className="size-4" />
        </button>
        <button
          type="button"
          className="icon-btn !size-8 disabled:opacity-40"
          aria-label="Older"
          disabled={current >= pageCount - 1}
          onClick={() => setPage(current + 1)}
        >
          <Icon name="chevronRight" className="size-4" />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {q ? `No emails match "${query.trim()}".` : 'No emails here yet.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((e) => (
            <li
              key={e.id}
              className={`group flex items-center rounded-md border border-slate-200 pl-3 transition-colors hover:border-slate-300 hover:shadow-sm ${
                selected.has(e.id) ? 'bg-brand-50' : 'bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(e.id)}
                onChange={() => toggleOne(e.id)}
                aria-label={`Select email: ${e.subject}`}
                className="size-4 rounded accent-brand-600"
              />
              <button type="button" className="icon-btn !size-8" aria-label={e.isStarred ? 'Starred' : 'Not starred'}>
                <Icon name="star" className={`size-4 ${e.isStarred ? 'text-amber-400' : 'text-slate-400'}`} filled={e.isStarred} />
              </button>

              <Link to={`/email/${e.id}`} className="flex h-11 min-w-0 flex-1 items-center gap-3 pr-3 text-[13px]">
                <span className="w-44 shrink-0 truncate font-semibold text-slate-900">
                  {showRecipient ? (
                    <>
                      <span className="font-normal text-slate-400">To: </span>
                      {e.recipient}
                    </>
                  ) : (
                    e.senderName
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-slate-900">{e.subject}</span>
                  <span className="text-slate-400"> - {e.body}</span>
                </span>
                <span className="w-14 shrink-0 text-right text-xs text-slate-500">{formatDate(e.date)}</span>
              </Link>

              <button
                type="button"
                className="icon-btn !size-8 mr-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                aria-label={`Delete email: ${e.subject}`}
              >
                <Icon name="trash" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}