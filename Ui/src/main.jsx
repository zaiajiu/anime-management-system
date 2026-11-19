import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'
import './index.css';

import App from './App';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AnimePage from './pages/AnimePage';
import AddAnimePage from './pages/AddAnimePage';
import UpDateAnimePage  from './pages/UpDateAnimePage';


var router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/add',
    element: <AddAnimePage />,
  },
  {
    path:'/update/:id',
    element:<UpDateAnimePage />,
  },
  {
    path: '/',
    element: <App />, // App 作为主布局（比如包含左侧菜单栏）
    children: [
      { index: true, element: <HomePage /> },
      { path: 'monitor', element: <AnimePage /> },
      
    ],
    
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);