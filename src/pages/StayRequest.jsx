import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import '../App.css'
import styles from './StayRequest.module.css'

const TYPES = ['금토외박', '토외박', '잔류']

function getAutoDate(type) {
  const today = new Date()
  const day = today.getDay()
  const friday = new Date(today)
  friday.setDate(today.getDate() + ((5 - day + 7) % 7 || 7))
  const saturday = new Date(friday)
  saturday.setDate(friday.getDate() + 1)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)

  const fmt = d => d.toISOString().split('T')[0]

  if (type === '금토외박') return { start: fmt(friday), end: fmt(sunday) }
  if (type === '토외박') return { start: fmt(saturday), end: fmt(sunday) }
  return { start: fmt(friday), end: fmt(sunday) }
}

export default function StayRequest() {
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [parentContact, setParentContact] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('users')
        .select('parent_contact')
        .eq('id', user.id)
        .single()
      if (data) setParentContact(data.parent_contact)
    }
    loadUser()
  }, [])

  function handleTypeSelect(t) {
    setType(t)
    const { start, end } = getAutoDate(t)
    setStartDate(start)
    setEndDate(end)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!type) { setError('외박 유형을 선택해주세요.'); return }
    if (!startDate || !endDate) { setError('날짜를 선택해주세요.'); return }
    if (endDate < startDate) { setError('종료일이 시작일보다 빠를 수 없어요.'); return }
    if (!parentContact) { setError('부모님 연락처를 입력해주세요.'); return }

    setLoading(true)

    // 중복 신청 확인
    const { data: dup } = await supabase
      .from('stay_requests')
      .select('id')
      .eq('user_id', userId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .limit(1)

    if (dup && dup.length > 0) {
      setError('해당 기간에 이미 신청한 내역이 있어요.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('stay_requests').insert({
      user_id: userId,
      type,
      start_date: startDate,
      end_date: endDate,
    })

    if (insertError) {
      setError('신청에 실패했어요. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <p className={styles.successIcon}>✅</p>
          <h2 className={styles.successTitle}>신청 완료!</h2>
          <p className={styles.successDesc}>
            {type} 신청이 접수되었어요.<br />
            {startDate} ~ {endDate}
          </p>
          <button className="btn-primary" onClick={() => navigate('/stay-history')}>
            신청 내역 확인
          </button>
          <button className={styles.homeBtn} onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.title}>외박 신청</h1>
        <div style={{ width: 32 }} />
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className="error-msg">{error}</p>}

        {/* 유형 선택 */}
        <div className={styles.section}>
          <p className={styles.label}>외박 유형</p>
          <div className={styles.typeGroup}>
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                className={`${styles.typeBtn} ${type === t ? styles.typeSelected : ''}`}
                onClick={() => handleTypeSelect(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 선택 */}
        <div className={styles.section}>
          <p className={styles.label}>날짜 선택</p>
          <div className={styles.dateRow}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <span className={styles.dateSep}>~</span>
            <div className="input-group" style={{ flex: 1 }}>
              <label>종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 부모님 연락처 */}
        <div className={styles.section}>
          <p className={styles.label}>부모님 연락처</p>
          <div className="input-group">
            <input
              type="tel"
              value={parentContact}
              onChange={e => setParentContact(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          <p className={styles.hint}>등록된 번호가 자동으로 입력돼요</p>
        </div>

        {/* 요약 */}
        {type && startDate && endDate && (
          <div className={styles.summary}>
            <p className={styles.summaryTitle}>신청 내용 확인</p>
            <div className={styles.summaryRow}>
              <span>유형</span><span>{type}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>기간</span><span>{startDate} ~ {endDate}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>연락처</span><span>{parentContact}</span>
            </div>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? '신청 중...' : '외박 신청하기'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
