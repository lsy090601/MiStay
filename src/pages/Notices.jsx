import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import styles from './Notices.module.css'

export default function Notices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    setNotices(data ?? [])
    setLoading(false)
  }

  function formatDate(str) {
    return new Date(str).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>공지사항</h1>
      </header>

      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : notices.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>📢</p>
          <p className={styles.empty}>등록된 공지가 없어요</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notices.map(n => (
            <button key={n.id} className={styles.item} onClick={() => setSelected(n)}>
              <div className={styles.itemTop}>
                {n.is_pinned && <span className={styles.pinnedBadge}>긴급</span>}
                <p className={styles.itemTitle}>{n.title}</p>
              </div>
              <p className={styles.itemDate}>{formatDate(n.created_at)}</p>
            </button>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                {selected.is_pinned && <span className={styles.pinnedBadge}>긴급</span>}
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

      <div style={{ height: 80 }} />
      <BottomNav />
    </div>
  )
}
