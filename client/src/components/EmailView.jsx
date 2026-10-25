import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import Icon from './Icons'
import { formatFullDate } from '../utils/dates'

const initialsOf = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const person = (p) => (p.email ? `${p.name} <${p.email}>` : p.name)

// Shows the body as written, turning each {{TOKEN}} or raw URL into a link.
function Body({ email }) {
  const parts = (email.body || '').split(/(\{\{[A-Z0-9_]+\}\}|https?:\/\/[^\s<]+)/g)
  const links = email.links || []

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
      {parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 underline hover:text-brand-800"
            >
              {part}
            </a>
          )
        }

        if (/^\{\{[A-Z0-9_]+\}\}$/.test(part)) {
          const link = links.find((l) => l.token === part)
          if (link && link.url) {
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline hover:text-brand-800"
              >
                {link.url}
              </a>
            )
          }
          return (
            <span
              key={i}
              className="text-brand-600 underline decoration-dotted"
              title="This link is not available yet"
            >
              {part}
            </span>
          )
        }

        return part
      })}
    </div>
  )
}

function Attachment({ file }) {
  const content = (
    <>
      <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon name="file" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-slate-900">{file.name}</span>
        <span className="block text-[11px] uppercase text-slate-500">{file.url ? file.type : `${file.type} - not available yet`}</span>
      </span>
    </>
  )
  const base = 'flex w-64 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5'
  return file.url ? (
    <a href={file.url} target="_blank" rel="noreferrer" className={`${base} transition-colors hover:border-slate-300 hover:bg-slate-50`}>
      {content}
    </a>
  ) : (
    <div className={`${base} cursor-not-allowed opacity-70`} title="This file has not been added yet">
      {content}
    </div>
  )
}

export default function EmailView() {
  const { id } = useParams()
  const { emails } = useOutletContext()
  const navigate = useNavigate()
  const email = emails.find((e) => String(e.id) === id)

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/inbox'))

  const backButton = (
    <button type="button" onClick={goBack} className="icon-btn" aria-label="Back to the list">
      <Icon name="arrowLeft" />
    </button>
  )

  if (!email) {
    return (
      <div className="mr-3">
        {backButton}
        <p className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          This email does not exist. <Link to="/inbox" className="text-brand-600 underline">Go to the inbox</Link>
        </p>
      </div>
    )
  }

  const isDraft = email.folder === 'drafts'

  return (
    <article className="mr-3 flex flex-col gap-2">
      <div className="flex h-11 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3">
        {backButton}
        <span className="text-xs capitalize text-slate-500">{email.folder}</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-900">{email.subject}</h1>

        <div className="mt-4 flex items-start gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600" aria-hidden="true">
            {initialsOf(email.senderName)}
          </span>
          <dl className="min-w-0 flex-1 text-[13px] leading-6">
            <div className="flex gap-2">
              <dt className="w-10 shrink-0 text-slate-500">From</dt>
              <dd className="font-medium text-slate-900">{person({ name: email.senderName, email: email.senderEmail })}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-10 shrink-0 text-slate-500">To</dt>
              <dd className="text-slate-800">{person({ name: email.recipient, email: email.recipientEmail })}</dd>
            </div>
            {email.cc.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-10 shrink-0 text-slate-500">Cc</dt>
                <dd className="text-slate-800">{email.cc.map(person).join(', ')}</dd>
              </div>
            )}
          </dl>
          <p className="shrink-0 text-xs text-slate-500">
            {isDraft ? 'Last saved ' : ''}
            {formatFullDate(email.date)}
          </p>
        </div>

        <div className="max-w-3xl py-5">
          <Body email={email} />
        </div>

        {email.attachments.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Icon name="paperclip" className="size-3.5" />
              {email.attachments.length === 1 ? '1 attachment' : `${email.attachments.length} attachments`}
            </p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((file) => (
                <Attachment key={file.name} file={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
