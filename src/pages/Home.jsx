import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import styles from './Home.module.css'

const STATUS_LABEL = { applied: '신청완료', approved: '승인', rejected: '반려' }
const CATEGORY_LABEL = {
  MANDATORY_EXIT: '필수 퇴실',
  NO_STAY: '잔류 불가',
  DEADLINE: '신청 마감',
  EVENT: '일정',
}

function getDday(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [thisWeekRequest, setThisWeekRequest] = useState(undefined)
  const [schedules, setSchedules] = useState([])
  const [notices, setNotices] = useState([])

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const [{ data: profile }, { data: requests }, { data: scheds }, { data: noticeList }] =
      await Promise.all([
        supabase.from('users').select('name, room_number').eq('id', authUser.id).single(),
        supabase
          .from('stay_requests')
          .select('*')
          .eq('user_id', authUser.id)
          .gte('start_date', getThisWeekFriday())
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('schedules')
          .select('*')
          .gte('start_date', today())
          .order('start_date')
          .limit(3),
        supabase
          .from('notices')
          .select('id, title, is_pinned, created_at')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3),
      ])

    setUser(profile)
    setThisWeekRequest(requests?.[0] ?? null)
    setSchedules(scheds ?? [])
    setNotices(noticeList ?? [])
  }

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  function getThisWeekFriday() {
    const d = new Date()
    const day = d.getDay()
    const diff = day <= 5 ? 5 - day : 5 - day + 7
    d.setDate(d.getDate() - (day === 0 ? 2 : day === 6 ? 1 : 0))
    const friday = new Date()
    friday.setDate(friday.getDate() + (day <= 5 ? -(day - 5 < 0 ? day - 5 + 7 : day - 5) : 5 - day + 7) % 7 - (day > 5 ? 7 : 0))
    friday.setDate(friday.getDate() - ((friday.getDay() - 5 + 7) % 7))
    return friday.toISOString().split('T')[0]
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>안녕하세요 👋</p>
          <h1 className={styles.name}>{user?.name ?? ''}님</h1>
        </div>
        <Link to="/notices" className={styles.bellBtn}>🔔</Link>
      </header>

      {/* 이번 주 외박 상태 */}
      <section className={styles.card}>
        <p className={styles.cardLabel}>이번 주 신청 상태</p>
        {thisWeekRequest === undefined ? (
          <p className={styles.loadingText}>불러오는 중...</p>
        ) : thisWeekRequest ? (
          <div className={styles.requestDone}>
            <span className={styles.checkIcon}>✅</span>
            <div>
              <p className={styles.requestType}>{thisWeekRequest.type}</p>
              <p className={styles.requestStatus}>{STATUS_LABEL[thisWeekRequest.status]}</p>
            </div>
          </div>
        ) : (
          <div className={styles.requestNone}>
            <span>⚠️</span>
            <div>
              <p className={styles.requestNoneText}>아직 신청하지 않았어요</p>
              <Link to="/stay-request" className={styles.requestNoneLink}>지금 신청하기 →</Link>
            </div>
          </div>
        )}
      </section>

      {/* 다가오는 일정 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>다가오는 일정</h2>
          <Link to="/calendar" className={styles.moreLink}>전체보기</Link>
        </div>
        {schedules.length === 0 ? (
          <p className={styles.emptyText}>예정된 일정이 없어요</p>
        ) : (
          <div className={styles.scheduleList}>
            {schedules.map(s => (
              <div key={s.id} className={styles.scheduleItem}>
                <div className={`${styles.scheduleDot} ${styles[s.category.toLowerCase()]}`} />
                <div className={styles.scheduleInfo}>
                  <p className={styles.scheduleTitle}>{s.title}</p>
                  <p className={styles.scheduleDate}>
                    {s.start_date} · {CATEGORY_LABEL[s.category]}
                    {s.is_essential && <span className={styles.essentialBadge}>필수</span>}
                  </p>
                </div>
                <span className={styles.dday}>{getDday(s.start_date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 빠른 메뉴 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>바로가기</h2>
        <div className={styles.quickMenu}>
          <Link to="/stay-request" className={styles.quickItem}>
            <span className={styles.quickIcon}>📝</span>
            <span>외박 신청</span>
          </Link>
          <Link to="/calendar" className={styles.quickItem}>
            <span className={styles.quickIcon}>📅</span>
            <span>일정 확인</span>
          </Link>
          <Link to="/notices" className={styles.quickItem}>
            <span className={styles.quickIcon}>📢</span>
            <span>공지사항</span>
          </Link>
          <Link to="/stay-history" className={styles.quickItem}>
            <span className={styles.quickIcon}>📋</span>
            <span>신청 내역</span>
          </Link>
        </div>
      </section>

      {/* 최신 공지 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>최신 공지</h2>
          <Link to="/notices" className={styles.moreLink}>전체보기</Link>
        </div>
        {notices.length === 0 ? (
          <p className={styles.emptyText}>등록된 공지가 없어요</p>
        ) : (
          <div className={styles.noticeList}>
            {notices.map(n => (
              <Link key={n.id} to="/notices" className={styles.noticeItem}>
                {n.is_pinned && <span className={styles.pinnedBadge}>긴급</span>}
                <p className={styles.noticeTitle}>{n.title}</p>
                <span className={styles.noticeArrow}>›</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div style={{ height: 80 }} />
      <BottomNav />
    </div>
  )
}
