import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Signup = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        setError(error.message || '登録に失敗しました。')
      } else if (data.session) {
        navigate('/', { replace: true })
      } else {
        setSuccess('確認メールを送信しました。メール内のリンクから認証を完了してください。')
      }
    } catch (err) {
      console.error('Error during sign up:', err)
      setError('予期せぬエラーが発生しました。時間をおいて再度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-md bg-surface border border-default rounded-xl shadow-xl p-8 transition-colors">
        <h1 className="text-2xl font-bold text-center mb-8 text-accent">
          Bar Manager 新規登録
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2 text-accent" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-default focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-surface-alt text-primary transition-colors"
              placeholder="example@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-accent" htmlFor="password">
              パスワード
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-default focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-surface-alt text-primary transition-colors"
                placeholder="パスワードを入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-accent"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.98 8.223C5.725 5.75 8.716 4 12 4c3.284 0 6.275 1.75 8.02 4.223a2.09 2.09 0 010 2.554C18.275 13.25 15.284 15 12 15c-3.284 0-6.275-1.75-8.02-4.223a2.09 2.09 0 010-2.554z" />
                    <circle cx="12" cy="9.5" r="1.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.98 8.223C5.725 5.75 8.716 4 12 4c3.284 0 6.275 1.75 8.02 4.223a2.09 2.09 0 010 2.554c-.456.623-.982 1.193-1.566 1.702M4 4l16 16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.343 10.343a1.5 1.5 0 102.121 2.121" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-accent" htmlFor="confirmPassword">
              パスワード（確認）
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-default focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-surface-alt text-primary transition-colors"
                placeholder="同じパスワードを再入力"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-accent"
                aria-label={showConfirmPassword ? '確認用パスワードを隠す' : '確認用パスワードを表示'}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.98 8.223C5.725 5.75 8.716 4 12 4c3.284 0 6.275 1.75 8.02 4.223a2.09 2.09 0 010 2.554C18.275 13.25 15.284 15 12 15c-3.284 0-6.275-1.75-8.02-4.223a2.09 2.09 0 010-2.554z" />
                    <circle cx="12" cy="9.5" r="1.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.98 8.223C5.725 5.75 8.716 4 12 4c3.284 0 6.275 1.75 8.02 4.223a2.09 2.09 0 010 2.554c-.456.623-.982 1.193-1.566 1.702M4 4l16 16" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.343 10.343a1.5 1.5 0 102.121 2.121" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 dark:text-red-300">{error}</p>}
          {success && <p className="text-sm text-green-500 dark:text-green-400">{success}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-md font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--header-bg)' }}
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </form>
        <p className="text-sm text-center mt-6 text-muted">
          すでにアカウントをお持ちの方は
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="ml-1 underline"
            style={{ color: 'var(--accent)' }}
          >
            ログイン
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
