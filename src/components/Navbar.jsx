import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Navbar.module.css'

const menus = [
  { to: '/', label: '홈' },
  { to: '/stay-request', label: '외박 신청' },
  { to: '/stay-history', label: '신청 내역' },
  { to: '/calendar', label: '일정 캘린더' },
  { to: '/notices', label: '공지사항' },
  { to: '/mypage', label: '마이페이지' },
]

export default function Navbar({ isAdmin }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo}>🏠 MiStay</NavLink>

        <div className={styles.links}>
          {menus.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `${styles.link} ${styles.adminLink} ${isActive ? styles.active : ''}`}
            >
              관리자
            </NavLink>
          )}
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
      </div>
    </nav>
  )
}
