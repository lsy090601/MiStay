import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './StayHistory.module.css'

const STATUS_LABEL = { applied: '신청완료', approved: '승인', rejected: '반려' }
const STATUS_CLASS = { applied: 'badge-blue', approved: 'badge-green', rejected: 'badge-red' }

export default function StayHistory() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('stay_requests').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      setRequests(data ?? [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  function formatDate(str) {
    if (!str) return '-'
    return str.includes('T')
      ? new Date(str).toLocaleDateString('ko-KR')
      : str
  }

  return (
    <div className={styles.page}>
      <div className="pageWrap">
        <h1 className="pageTitle">신청 내역</h1>

        <div className={`card`}>
          {loading ? (
            <p className={styles.empty}>불러오는 중...</p>
          ) : requests.length === 0 ? (
            <div className={styles.emptyBox}>
              <p style={{ fontSize: 48 }}>📋</p>
              <p className={styles.empty}>신청 내역이 없어요</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>신청일</th>
                  <th>유형</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className={styles.row} onClick={() => setSelected(r)}>
                    <td>{formatDate(r.created_at)}</td>
                    <td><strong>{r.type}</strong></td>
                    <td>{r.start_date}</td>
                    <td>{r.end_date}</td>
                    <td><span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span></td>
                    <td className={styles.arrowCell}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>신청 상세</h2>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.detailGrid}>
              {[['외박 유형', selected.type], ['시작일', selected.start_date], ['종료일', selected.end_date],
                ['신청일', formatDate(selected.created_at)], ['상태', STATUS_LABEL[selected.status]]].map(([label, val]) => (
                <div key={label} className={styles.detailItem}>
                  <p className={styles.detailLabel}>{label}</p>
                  <p className={styles.detailValue}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
