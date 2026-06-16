import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Register.module.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    studentId: '',
    name: '',
    roomNumber: '',
    parentContact: '',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }

  function handlePhoneChange(e) {
    setForm(prev => ({ ...prev, parentContact: formatPhone(e.target.value) }))
  }

  async function handleRegister(e) {
    e.preventDefault()
    const { studentId, name, roomNumber, parentContact, password, passwordConfirm } = form

    if (!studentId || !name || !roomNumber || !parentContact || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 합니다.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    setError('')

    const email = `${studentId}@mistay.kr`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          student_id: studentId,
          name,
          room_number: roomNumber,
          parent_contact: parentContact,
        },
      },
    })

    if (error) {
      setError(error.message.includes('already registered')
        ? '이미 가입된 학번입니다.'
        : '회원가입에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className={styles.bg}>
      <div className={styles.card}>
        <h1 className={styles.title}>간편 회원가입</h1>

        <form className={styles.form} onSubmit={handleRegister}>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>학번</label>
              <input
                className={styles.input}
                name="studentId"
                type="text"
                placeholder="예) 2413"
                value={form.studentId}
                onChange={handleChange}
                inputMode="numeric"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>기숙사 호실</label>
              <input
                className={styles.input}
                name="roomNumber"
                type="text"
                placeholder="예) 301호"
                value={form.roomNumber}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>이름</label>
              <input
                className={styles.input}
                name="name"
                type="text"
                placeholder="이름 입력"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>부모님 전화번호</label>
              <input
                className={styles.input}
                name="parentContact"
                type="tel"
                placeholder="010-0000-0000"
                value={form.parentContact}
                onChange={handlePhoneChange}
                inputMode="numeric"
                maxLength={13}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>비밀번호</label>
              <input
                className={styles.input}
                name="password"
                type="password"
                placeholder="6자리 이상"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>비밀번호 확인</label>
              <input
                className={styles.input}
                name="passwordConfirm"
                type="password"
                placeholder="비밀번호 재입력"
                value={form.passwordConfirm}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? '등록 중...' : '등록'}
          </button>
        </form>

        <p className={styles.loginLink}>
          이미 계정이 있으신가요? <Link to="/login" className={styles.link}>로그인</Link>
        </p>
      </div>
    </div>
  )
}
