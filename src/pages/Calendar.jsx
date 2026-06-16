import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import styles from './Calendar.module.css'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const CATEGORY_COLOR = {
  MANDATORY_EXIT: '#EF4444',
  NO_STAY: '#F97316',
  DEADLINE: '#3B82F6',
  EVENT: '#22C55E',
}
const CATEGORY_LABEL = {
  MANDATORY_EXIT: '필수 퇴실',
  NO_STAY: '잔류 불가',
  DEADLINE: '신청 마감',
  EVENT: '일반 일정',
}

export default function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [schedules, setSchedules] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchSchedules()
  }, [year, month])

  async function fetchSchedules() {
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .lte('start_date', lastDay)
      .gte('end_date', firstDay)

    setSchedules(data ?? [])
  }

  function getSchedulesForDate(dateStr) {
    return schedules.filter(s => s.start_date <= dateStr && s.end_date >= dateStr)
  }

  function getDaysInMonth() {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const cells = getDaysInMonth()
  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>일정 캘린더</h1>
      </header>

      {/* 월 이동 */}
      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>{year}년 {month + 1}월</span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div className={styles.dayHeaders}>
        {DAYS.map(d => (
          <span key={d} className={`${styles.dayLabel} ${d === '일' ? styles.sun : d === '토' ? styles.sat : ''}`}>
            {d}
          </span>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const daySchedules = getSchedulesForDate(dateStr)
          const isToday = dateStr === todayStr
          const weekday = (i % 7)

          return (
            <div
              key={dateStr}
              className={`${styles.cell} ${isToday ? styles.today : ''}`}
              onClick={() => daySchedules.length > 0 && setSelected({ dateStr, daySchedules })}
            >
              <span className={`${styles.dayNum} ${weekday === 0 ? styles.sun : weekday === 6 ? styles.sat : ''}`}>
                {day}
              </span>
              <div className={styles.dots}>
                {daySchedules.slice(0, 3).map(s => (
                  <span
                    key={s.id}
                    className={styles.dot}
                    style={{ background: CATEGORY_COLOR[s.category] }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className={styles.legend}>
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: CATEGORY_COLOR[key] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* 이번 달 일정 목록 */}
      {schedules.length > 0 && (
        <div className={styles.scheduleList}>
          <p className={styles.listTitle}>이번 달 일정</p>
          {schedules.map(s => (
            <div key={s.id} className={styles.scheduleItem} onClick={() => setSelected({ dateStr: s.start_date, daySchedules: [s] })}>
              <span className={styles.scheduleDot} style={{ background: CATEGORY_COLOR[s.category] }} />
              <div>
                <p className={styles.scheduleName}>{s.title}</p>
                <p className={styles.scheduleDate}>{s.start_date}{s.start_date !== s.end_date ? ` ~ ${s.end_date}` : ''}</p>
              </div>
              {s.is_essential && <span className={styles.essentialTag}>필수</span>}
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selected.dateStr}</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            {selected.daySchedules.map(s => (
              <div key={s.id} className={styles.modalItem}>
                <div className={styles.modalItemHeader}>
                  <span className={styles.modalDot} style={{ background: CATEGORY_COLOR[s.category] }} />
                  <strong>{s.title}</strong>
                  {s.is_essential && <span className={styles.essentialTag}>필수</span>}
                </div>
                {s.description && <p className={styles.modalDesc}>{s.description}</p>}
                <p className={styles.modalMeta}>{CATEGORY_LABEL[s.category]} · {s.start_date}{s.start_date !== s.end_date ? ` ~ ${s.end_date}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />
      <BottomNav />
    </div>
  )
}
