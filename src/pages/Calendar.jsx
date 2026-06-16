import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './Calendar.module.css'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const CATEGORY_COLOR = { MANDATORY_EXIT: '#EF4444', NO_STAY: '#F97316', DEADLINE: '#3B82F6', EVENT: '#22C55E' }
const CATEGORY_LABEL = { MANDATORY_EXIT: '필수 퇴실', NO_STAY: '잔류 불가', DEADLINE: '신청 마감', EVENT: '일반 일정' }

export default function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [schedules, setSchedules] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetchSchedules() {
      const firstDay = `${year}-${String(month+1).padStart(2,'0')}-01`
      const lastDay = new Date(year, month+1, 0).toISOString().split('T')[0]
      const { data } = await supabase.from('schedules').select('*')
        .lte('start_date', lastDay).gte('end_date', firstDay)
      setSchedules(data ?? [])
    }
    fetchSchedules()
  }, [year, month])

  function getSchedulesForDate(dateStr) {
    return schedules.filter(s => s.start_date <= dateStr && s.end_date >= dateStr)
  }

  function getCells() {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month+1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  function prevMonth() { month === 0 ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1) }
  function nextMonth() { month === 11 ? (setYear(y=>y+1), setMonth(0)) : setMonth(m=>m+1) }

  const cells = getCells()
  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className={styles.page}>
      <div className="pageWrap">
        <h1 className="pageTitle">일정 캘린더</h1>

        <div className={styles.layout}>
          {/* 달력 */}
          <div className={`card ${styles.calCard}`}>
            {/* 월 이동 */}
            <div className={styles.monthNav}>
              <button className={styles.navBtn} onClick={prevMonth}>‹</button>
              <span className={styles.monthLabel}>{year}년 {month+1}월</span>
              <button className={styles.navBtn} onClick={nextMonth}>›</button>
            </div>

            <div className={styles.dayHeaders}>
              {DAYS.map((d,i) => (
                <span key={d} className={`${styles.dayLabel} ${i===0?styles.sun:i===6?styles.sat:''}`}>{d}</span>
              ))}
            </div>

            <div className={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const dayScheds = getSchedulesForDate(dateStr)
                const isToday = dateStr === todayStr
                const weekday = i % 7
                return (
                  <div key={dateStr}
                    className={`${styles.cell} ${isToday?styles.today:''} ${dayScheds.length>0?styles.hasEvent:''}`}
                    onClick={() => dayScheds.length > 0 && setSelected({ dateStr, dayScheds })}
                  >
                    <span className={`${styles.dayNum} ${weekday===0?styles.sun:weekday===6?styles.sat:''}`}>{day}</span>
                    <div className={styles.dots}>
                      {dayScheds.slice(0,3).map(s => (
                        <span key={s.id} className={styles.dot} style={{ background: CATEGORY_COLOR[s.category] }} />
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
          </div>

          {/* 이번 달 일정 목록 */}
          <div className={styles.sidebar}>
            <div className={`card`}>
              <p className={styles.sideTitle}>{month+1}월 일정</p>
              {schedules.length === 0 ? (
                <p className={styles.emptyTxt}>이번 달 일정이 없어요</p>
              ) : (
                <div className={styles.scheduleList}>
                  {schedules.map(s => (
                    <div key={s.id} className={styles.scheduleItem}
                      onClick={() => setSelected({ dateStr: s.start_date, dayScheds: [s] })}>
                      <div className={styles.scheduleLeft}>
                        <span className={styles.dot} style={{ background: CATEGORY_COLOR[s.category] }} />
                        <div>
                          <p className={styles.scheduleTitle}>{s.title}</p>
                          <p className={styles.scheduleDate}>{s.start_date}{s.start_date !== s.end_date ? ` ~ ${s.end_date}` : ''}</p>
                        </div>
                      </div>
                      {s.is_essential && <span className="badge-red">필수</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selected.dateStr} 일정</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            {selected.dayScheds.map(s => (
              <div key={s.id} className={styles.modalItem}>
                <div className={styles.modalItemTop}>
                  <span className={styles.dot} style={{ background: CATEGORY_COLOR[s.category] }} />
                  <strong>{s.title}</strong>
                  {s.is_essential && <span className="badge-red">필수</span>}
                </div>
                {s.description && <p className={styles.modalDesc}>{s.description}</p>}
                <p className={styles.modalMeta}>{CATEGORY_LABEL[s.category]} · {s.start_date}{s.start_date!==s.end_date?` ~ ${s.end_date}`:''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
