import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Icon from './Icons'

export default function AdminPanel() {
  const { user, logout, authFetch } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [hintsLog, setHintsLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal / Form state for adding user
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRole, setNewRole] = useState('player')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Search filter for hints log
  const [logFilter, setLogFilter] = useState('')

  // Guard: if non-admin, redirect to /inbox
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/inbox', { replace: true })
    }
  }, [user, navigate])

  const loadData = useCallback(async () => {
    try {
      const [usersRes, logRes] = await Promise.all([
        authFetch('/api/admin/users'),
        authFetch('/api/admin/hints-log'),
      ])

      if (!usersRes.ok || !logRes.ok) {
        throw new Error('Failed to load administrative data')
      }

      const usersData = await usersRes.json()
      const logData = await logRes.json()

      setUsers(usersData.users || [])
      setHintsLog(logData.logs || [])
    } catch (err) {
      setError(err.message || 'Error loading admin data')
    }
  }, [authFetch])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      authFetch('/api/admin/users'),
      authFetch('/api/admin/hints-log'),
    ])
      .then(async ([usersRes, logRes]) => {
        if (!usersRes.ok || !logRes.ok) throw new Error('Failed to load administrative data')
        const usersData = await usersRes.json()
        const logData = await logRes.json()
        if (!cancelled) {
          setUsers(usersData.users || [])
          setHintsLog(logData.logs || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Error loading admin data')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [authFetch])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          displayName: newDisplayName || newUsername,
          role: newRole,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setShowAddModal(false)
      setNewUsername('')
      setNewPassword('')
      setNewDisplayName('')
      setNewRole('player')
      setSuccessMsg(`User "${data.user.username}" created successfully!`)
      setTimeout(() => setSuccessMsg(''), 4000)
      loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert('You cannot delete your own account.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete user "${targetUser.username}" (${targetUser.display_name})? This will also remove their hint unlock history.`)) {
      return
    }

    try {
      const res = await authFetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setSuccessMsg(`User "${targetUser.username}" removed.`)
      setTimeout(() => setSuccessMsg(''), 4000)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredLogs = hintsLog.filter((log) => {
    const q = logFilter.trim().toLowerCase()
    if (!q) return true
    return (
      log.username.toLowerCase().includes(q) ||
      log.display_name.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.hint_content.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white px-6 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded bg-slate-800 text-white font-bold text-xs">
              ARG
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Investigation Portal Admin
              </h1>
              <p className="text-xs text-slate-500">
                Game Master Control &bull; Missing Person Investigation (Navya Mulay)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/inbox"
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Icon name="mail" className="size-3.5" />
              View Protagonist Inbox
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-600 font-medium">
              Signed in as <span className="text-slate-900 font-semibold">{user?.displayName || user?.username}</span>
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Alerts */}
        {successMsg && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Players / Teams
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {users.filter((u) => u.role === 'player').length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Active ARG investigative groups
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Hints Unlocked
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {hintsLog.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Across all modules (Git, MIRROR, Notes, OSINT)
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hint Quota Rule
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              5 Hints Max
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Enforced server-side per team/account
            </p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Registered Teams &amp; Users
              </h2>
              <p className="text-xs text-slate-500">
                Add login accounts for participants. When they sign in, they will explore Navya Mulay&apos;s mailbox.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              + Add User / Team
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Team / Display Name</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Hints Used</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-6 text-center text-slate-400">
                      {loading ? 'Loading users…' : 'No users registered yet.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {u.display_name}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600">
                        @{u.username}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {u.hints_used} / 5
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, (u.hints_used / 5) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {u.created_at ? u.created_at.split(' ')[0] : '-'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50 hover:underline"
                            title="Delete this user"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hint Tracking Audit Log */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-5 py-4 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Real-Time Hint Usage Log
              </h2>
              <p className="text-xs text-slate-500">
                Audits which team unlocked which hint, along with exact timestamp.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter by team, module, or text…"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Team / User</th>
                  <th className="px-5 py-3">Module</th>
                  <th className="px-5 py-3">Hint #</th>
                  <th className="px-5 py-3">Revealed Clue Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-6 text-center text-slate-400">
                      {hintsLog.length === 0
                        ? 'No hints have been unlocked by any player yet.'
                        : 'No logs match the filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.unlocked_at}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {log.display_name}{' '}
                        <span className="text-slate-400 font-normal">(@{log.username})</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                        Hint #{log.hint_number}
                      </td>
                      <td className="px-5 py-3 text-slate-600 italic">
                        &ldquo;{log.hint_content}&rdquo;
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Add New Team / User
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Username (login ID)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. team-delta"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Team or Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Delta (Group 4)"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="player">Player (Investigator)</option>
                  <option value="admin">Administrator (Game Master)</option>
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
