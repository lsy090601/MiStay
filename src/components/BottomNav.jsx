import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const menus = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/stay-request', label: '외박신청', icon: '📝' },
  { to: '/stay-history', label: '신청내역', icon: '📋' },
  { to: '/calendar', label: '일정', icon: '📅' },
  { to: '/mypage', label: '마이페이지', icon: '👤' },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {menus.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
