import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { setToken } from '../../utils/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  // 登录成功后跳回的路径（默认为首页）
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      alert('请输入用户名和密码')
      return
    }

    try {
      setLoading(true)

      // ===== 真实项目替换成接口请求 =====
      // const res = await loginApi(form)
      // setToken(res.data.token)

      // 这里模拟登录：任意账号密码都成功
      await new Promise((r) => setTimeout(r, 500))
      setToken('mock-token-' + Date.now())

      navigate(from, { replace: true })
    } catch (err) {
      alert('登录失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
        <h2>登录</h2>
        <input
          placeholder="用户名"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="密码"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}