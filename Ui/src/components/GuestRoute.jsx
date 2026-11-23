// src/components/GuestRoute.jsx
import { Navigate } from 'react-router-dom'
import { isLogin } from '@/utils/auth' // 引入你的登录状态判断方法

export default function GuestRoute({ children }) {
  const loggedIn = isLogin()

  // 如果已经登录了，就不允许看登录页，直接踢回首页（或者后台）
  if (loggedIn) {
    return <Navigate to="/" replace />
  }

  // 如果没登录，正常展示登录页
  return children
}