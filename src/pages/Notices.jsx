import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './Notices.module.css'

export default function Notices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetchNotices() {
      const { data } = await supabase.from('notices').select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      setNotices(data ?? [])
      setLoading(false)
    }
    fetchNotices()
  }, [])

  function formatDate(str) {
    return new Date(str).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  return (
    <div className={styles.page}>
      <div className="pageWrap">
        <h1 className="pageTitle">공지사항</h1>

        <div className={`card`}>
          {loading ? (
            <p className={styles.empty}>불러오는 중...</p>
          ) : notices.length === 0 ? (
            <div className={styles.emptyBox}>
              <p style={{ fontSize: 48 }}>📢</p>
              <p className={styles.empty}>등록된 공지가 없어요</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>구분</th>
                  <th>제목</th>
                  <th style={{ width: 130 }}>작성일</th>
                </tr>
              </thead>
              <tbody>
                {notices.map(n => (
                  <tr key={n.id} className={styles.row} onClick={() => setSelected(n)}>
                    <td>{n.is_pinned ? <span className="badge-red">긴급</span> : <span className="badge-blue" style={{ background: '#F9FAFB', color: '#9CA3AF' }}>일반</span>}</td>
                    <td><span className={styles.noticeTitle}>{n.title}</span></td>
                    <td className={styles.dateCell}>{formatDate(n.created_at)}</td>
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
              <div className={styles.modalMeta}>
                {selected.is_pinned && <span className="badge-red">긴급</span>}
                <h2 className={styles.modalTitle}>{selected.title}</h2>
                <p className={styles.modalDate}>{formatDate(selected.created_at)}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.divider} />
            <p className={styles.modalContent}>{selected.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
