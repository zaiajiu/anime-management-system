import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { setToken, setUserId, setUsername } from '@/utils/auth';
import { loginApi, registerApi } from '@/api/user';
import logger from '@/utils/logger';
import { toast } from 'sonner'; // ★ 引入

/**
 * 登录 / 注册页面
 * 用 Tabs 切换两个表单
 */
export default function LoginPage() {
  // ============================================================
  // 路由工具
  // ============================================================

  // navigate：用来跳转页面
  var navigate = useNavigate();

  // location：用来读取"从哪跳来的"，登录后跳回去
  var location = useLocation();

  // 如果是从受保护页面跳来的，location.state.from 会记录原始路径
  // 比如访问 /monitor 被拦截跳来登录页，from = /monitor
  // 登录成功后跳回 /monitor
  var from = '/';
  if (location.state !== null && location.state !== undefined) {
    if (location.state.from !== null && location.state.from !== undefined) {
      if (location.state.from.pathname !== null && location.state.from.pathname !== undefined) {
        from = location.state.from.pathname;
      }
    }
  }


  // ============================================================
  // 状态管理
  // ============================================================

  // 当前激活的 tab：'login' 或 'register'
  var tabState = useState('login');
  var tab = tabState[0];
  var setTab = tabState[1];

  // 是否正在提交（防止重复点击）
  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  // 登录表单
  var loginFormState = useState({
    username: '',
    password: ''
  });
  var loginForm = loginFormState[0];
  var setLoginForm = loginFormState[1];

  // 注册表单
  var registerFormState = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  var registerForm = registerFormState[0];
  var setRegisterForm = registerFormState[1];


  // ============================================================
  // 处理登录提交
  // 触发方式：<form onSubmit={handleLogin}>
  // ============================================================

  function handleLogin(event) {
    // 阻止表单默认提交行为（否则会刷新页面）
    event.preventDefault();

    var username = loginForm.username;
    var password = loginForm.password;

  

    // 简单校验
    if (username === '' || password === '') {
      toast.error('请输入用户名和密码');
      logger.warn('LoginPage', '登录表单为空');
      return;
    }

    // 进入请求流程
    setLoading(true);

    loginApi(username, password)
      .then(function (res) {
        // 后端返回失败
        if (res.success === false) {
          logger.warn('LoginPage', '登录失败', {
            message: res.message
          });
          toast.error(res.message);
          return;
        }


        // 保存到本地
        setToken('session-' + Date.now());
        setUserId(res.data.userId);
        setUsername(res.data.username);

        // 跳回原来想去的页面（或首页）
        navigate(from, { replace: true });
      })
      .catch(function (error) {
        logger.error('LoginPage', '登录过程出现异常', error);
        toast.error('登录失败：' + error.message);
      })
      .finally(function () {
        setLoading(false);
      });
  }


  // ============================================================
  // 处理注册提交
  // 触发方式：<form onSubmit={handleRegister}>
  // ============================================================

  function handleRegister(event) {
    // 阻止表单默认提交行为
    event.preventDefault();

    var username = registerForm.username;
    var password = registerForm.password;
    var confirmPassword = registerForm.confirmPassword;

    logger.info('LoginPage', '用户点击注册按钮', {
      username: username
    });

    // 校验：不能为空
    if (username === '' || password === '' || confirmPassword === '') {
      toast.error('请填写所有字段');
      logger.warn('LoginPage', '注册表单有字段为空');
      return;
    }

    // 校验：两次密码一致
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      logger.warn('LoginPage', '两次密码不一致');
      return;
    }

    // 进入请求流程
    setLoading(true);

    registerApi(username, password, confirmPassword)
      .then(function (res) {
        // 后端返回失败
        if (res.success === false) {
          logger.warn('LoginPage', '注册失败', {
            message: res.message
          });
          toast.error(res.message);
          return;
        }


        toast.success('注册成功，请登录');

        // 切到登录 tab，并自动带出刚才注册的用户名
        setTab('login');
        setLoginForm({
          username: username,
          password: ''
        });
        setRegisterForm({
          username: '',
          password: '',
          confirmPassword: ''
        });
      })
      .catch(function (error) {
        logger.error('LoginPage', '注册过程出现异常', error);
        toast.error('注册失败：' + error.message);
      })
      .finally(function () {
        setLoading(false);
      });
  }


  // ============================================================
  // 输入框内容变化时更新状态
  // ============================================================

  /**
   * 登录表单：用户名输入
   */
  function handleLoginUsernameChange(event) {
    var value = event.target.value;
    setLoginForm({
      username: value,
      password: loginForm.password
    });
  }

  /**
   * 登录表单：密码输入
   */
  function handleLoginPasswordChange(event) {
    var value = event.target.value;
    setLoginForm({
      username: loginForm.username,
      password: value
    });
  }

  /**
   * 注册表单：用户名输入
   */
  function handleRegisterUsernameChange(event) {
    var value = event.target.value;
    setRegisterForm({
      username: value,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword
    });
  }

  /**
   * 注册表单：密码输入
   */
  function handleRegisterPasswordChange(event) {
    var value = event.target.value;
    setRegisterForm({
      username: registerForm.username,
      password: value,
      confirmPassword: registerForm.confirmPassword
    });
  }

  /**
   * 注册表单：确认密码输入
   */
  function handleRegisterConfirmChange(event) {
    var value = event.target.value;
    setRegisterForm({
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: value
    });
  }


  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">图书管理系统</CardTitle>
          <CardDescription>登录或创建你的账号</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">

            {/* Tab 切换按钮 */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>


            {/* ==================== 登录表单 ==================== */}
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">

                {/* 用户名 */}
                <div className="space-y-2">
                  <Label htmlFor="login-username">用户名</Label>
                  <Input
                    id="login-username"
                    placeholder="请输入用户名"
                    value={loginForm.username}
                    onChange={handleLoginUsernameChange}
                  />
                </div>

                {/* 密码 */}
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={handleLoginPasswordChange}
                  />
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>

              </form>
            </TabsContent>


            {/* ==================== 注册表单 ==================== */}
            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">

                {/* 用户名 */}
                <div className="space-y-2">
                  <Label htmlFor="reg-username">用户名</Label>
                  <Input
                    id="reg-username"
                    placeholder="请输入用户名"
                    value={registerForm.username}
                    onChange={handleRegisterUsernameChange}
                  />
                </div>

                {/* 密码 */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password">密码</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="8-16 位，含大小写字母和数字"
                    value={registerForm.password}
                    onChange={handleRegisterPasswordChange}
                  />
                </div>

                {/* 确认密码 */}
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">确认密码</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="请再次输入密码"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterConfirmChange}
                  />
                </div>

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '注册中...' : '注册'}
                </Button>

              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}