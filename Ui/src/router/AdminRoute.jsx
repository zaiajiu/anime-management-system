import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LogInIcon, ShieldAlertIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clearAuth, getRole, getUsername, isLogin } from '@/utils/auth';

// ============================================================
// 管理员路由守卫
//   1. 未登录 → 去登录页，并记住来源
//   2. 已登录但不是 ADMIN → 展示无权限页，不再用 alert 打断
//   3. 是管理员 → 放行
// ============================================================
export default function AdminRoute(props) {
  var location = useLocation();

  if (isLogin() === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (getRole() !== 'ADMIN') {
    return <AdminForbidden />;
  }

  return props.children;
}

function AdminForbidden() {
  var navigate = useNavigate();
  var username = getUsername();

  function handleSwitchAccount() {
    clearAuth();
    window.location.replace('/login');
  }

  function handleBackHome() {
    navigate('/');
  }

  return (
    <div className="-m-4 flex min-h-[calc(100vh-2rem)] items-center justify-center p-4 text-left sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0">
        <CardContent className="p-8 text-center sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-sm">
            <ShieldAlertIcon className="size-7" />
          </div>

          <p className="mt-6 text-[10px] font-medium tracking-[0.22em] text-slate-400">ACCESS DENIED</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">需要管理员权限</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            当前账号{username ? '「' + username + '」' : ''}没有后台管理权限。如需访问，请使用管理员账号登录。
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={handleBackHome}
              className="h-11 rounded-xl bg-slate-900 px-4 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
            >
              <ArrowLeftIcon className="size-4" />
              返回首页
            </Button>
            <Button
              variant="outline"
              onClick={handleSwitchAccount}
              className="h-11 rounded-xl border-slate-200 px-4 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
            >
              <LogInIcon className="size-4" />
              切换账号
            </Button>
          </div>

          <p className="mt-6 text-[10px] text-slate-300">
            普通账号请继续使用动漫库与个人中心。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
