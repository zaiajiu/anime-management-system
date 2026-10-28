import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLogin, clearAuth } from '../utils/auth';
import { getUserInfoApi } from '../api/user';
import logger from '@/utils/logger';

/**
 * 需要登录才能访问的路由
 * 逻辑：
 *   1. 检查本地 token
 *   2. 调后端 /api/user/info 确认 Session 是否还在
 *   3. Session 有 → 放行；Session 没 → 清 token，跳登录页
 */
export function AuthRoute(props) {
  var location = useLocation();

  // 是否正在向后端确认
  var checkingState = useState(true);
  var checking = checkingState[0];
  var setChecking = checkingState[1];

  // 后端是否确认已登录
  var validState = useState(false);
  var valid = validState[0];
  var setValid = validState[1];

  useEffect(function () {
    // 组件已卸载标记，避免异步回来时更新已卸载的组件
    var cancelled = false;

    function checkLoginStatus() {
      // 第一步：本地连 token 都没有 → 直接未登录
      var localToken = isLogin();
      if (localToken === false) {
        logger.debug('AuthRoute', '本地没有 token，直接跳登录页');
        if (cancelled === false) {
          setValid(false);
          setChecking(false);
        }
        return;
      }

      // 第二步：有 token，向后端确认 Session
      getUserInfoApi()
        .then(function (res) {
          if (cancelled === true) {
            return;
          }
          if (res.success === true) {
            setValid(true);
          } else {
            clearAuth();
            setValid(false);
          }
          setChecking(false);
        })
        .catch(function (err) {
          // 网络错误（比如后端没启动）也当作未登录
          logger.error('AuthRoute', '确认登录状态失败', err);
          if (cancelled === false) {
            clearAuth();
            setValid(false);
            setChecking(false);
          }
        });
    }

    checkLoginStatus();

    return function () {
      cancelled = true;
    };
  }, [location.pathname]);   // 每次路径变化都重新确认一次

  // 正在确认 → 显示"加载中"
  if (checking === true) {
    return (
      <div style={{ padding: '20px' }}>
        正在确认登录状态...
      </div>
    );
  }

  // 未登录 → 跳登录页，同时记录"原来想去哪"
  if (valid === false) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace={true}
      />
    );
  }

  // 已登录 → 渲染子内容
  return props.children;
}


/**
 * 只允许"未登录"访问的路由（比如登录页本身）
 * 逻辑：
 *   只要本地有 token 就认为已登录 → 踢回首页
 */
export function GuestRoute(props) {
  var localToken = isLogin();

  if (localToken === true) {

    return <Navigate to="/" replace={true} />;
  }

  return props.children;
}