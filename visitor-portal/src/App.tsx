import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import InvitationPage from './pages/InvitationPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/invitation/:slug" element={<InvitationPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
