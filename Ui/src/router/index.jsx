import { createBrowserRouter } from 'react-router-dom'
import { AuthRoute, GuestRoute } from './AuthRoute'
import App from '../App'
import HomePage from '../pages/HomePage'
import AnimePage from '../pages/AnimePage'
import AnimeDetailPage from '../pages/AnimeDetailPage'
import SettingsPage from '../pages/SettingsPage'
import LoginPage from '../pages/LoginPage'
import ProfilePage from '../pages/ProfilePage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <AuthRoute>
        <App />
      </AuthRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'monitor', element: <AnimePage /> },
      { path: 'monitor/:id', element: <AnimeDetailPage /> },
      { path: 'profile', element: <ProfilePage/>}
    ],
  },
])

export default router