import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AuthRoute, GuestRoute } from './AuthRoute'
import App from '../App'
import HomePage from '../pages/HomePage'
import AnimePage from '../pages/AnimePage'
import AnimeDetailPage from '../pages/AnimeDetailPage'
import SettingsPage from '../pages/SettingsPage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'
import AddAnimePage from '../components/AddAnimeDialog'

const router = createBrowserRouter([
  // 1. 登录页：已登录不能进（保持原样）
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  
  // 2. 主布局：所有人都能进来（包括 App 的侧边栏）
  {
    path: '/',
    element: <App />, 
    children: [
      // ★ 核心 1：首页直接放出来，不需要登录
      { index: true, element: <HomePage /> },

      // ★ 核心 2：把需要登录的页面，用一个单独的子路由包起来
      {
        element: <AuthRoute><Outlet /></AuthRoute>, // 用 Outlet 作为占位
        children: [
          { path: 'settings', element: <SettingsPage /> },
          { path: 'monitor', element: <AnimePage /> },
          { path: 'monitor/create', element: <AddAnimePage /> },
          { path: 'monitor/:id', element: <AnimeDetailPage /> },
          { path: 'profile', element: <ProfilePage/> }
        ]
      }
    ],
  },
])

export default router