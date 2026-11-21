import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'
import './index.css';

import App from './App';
import LoginPage from './pages/LoginPage';//登录页
import HomePage from './pages/HomePage';//主页
import AnimePage from './pages/AnimePage';//动漫展示页
import AddAnimePage from './pages/AddAnimePage';//添加页面
import UpDateAnimePage  from './pages/UpDateAnimePage';//详情页（修改页）
import ProtectedRoute from './components/ProtectedRoute';//路由守卫


var router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  
  {
    path: '/',
    element: <App />, // App 作为主布局（比如包含左侧菜单栏）
    children: [
      { index: true, element: <HomePage /> },
      { path: 'monitor', element: <ProtectedRoute><AnimePage /></ProtectedRoute> },
      { path: 'add', element: <ProtectedRoute><AddAnimePage /></ProtectedRoute> },
      { path:'update/:id', element:<ProtectedRoute><UpDateAnimePage /></ProtectedRoute>},
    ],
    
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);