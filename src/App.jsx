import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import StayRequest from './pages/StayRequest'
import StayHistory from './pages/StayHistory'
import Calendar from './pages/Calendar'
import Notices from './pages/Notices'
import MyPage from './pages/MyPage'
import AdminDashboard from './pages/admin/Dashboard'
import ScheduleManage from './pages/admin/ScheduleManage'
import NoticeManage from './pages/admin/NoticeManage'

function StudentLayout({ isAdmin }) {
  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <Outlet />
    </>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setIsAdmin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    setIsAdmin(data?.role === 'admin')
  }

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" replace />} />

        <Route element={session ? <StudentLayout isAdmin={isAdmin} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Home />} />
          <Route path="/stay-request" element={<StayRequest />} />
          <Route path="/stay-history" element={<StayHistory />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />
          <Route path="/admin/schedules" element={isAdmin ? <ScheduleManage /> : <Navigate to="/" replace />} />
          <Route path="/admin/notices" element={isAdmin ? <NoticeManage /> : <Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
