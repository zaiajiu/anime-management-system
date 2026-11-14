import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AuthRoute, GuestRoute } from './AuthRoute'; 

import App from '../App';

import HomePage from '../pages/HomePage';
import AnimePage from '../pages/AnimePage';
import AnimeDetailPage from '../pages/AnimeDetailPage';
import SettingsPage from '../pages/SettingsPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import AdminRoute  from './AdminRoute'

import AddAnimeDialog from '../components/AddAnimeDialog'; 
import AdminPage from '../pages/AdminPage';

const router = createBrowserRouter([
  // =========================================================
  // 1. 登录页：已登录不能进
  // =========================================================
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  
  // =========================================================
  // 2. 主布局：所有人（包括游客）都能看到外面的壳子
  // =========================================================
  {
    path: '/',
    element: <App />, 
    children: [
      // 首页无需登录
      { index: true, element: <HomePage /> },

      // 需要登录才能进的页面，用 Outlet 包起来
      {
        element: <AuthRoute><Outlet /></AuthRoute>, 
        children: [
          { path: 'settings', element: <SettingsPage /> },
          { path: 'monitor', element: <AnimePage /> },
          { path: 'monitor/create', element: <AddAnimeDialog /> }, 
          { path: 'monitor/:id', element: <AnimeDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          
          // ★ 核心：管理员专属页面写在这里面，或者单独拆出去（见下面说明）
          { path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> }, 
        ]
      }
    ],
  },
]);

export default router;