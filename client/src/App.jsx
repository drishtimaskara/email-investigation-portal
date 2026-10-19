import { Navigate, Route, Routes } from 'react-router-dom'
import Mailbox from './components/Mailbox'
import EmailList from './components/EmailList'

// Temporary stand-in until the email page and hints page are built.
function Placeholder({ title }) {
  return (
    <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {title} page: yet to be implemented.
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Mailbox />}>
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="hints" element={<Placeholder title="Hints" />} />
        <Route path="email/:id" element={<Placeholder title="Email" />} />
        <Route path="label/:tag" element={<EmailList />} />
        <Route path=":folder" element={<EmailList />} />
      </Route>
    </Routes>
  )
}
