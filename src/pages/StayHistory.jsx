import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import styles from './StayHistory.module.css'

const STATUS_LABEL = { applied: '신청완료', approved: '승인', rejected: '반려' }
const STATUS_COLOR = { applied: 'blue', approved: 'green', rejected: 'red' }

const DETAIL_FIELDS = [
  { key: 'type', label: '외박 유형' },
  { key: 'start_date', label: '시작일' },
  { key: 'end_date', label: '종료일' },
  { key: 'created_at', label: '신청일' },
]

export default function StayHistory() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('stay_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setRequests(data ?? [])
    setLoading(false)
  }

  function formatDate(str) {
    if (!str) return '-'
    return str.includes('T')
      ? new Date(str).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : str
  }

  function groupByMonth(list) {
    return list.reduce((acc, item) => {
      const month = item.start_date.slice(0, 7)
      if (!acc[month]) acc[month] = []
      acc[month].push(item)
      return acc
    }, {})
  }

  const grouped = groupByMonth(requests)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>신청 내역</h1>
      </header>

      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : requests.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.empty}>신청 내역이 없어요</p>
        </div>
      ) : (
        <div className={styles.listWrap}>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className={styles.monthLabel}>{month.replace('-', '년 ')}월</p>
              <div className={styles.group}>
                {items.map(item => (
                  <button
                    key={item.id}
                    className={styles.item}
                    onClick={() => setSelected(item)}
                  >
                    <div className={styles.itemLeft}>
                      <span className={`${styles.badge} ${styles[STATUS_COLOR[item.status]]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                      <p className={styles.itemType}>{item.type}</p>
                      <p className={styles.itemDate}>{formatDate(item.start_date)} ~ {formatDate(item.end_date)}</p>
                    </div>
                    <span className={styles.arrow}>›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>신청 상세</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {DETAIL_FIELDS.map(({ key, label }) => (
                <div key={key} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{label}</span>
                  <span className={styles.detailValue}>
                    {key === 'created_at' ? formatDate(selected[key]) : selected[key]}
                  </span>
                </div>
              ))}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>상태</span>
                <span className={`${styles.badge} ${styles[STATUS_COLOR[selected.status]]}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />
      <BottomNav />
    </div>
  )
}
