import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../App.css'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!studentId || !password) { setError('학번과 비밀번호를 입력해주세요.'); return }
    setLoading(true); setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: `${studentId}@mistay.kr`,
      password,
    })

    if (error) { setError('학번 또는 비밀번호가 올바르지 않습니다.'); setLoading(false); return }
    navigate('/')
  }

  return (
    <div className={styles.bg}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🏠</div>
          <h1 className={styles.title}>MiStay</h1>
          <p className={styles.subtitle}>기숙사 외박 관리 서비스</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <p className="error-msg">{error}</p>}

          <div className="input-group">
            <label>학번</label>
            <input type="text" placeholder="예) 2413" value={studentId}
              onChange={e => setStudentId(e.target.value)} inputMode="numeric" />
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <input type="password" placeholder="비밀번호를 입력하세요" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>

          <label className={styles.autoLogin}>
            <input type="checkbox" checked={autoLogin} onChange={e => setAutoLogin(e.target.checked)} />
            <span>자동 로그인</span>
          </label>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className={styles.registerLink}>
          계정이 없으신가요? <Link to="/register" className={styles.link}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}
