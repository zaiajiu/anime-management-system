import { Navigate, useLocation } from 'react-router-dom';
import { isLogin } from '@/utils/auth';

/**
 * 1. 登录守卫：必须登录才能访问（如：首页、动漫列表、个人中心）
 */
export function AuthRoute({ children }) {
  var location = useLocation();
  var loggedIn = isLogin(); // 从 localStorage 取 token

  if (!loggedIn) {
    // 如果没登录，强制跳转到登录页，并把当前所在的路径记录下来（登录后能跳回来）
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * 2. 管理员守卫：必须是 ADMIN 角色才能访问（如：/admin 后台页面）
 */
export function AdminRoute({ children }) {
  var location = useLocation();
  var loggedIn = isLogin();
  var role = localStorage.getItem('role'); // 获取角色

  // 如果没登录，去登录页
  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果登录了，但不是管理员，直接踢回普通首页
  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * 3. 游客守卫：已登录用户不能访问（如：登录页、注册页）
 */
export function GuestRoute({ children }) {
  var loggedIn = isLogin();

  // 如果已经登录了，还想去登录页，直接踢回首页
  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}