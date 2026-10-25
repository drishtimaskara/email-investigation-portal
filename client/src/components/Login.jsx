import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Icon from './Icons'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/inbox'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please provide both username and password.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const user = await login(username.trim(), password)
      if (user.role === 'admin' && from === '/inbox') {
        // Allow admin to go straight to admin panel or inbox
        navigate('/inbox')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-7 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-5">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon name="mail" className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Campus Webmail Archive
            </h1>
            <p className="text-xs text-slate-500">
              Investigative Portal &bull; Case ID: NM-2026
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium">Confidential Evidence Access</p>
          <p className="mt-0.5 text-amber-700">
            Log in with your assigned team credentials to access protagonist{' '}
            <span className="font-semibold text-amber-900">Navya Mulay&apos;s</span> mailbox archive.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Username or Team ID
            </label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Authenticating…' : 'Sign In to Investigation Mailbox'}
          </button>
        </form>
      </div>
    </div>
  )
}
