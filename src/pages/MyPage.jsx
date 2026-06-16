import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './MyPage.module.css'

export default function MyPage() {
  const [profile, setProfile] = useState(null)
  const [editPhone, setEditPhone] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [editPw, setEditPw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(data)
      setNewPhone(data?.parent_contact ?? '')
    }
    fetchProfile()
  }, [])

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7,11)}`
  }

  async function handleSavePhone() {
    setMsg(''); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('users').update({ parent_contact: newPhone }).eq('id', user.id)
    if (error) { setError('수정에 실패했어요.'); return }
    setProfile(prev => ({ ...prev, parent_contact: newPhone }))
    setEditPhone(false); setMsg('전화번호가 수정되었어요.')
  }

  async function handleSavePw() {
    setMsg(''); setError('')
    if (newPw.length < 6) { setError('비밀번호는 6자리 이상이어야 해요.'); return }
    if (newPw !== newPwConfirm) { setError('비밀번호가 일치하지 않아요.'); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setError('비밀번호 변경에 실패했어요.'); return }
    setEditPw(false); setNewPw(''); setNewPwConfirm('')
    setMsg('비밀번호가 변경되었어요.')
  }

  const infoRows = [
    { label: '학번', value: profile?.student_id },
    { label: '이름', value: profile?.name },
    { label: '기숙사 호실', value: profile?.room_number },
  ]

  return (
    <div className={styles.page}>
      <div className="pageWrap">
        <h1 className="pageTitle">마이페이지</h1>

        <div className={styles.layout}>
          {/* 프로필 카드 */}
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{profile?.name?.[0] ?? '?'}</div>
            <div>
              <p className={styles.profileName}>{profile?.name}</p>
              <p className={styles.profileSub}>{profile?.student_id} · {profile?.room_number}</p>
            </div>
          </div>

          <div className={styles.mainArea}>
            {msg && <p className="success-msg" style={{ marginBottom: 16 }}>{msg}</p>}
            {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

            {/* 내 정보 */}
            <div className={`card ${styles.section}`}>
              <p className={styles.sectionTitle}>내 정보</p>
              <div className={styles.infoList}>
                {infoRows.map(({ label, value }) => (
                  <div key={label} className={styles.infoRow}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </div>
                ))}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>부모님 번호</span>
                  {editPhone ? (
                    <div className={styles.editRow}>
                      <input className={styles.editInput} value={newPhone}
                        onChange={e => setNewPhone(formatPhone(e.target.value))}
                        maxLength={13} inputMode="numeric" />
                      <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }} onClick={handleSavePhone}>저장</button>
                      <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: 14 }} onClick={() => setEditPhone(false)}>취소</button>
                    </div>
                  ) : (
                    <div className={styles.editRow}>
                      <span className={styles.infoValue}>{profile?.parent_contact}</span>
                      <button className={styles.editBtn} onClick={() => setEditPhone(true)}>수정</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div className={`card ${styles.section}`}>
              <p className={styles.sectionTitle}>보안</p>
              {editPw ? (
                <div className={styles.pwForm}>
                  <div className={styles.pwGrid}>
                    <div className="input-group">
                      <label>새 비밀번호</label>
                      <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="6자리 이상" />
                    </div>
                    <div className="input-group">
                      <label>비밀번호 확인</label>
                      <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} placeholder="비밀번호 재입력" />
                    </div>
                  </div>
                  <div className={styles.pwBtns}>
                    <button className="btn-secondary" onClick={() => setEditPw(false)}>취소</button>
                    <button className="btn-primary" onClick={handleSavePw}>비밀번호 변경</button>
                  </div>
                </div>
              ) : (
                <button className={styles.menuItem} onClick={() => setEditPw(true)}>
                  <span>비밀번호 변경</span><span className={styles.arrow}>›</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
