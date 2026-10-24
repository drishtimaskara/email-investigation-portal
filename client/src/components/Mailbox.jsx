import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// Layout shell shared by every page: navbar + side panel + the routed page.
// Emails now come from the server (GET /api/emails) instead of data/emails.js.
export default function Mailbox() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [emails, setEmails] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const timer = useRef(null)

  const showToast = (message) => {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(''), 2500)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/emails')
      .then((res) => {
        if (!res.ok) throw new Error(`Server replied ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setEmails(data)
          setStatus('ready')
        }
      })
      .catch((err) => {
        console.error('Could not load emails:', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-surface text-slate-800">
      <Navbar query={query} onQueryChange={setQuery} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} emails={emails} onCompose={() => showToast('Sending is disabled')} />
        <main className="min-w-0 flex-1 overflow-y-auto py-3 pl-3">
          {status === 'loading' && <p className="p-6 text-sm text-slate-500">Loading mail…</p>}
          {status === 'error' && (
            <p className="p-6 text-sm text-red-600">Couldn't reach the mail server. Make sure it's running, then refresh.</p>
          )}
          {status === 'ready' && <Outlet context={{ emails, query }} />}
        </main>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-6 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}