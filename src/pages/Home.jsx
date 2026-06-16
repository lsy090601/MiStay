import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './Home.module.css'

const STATUS_LABEL = { applied: '신청완료', approved: '승인', rejected: '반려' }
const CATEGORY_LABEL = { MANDATORY_EXIT: '필수 퇴실', NO_STAY: '잔류 불가', DEADLINE: '신청 마감', EVENT: '일정' }
const CATEGORY_COLOR = { MANDATORY_EXIT: '#EF4444', NO_STAY: '#F97316', DEADLINE: '#3B82F6', EVENT: '#22C55E' }

function getDday(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return 'D-Day'
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [thisWeekRequest, setThisWeekRequest] = useState(undefined)
  const [schedules, setSchedules] = useState([])
  const [notices, setNotices] = useState([])

  useEffect(() => {
    async function fetchAll() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const today = new Date().toISOString().split('T')[0]

      const [{ data: profile }, { data: requests }, { data: scheds }, { data: noticeList }] =
        await Promise.all([
          supabase.from('users').select('name, room_number').eq('id', authUser.id).single(),
          supabase.from('stay_requests').select('*').eq('user_id', authUser.id)
            .gte('end_date', today).order('created_at', { ascending: false }).limit(1),
          supabase.from('schedules').select('*').gte('end_date', today).order('start_date').limit(4),
          supabase.from('notices').select('id, title, is_pinned, created_at')
            .order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
        ])

      setUser(profile)
      setThisWeekRequest(requests?.[0] ?? null)
      setSchedules(scheds ?? [])
      setNotices(noticeList ?? [])
    }
    fetchAll()
  }, [])

  return (
    <div className={styles.page}>
      <div className="pageWrap">
        {/* 상단 인사 */}
        <div className={styles.topRow}>
          <div>
            <p className={styles.greeting}>안녕하세요 👋</p>
            <h1 className={styles.name}>{user?.name ?? ''}님, 오늘도 좋은 하루 되세요!</h1>
          </div>
          <Link to="/stay-request" className="btn-primary">+ 외박 신청하기</Link>
        </div>

        {/* 이번 주 상태 + 다가오는 일정 */}
        <div className={styles.gridTop}>
          {/* 이번 주 외박 상태 */}
          <div className={styles.statusCard}>
            <p className={styles.cardLabel}>이번 주 신청 상태</p>
            {thisWeekRequest === undefined ? (
              <p className={styles.loadingTxt}>불러오는 중...</p>
            ) : thisWeekRequest ? (
              <div className={styles.requestDone}>
                <span className={styles.bigIcon}>✅</span>
                <div>
                  <p className={styles.requestType}>{thisWeekRequest.type}</p>
                  <p className={styles.requestSub}>{thisWeekRequest.start_date} ~ {thisWeekRequest.end_date}</p>
                  <span className={`badge-${thisWeekRequest.status === 'approved' ? 'green' : thisWeekRequest.status === 'rejected' ? 'red' : 'blue'}`}>
                    {STATUS_LABEL[thisWeekRequest.status]}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.requestNone}>
                <span className={styles.bigIcon}>⚠️</span>
                <div>
                  <p className={styles.requestNoneTxt}>아직 신청하지 않았어요</p>
                  <Link to="/stay-request" className={styles.requestLink}>지금 신청하기 →</Link>
                </div>
              </div>
            )}
          </div>

          {/* 다가오는 일정 */}
          <div className={`card ${styles.scheduleCard}`}>
            <div className={styles.cardHeader}>
              <p className={styles.cardTitle}>다가오는 일정</p>
              <Link to="/calendar" className={styles.moreLink}>전체보기</Link>
            </div>
            {schedules.length === 0 ? (
              <p className={styles.emptyTxt}>예정된 일정이 없어요</p>
            ) : (
              <div className={styles.scheduleList}>
                {schedules.map(s => (
                  <div key={s.id} className={styles.scheduleItem}>
                    <span className={styles.dot} style={{ background: CATEGORY_COLOR[s.category] }} />
                    <div className={styles.scheduleInfo}>
                      <p className={styles.scheduleTitle}>{s.title}</p>
                      <p className={styles.scheduleDate}>{s.start_date} · {CATEGORY_LABEL[s.category]}</p>
                    </div>
                    <span className={styles.dday}>{getDday(s.start_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className={`card ${styles.quickSection}`}>
          <p className={styles.cardTitle} style={{ marginBottom: 20 }}>바로가기</p>
          <div className={styles.quickGrid}>
            {[
              { to: '/stay-request', icon: '📝', label: '외박 신청' },
              { to: '/stay-history', icon: '📋', label: '신청 내역' },
              { to: '/calendar', icon: '📅', label: '일정 캘린더' },
              { to: '/notices', icon: '📢', label: '공지사항' },
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to} className={styles.quickItem}>
                <span className={styles.quickIcon}>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 최신 공지 */}
        <div className={`card ${styles.noticeSection}`}>
          <div className={styles.cardHeader}>
            <p className={styles.cardTitle}>최신 공지</p>
            <Link to="/notices" className={styles.moreLink}>전체보기</Link>
          </div>
          {notices.length === 0 ? (
            <p className={styles.emptyTxt}>등록된 공지가 없어요</p>
          ) : (
            <div className={styles.noticeList}>
              {notices.map(n => (
                <Link key={n.id} to="/notices" className={styles.noticeItem}>
                  {n.is_pinned && <span className="badge-red">긴급</span>}
                  <p className={styles.noticeTitle}>{n.title}</p>
                  <p className={styles.noticeDate}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                  <span className={styles.arrow}>›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
