import { Outlet, useNavigate, Link } from 'react-router-dom'
import { removeToken } from '../utils/auth'

export default function MainLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    removeToken()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <header style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #eee' }}>
        <Link to="/">首页</Link>
        <Link to="/dashboard">仪表盘</Link>
        <Link to="/monitor">动漫</Link>  
        <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
          退出登录
        </button>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}