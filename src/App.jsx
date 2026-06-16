import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

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

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ session, isAdmin, children }) {
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setIsAdmin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    setIsAdmin(data?.role === 'admin')
  }

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        {/* 인증 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 학생 */}
        <Route path="/" element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
        <Route path="/stay-request" element={<ProtectedRoute session={session}><StayRequest /></ProtectedRoute>} />
        <Route path="/stay-history" element={<ProtectedRoute session={session}><StayHistory /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute session={session}><Calendar /></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute session={session}><Notices /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute session={session}><MyPage /></ProtectedRoute>} />

        {/* 관리자 */}
        <Route path="/admin" element={<AdminRoute session={session} isAdmin={isAdmin}><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/schedules" element={<AdminRoute session={session} isAdmin={isAdmin}><ScheduleManage /></AdminRoute>} />
        <Route path="/admin/notices" element={<AdminRoute session={session} isAdmin={isAdmin}><NoticeManage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
