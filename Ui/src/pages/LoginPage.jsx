import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  Loader2Icon,
  LockKeyholeIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  UserPlusIcon,
  XIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { loginApi, registerApi } from '@/api/user';
import { setToken, setUserId, setUsername } from '@/utils/auth';
import logger from '@/utils/logger';
import { toast } from 'sonner';

// 注册密码提示，不改变原有提交校验，只做实时反馈
function getPasswordChecks(password) {
  return [
    { label: '8-16 位', passed: password.length >= 8 && password.length <= 16 },
    { label: '小写字母', passed: /[a-z]/.test(password) },
    { label: '大写字母', passed: /[A-Z]/.test(password) },
    { label: '数字', passed: /[0-9]/.test(password) },
  ];
}

function getPasswordStrengthMeta(score, hasValue) {
  if (hasValue === false) {
    return { label: '等待输入', barClass: 'bg-slate-300', textClass: 'text-slate-400' };
  }
  if (score <= 1) {
    return { label: '较弱', barClass: 'bg-rose-500', textClass: 'text-rose-500' };
  }
  if (score === 2) {
    return { label: '一般', barClass: 'bg-amber-500', textClass: 'text-amber-500' };
  }
  if (score === 3) {
    return { label: '良好', barClass: 'bg-sky-500', textClass: 'text-sky-500' };
  }
  return { label: '很强', barClass: 'bg-emerald-500', textClass: 'text-emerald-500' };
}

