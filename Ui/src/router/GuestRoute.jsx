import { Navigate } from 'react-router-dom'
import { isLogin } from '../utils/auth'

export default function GuestRoute({ children }) {
  if (isLogin()) {
    // 已登录还访问登录页 -> 直接回首页
    return <Navigate to="/" replace />
  }

  return children
}