import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import Mailbox from './components/Mailbox'
import EmailList from './components/EmailList'
import EmailView from './components/EmailView'
import Hints from './components/Hints'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'

function ProtectedAdminRoute({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    )
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'admin') {
    return <Navigate to="/inbox" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
        <Route element={<Mailbox />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="hints" element={<Hints />} />
          <Route path="email/:id" element={<EmailView />} />
          <Route path=":folder" element={<EmailList />} />
        </Route>
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </AuthProvider>
  )
}
