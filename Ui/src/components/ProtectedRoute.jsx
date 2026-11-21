import { Navigate, useLocation } from 'react-router-dom'
import { isLogin } from '@/utils/auth'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const loggedIn = isLogin()

  // 如果没登录，重定向到 /login，并把这个页面的路径存到 state 里
  // 这样登录成功后，可以直接跳回这个页面
  if (!loggedIn) {
    console.log("未登录，去登录页")
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // 如果已登录，正常渲染子组件
  return children
}