export default function LoginPage() {
  var navigate = useNavigate();
  var location = useLocation();

  // 登录成功后回到来源页
  var from = '/';
  if (location.state !== null && location.state !== undefined) {
    if (location.state.from !== null && location.state.from !== undefined) {
      if (location.state.from.pathname !== null && location.state.from.pathname !== undefined) {
        from = location.state.from.pathname;
      }
    }
  }

  // ============================================================
  // 状态
  // ============================================================
  var tabState = useState('login');
  var tab = tabState[0];
  var setTab = tabState[1];

  var loginLoadingState = useState(false);
  var loginLoading = loginLoadingState[0];
  var setLoginLoading = loginLoadingState[1];

  var registerLoadingState = useState(false);
  var registerLoading = registerLoadingState[0];
  var setRegisterLoading = registerLoadingState[1];

  var loginFormState = useState({ username: '', password: '' });
  var loginForm = loginFormState[0];
  var setLoginForm = loginFormState[1];

  var registerFormState = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  var registerForm = registerFormState[0];
  var setRegisterForm = registerFormState[1];

  var showLoginPasswordState = useState(false);
  var showLoginPassword = showLoginPasswordState[0];
  var setShowLoginPassword = showLoginPasswordState[1];

  var showRegisterPasswordState = useState(false);
  var showRegisterPassword = showRegisterPasswordState[0];
  var setShowRegisterPassword = showRegisterPasswordState[1];

  var showConfirmPasswordState = useState(false);
  var showConfirmPassword = showConfirmPasswordState[0];
  var setShowConfirmPassword = showConfirmPasswordState[1];

  // ============================================================
  // 登录
  // ============================================================
  function handleLoginUsernameChange(event) {
    setLoginForm({ username: event.target.value, password: loginForm.password });
  }

  function handleLoginPasswordChange(event) {
    setLoginForm({ username: loginForm.username, password: event.target.value });
  }

  function handleLogin(event) {
    event.preventDefault();

    var username = loginForm.username;
    var password = loginForm.password;

    if (username === '' || password === '') {
      toast.error('请输入用户名和密码');
      logger.warn('LoginPage', '登录表单为空');
      return;
    }

    setLoginLoading(true);

    loginApi(username, password)
      .then(function (res) {
        if (res.success === false) {
          logger.warn('LoginPage', '登录失败', { message: res.message });
          toast.error(res.message || '登录失败');
          return;
        }
        if (!res.data) {
          toast.error('登录响应异常，请稍后重试');
          return;
        }

        setToken('session-' + Date.now());
        setUserId(res.data.userId);
        setUsername(res.data.username);

        navigate(from, { replace: true });
      })
      .catch(function (error) {
        logger.error('LoginPage', '登录过程出现异常', error);
        toast.error('登录失败：' + error.message);
      })
      .finally(function () {
        setLoginLoading(false);
      });
  }

  // ============================================================
  // 注册
  // ============================================================
  function handleRegisterUsernameChange(event) {
    setRegisterForm({
      username: event.target.value,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
    });
  }

  function handleRegisterPasswordChange(event) {
    setRegisterForm({
      username: registerForm.username,
      password: event.target.value,
      confirmPassword: registerForm.confirmPassword,
    });
  }

  function handleRegisterConfirmChange(event) {
    setRegisterForm({
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: event.target.value,
    });
  }

  function handleRegister(event) {
    event.preventDefault();

    var username = registerForm.username;
    var password = registerForm.password;
    var confirmPassword = registerForm.confirmPassword;

    logger.info('LoginPage', '用户点击注册按钮', { username: username });

    if (username === '' || password === '' || confirmPassword === '') {
      toast.error('请填写所有字段');
      logger.warn('LoginPage', '注册表单有字段为空');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      logger.warn('LoginPage', '两次密码不一致');
      return;
    }

    setRegisterLoading(true);

    registerApi(username, password, confirmPassword)
      .then(function (res) {
        if (res.success === false) {
          logger.warn('LoginPage', '注册失败', { message: res.message });
          toast.error(res.message || '注册失败');
          return;
        }

        toast.success('注册成功，请登录');
        setTab('login');
        setLoginForm({ username: username, password: '' });
        setRegisterForm({ username: '', password: '', confirmPassword: '' });
        setShowRegisterPassword(false);
        setShowConfirmPassword(false);
      })
      .catch(function (error) {
        logger.error('LoginPage', '注册过程出现异常', error);
        toast.error('注册失败：' + error.message);
      })
      .finally(function () {
        setRegisterLoading(false);
      });
  }

  // ============================================================
  // 派生数据
  // ============================================================
  var pageTitle = tab === 'login' ? '欢迎回来' : '创建你的账号';
  var pageSubtitle = tab === 'login'
    ? '登录后继续管理你的私人动漫宇宙。'
    : '加入 ANIME HUB，把喜欢的故事都收进这里。';

  var passwordChecks = getPasswordChecks(registerForm.password);
  var passwordScore = 0;
  passwordChecks.forEach(function (rule) {
    if (rule.passed) passwordScore = passwordScore + 1;
  });
  var passwordStrength = getPasswordStrengthMeta(passwordScore, registerForm.password.length > 0);
  var passwordWidth = passwordScore * 25;
  var passwordMismatch = registerForm.confirmPassword !== ''
    && registerForm.password !== registerForm.confirmPassword;

  var loginPasswordType = showLoginPassword === true ? 'text' : 'password';
  var registerPasswordType = showRegisterPassword === true ? 'text' : 'password';
  var confirmPasswordType = showConfirmPassword === true ? 'text' : 'password';

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 p-3 text-left sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1440px] overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-900/5 sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">

        {/* 左侧品牌视觉区 */}
        <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -right-24 -top-28 size-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 -translate-y-1/4 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                <SparklesIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">ANIME HUB</p>
                <p className="text-[10px] tracking-[0.2em] text-white/35">PRIVATE STREAMING SPACE</p>
              </div>
            </div>

            <div className="mt-20 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-sky-300">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                WELCOME TO YOUR UNIVERSE
              </div>
              <p className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
                每一次登录，
                <br />
                都是回到你的
                <span className="bg-gradient-to-r from-sky-300 via-white to-amber-200 bg-clip-text text-transparent">
                  动漫宇宙
                </span>
                。
              </p>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/45">
                收藏、记录、重温。把喜欢的故事留在专属空间里，随时继续。
              </p>
            </div>
          </div>

          <div className="relative mt-10">
            <Card className="gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] py-0 text-white shadow-none ring-0 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
                    <FilmIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/85">私人动漫片单</p>
                    <p className="mt-0.5 text-[10px] text-white/35">所有收藏，只属于你</p>
                  </div>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-violet-400/15 text-violet-300">
                    <NewspaperIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/85">AI 每日早报</p>
                    <p className="mt-0.5 text-[10px] text-white/35">每天 3 分钟，知晓新故事</p>
                  </div>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                    <ShieldCheckIcon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/85">安全的个人空间</p>
                    <p className="mt-0.5 text-[10px] text-white/35">独立账号，数据隔离</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-[10px] tracking-wide text-white/25">
              ANIME HUB · YOUR STORIES, YOUR SPACE.
            </p>
          </div>
        </aside>

        {/* 右侧表单区 */}
        <main className="relative flex flex-col px-6 py-6 sm:px-10 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <SparklesIcon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900">ANIME HUB</p>
                <p className="text-[9px] tracking-[0.18em] text-slate-400">PRIVATE STREAMING SPACE</p>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={function () { navigate('/'); }}
              aria-label="返回首页"
              className="ml-auto h-9 rounded-xl px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span className="hidden sm:inline">返回首页</span>
            </Button>
          </div>

          {/* 移动端品牌横幅 */}
          <div className="relative mt-6 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white lg:hidden">
            <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-sky-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/3 size-36 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-sky-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                YOUR ANIME UNIVERSE
              </div>
              <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
                回到你的动漫宇宙
              </p>
              <p className="mt-2 text-xs leading-6 text-white/45">
                收藏、记录、重温喜欢的故事。
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
            <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-7">
                <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-slate-400">
                  <SparklesIcon className="size-3.5 text-sky-500" />
                  {tab === 'login' ? 'WELCOME BACK' : 'JOIN THE UNIVERSE'}
                </div>
                <h1 className="m-0 mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {pageTitle}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-400">{pageSubtitle}</p>

                {tab === 'login' && from !== '/' && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-[11px] text-sky-600">
                    <ShieldCheckIcon className="size-3.5 shrink-0" />
                    登录后将返回刚才访问的页面
                  </div>
                )}
              </div>

              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="h-11 w-full rounded-xl bg-slate-100 p-1">
                  <TabsTrigger
                    value="login"
                    className="h-9 gap-2 rounded-lg text-xs font-medium text-slate-500 transition-all data-active:bg-white data-active:text-slate-900 data-active:shadow-sm active:scale-95 sm:text-sm"
                  >
                    <UserIcon className="size-4" />
                    登录
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="h-9 gap-2 rounded-lg text-xs font-medium text-slate-500 transition-all data-active:bg-white data-active:text-slate-900 data-active:shadow-sm active:scale-95 sm:text-sm"
                  >
                    <UserPlusIcon className="size-4" />
                    注册
                  </TabsTrigger>
                </TabsList>

                {/* ==================== 登录 ==================== */}
                <TabsContent
                  value="login"
                  className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">用户名</Label>
                      <InputGroup className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-1 transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-sm">
                        <InputGroupAddon className="pl-3">
                          <UserIcon className="size-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="login-username"
                          placeholder="请输入用户名"
                          autoComplete="username"
                          value={loginForm.username}
                          onChange={handleLoginUsernameChange}
                          disabled={loginLoading}
                          className="h-12 text-[15px] text-slate-800 placeholder:text-slate-400"
                        />
                      </InputGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">密码</Label>
                      <InputGroup className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-1 transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-sm">
                        <InputGroupAddon className="pl-3">
                          <LockKeyholeIcon className="size-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="login-password"
                          type={loginPasswordType}
                          placeholder="请输入密码"
                          autoComplete="current-password"
                          value={loginForm.password}
                          onChange={handleLoginPasswordChange}
                          disabled={loginLoading}
                          className="h-12 text-[15px] text-slate-800 placeholder:text-slate-400"
                        />
                        <InputGroupAddon align="inline-end" className="pr-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={function () { setShowLoginPassword(showLoginPassword === false); }}
                            aria-label={showLoginPassword === true ? '隐藏密码' : '显示密码'}
                            aria-pressed={showLoginPassword}
                            className="rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                          >
                            {showLoginPassword === true ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="h-12 w-full rounded-xl bg-slate-900 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                      {loginLoading === true ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <ArrowRightIcon className="size-4" />
                      )}
                      {loginLoading === true ? '登录中...' : '登录'}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                      还没有账号？
                      <Button
                        type="button"
                        variant="link"
                        onClick={function () { setTab('register'); }}
                        className="h-auto p-0 text-xs font-medium text-slate-900 underline-offset-4 active:scale-95"
                      >
                        立即注册
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* ==================== 注册 ==================== */}
                <TabsContent
                  value="register"
                  className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <form onSubmit={handleRegister} className="space-y-5" autoComplete="on">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">用户名</Label>
                      <InputGroup className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-1 transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-sm">
                        <InputGroupAddon className="pl-3">
                          <UserIcon className="size-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="register-username"
                          placeholder="设置一个用户名"
                          autoComplete="username"
                          value={registerForm.username}
                          onChange={handleRegisterUsernameChange}
                          disabled={registerLoading}
                          className="h-12 text-[15px] text-slate-800 placeholder:text-slate-400"
                        />
                      </InputGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">密码</Label>
                      <InputGroup className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-1 transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-sm">
                        <InputGroupAddon className="pl-3">
                          <LockKeyholeIcon className="size-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="register-password"
                          type={registerPasswordType}
                          placeholder="8-16 位，含大小写字母和数字"
                          autoComplete="new-password"
                          value={registerForm.password}
                          onChange={handleRegisterPasswordChange}
                          disabled={registerLoading}
                          className="h-12 text-[15px] text-slate-800 placeholder:text-slate-400"
                        />
                        <InputGroupAddon align="inline-end" className="pr-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={function () { setShowRegisterPassword(showRegisterPassword === false); }}
                            aria-label={showRegisterPassword === true ? '隐藏密码' : '显示密码'}
                            aria-pressed={showRegisterPassword}
                            className="rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                          >
                            {showRegisterPassword === true ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-400">密码强度</span>
                          <span className={'text-xs font-medium ' + passwordStrength.textClass}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={'h-full rounded-full transition-all duration-500 ' + passwordStrength.barClass}
                            style={{ width: passwordWidth + '%' }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {passwordChecks.map(function (rule, index) {
                            return (
                              <span
                                key={index}
                                className={
                                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ' +
                                  (rule.passed === true
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-white text-slate-400')
                                }
                              >
                                {rule.passed === true ? <CheckIcon className="size-3" strokeWidth={3} /> : <XIcon className="size-3" />}
                                {rule.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">确认密码</Label>
                      <InputGroup className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-1 transition-all focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-sm">
                        <InputGroupAddon className="pl-3">
                          <ShieldCheckIcon className="size-4 text-slate-400" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="register-confirm"
                          type={confirmPasswordType}
                          placeholder="再次输入密码"
                          autoComplete="new-password"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterConfirmChange}
                          disabled={registerLoading}
                          className="h-12 text-[15px] text-slate-800 placeholder:text-slate-400"
                        />
                        <InputGroupAddon align="inline-end" className="pr-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={function () { setShowConfirmPassword(showConfirmPassword === false); }}
                            aria-label={showConfirmPassword === true ? '隐藏确认密码' : '显示确认密码'}
                            aria-pressed={showConfirmPassword}
                            className="rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                          >
                            {showConfirmPassword === true ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                          </Button>
                        </InputGroupAddon>
                      </InputGroup>
                      {passwordMismatch === true && (
                        <p className="flex items-center gap-1.5 text-[11px] text-rose-500">
                          <XIcon className="size-3" />
                          两次输入的密码不一致
                        </p>
                      )}
                      {registerForm.confirmPassword !== '' && passwordMismatch === false && (
                        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                          <CheckIcon className="size-3" strokeWidth={3} />
                          两次输入的密码一致
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={registerLoading}
                      className="h-12 w-full rounded-xl bg-slate-900 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                      {registerLoading === true ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <UserPlusIcon className="size-4" />
                      )}
                      {registerLoading === true ? '注册中...' : '创建账号'}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                      已经有账号？
                      <Button
                        type="button"
                        variant="link"
                        onClick={function () { setTab('login'); }}
                        className="h-auto p-0 text-xs font-medium text-slate-900 underline-offset-4 active:scale-95"
                      >
                        去登录
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-300">
                <ShieldCheckIcon className="size-3" />
                安全登录 · 你的资料仅用于个人动漫空间
              </div>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[10px] tracking-wide text-slate-300">
            <span>ANIME HUB · PRIVATE STREAMING SPACE</span>
            <span>SECURE ACCESS</span>
          </footer>
        </main>
      </div>
    </div>
  );
}