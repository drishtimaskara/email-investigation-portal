import { Navigate, Route, Routes } from 'react-router-dom'
import Mailbox from './components/Mailbox'
import EmailList from './components/EmailList'
import EmailView from './components/EmailView'

// Temporary stand-in until the email page and hints page are built.
function Placeholder({ title }) {
  return (
    <div className="mr-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      {title} page: coming in the next step.
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Mailbox />}>
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="hints" element={<Placeholder title="Hints" />} />
        <Route path="email/:id" element={<EmailView />} />
        <Route path=":folder" element={<EmailList />} />
      </Route>
    </Routes>
  )
}
