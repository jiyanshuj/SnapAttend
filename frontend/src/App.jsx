import { useState } from 'react'
import AttendanceApp from './components/attendance'
import Home from './components/Home'

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false)

  return showDashboard ? (
    <AttendanceApp onHome={() => setShowDashboard(false)} />
  ) : (
    <Home onEnter={() => setShowDashboard(true)} />
  )
}