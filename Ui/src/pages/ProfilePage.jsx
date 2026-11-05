import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CameraIcon,
  CheckIcon,
  CircleAlertIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  HomeIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockKeyholeIcon,
  SaveIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { getUserInfoApi, updateProfileApi, updatePasswordApi } from '@/api/user';
import { fetchAnimeCount } from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var PROFILE_SKELETON_CARDS = [0, 1, 2, 3];

// 辅助函数：拼接头像完整 URL
function getAvatarUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

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
    return {
      label: '等待输入',
      barClass: 'bg-slate-300',
      textClass: 'text-slate-400',
    };
  }
  if (score <= 1) {
    return {
      label: '较弱',
      barClass: 'bg-rose-500',
      textClass: 'text-rose-500',
    };
  }
  if (score === 2) {
    return {
      label: '一般',
      barClass: 'bg-amber-500',
      textClass: 'text-amber-500',
    };
  }
  if (score === 3) {
    return {
      label: '良好',
      barClass: 'bg-sky-500',
      textClass: 'text-sky-500',
    };
  }
  return {
    label: '很强',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-500',
  };
}

export default function ProfilePage() {
  var navigate = useNavigate();

  // 用户数据状态
  var userInfoState = useState({
    username: '',
    nickname: '',
    avatar: '',
    signature: '',
  });
  var userInfo = userInfoState[0];
  var setUserInfo = userInfoState[1];

  // 表单状态（用于编辑时暂存）
  var formState = useState({ nickname: '', signature: '' });
  var form = formState[0];
  var setForm = formState[1];

  // 文件上传状态
  var avatarFileState = useState(null);
  var avatarFile = avatarFileState[0];
  var setAvatarFile = avatarFileState[1];

  var previewState = useState('');
  var preview = previewState[0];
  var setPreview = previewState[1];

  // UI 状态控制
  var isEditingState = useState(false);
  var isEditing = isEditingState[0];
  var setIsEditing = isEditingState[1];

  var activeTabState = useState('profile');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  var pageLoadingState = useState(true);
  var pageLoading = pageLoadingState[0];
  var setPageLoading = pageLoadingState[1];

  var pageErrorState = useState(false);
  var pageError = pageErrorState[0];
  var setPageError = pageErrorState[1];

  var savingProfileState = useState(false);
  var savingProfile = savingProfileState[0];
  var setSavingProfile = savingProfileState[1];

  // 密码表单状态
  var pwdFormState = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  var pwdForm = pwdFormState[0];
  var setPwdForm = pwdFormState[1];

  var updatingPasswordState = useState(false);
  var updatingPassword = updatingPasswordState[0];
  var setUpdatingPassword = updatingPasswordState[1];

  var showPasswordsState = useState(false);
  var showPasswords = showPasswordsState[0];
  var setShowPasswords = showPasswordsState[1];

  // 动漫统计
  var animeTotalState = useState(0);
  var animeTotal = animeTotalState[0];
  var setAnimeTotal = animeTotalState[1];

  var animeLoadingState = useState(true);
  var animeLoading = animeLoadingState[0];
  var setAnimeLoading = animeLoadingState[1];

  var animeErrorState = useState(false);
  var animeError = animeErrorState[0];
  var setAnimeError = animeErrorState[1];

  var fileRef = useRef(null);

  // ============================================================
  // 初始化数据
  // ============================================================
  useEffect(function () {
    loadUserInfo();
    loadAnimeTotal();
  }, []);

  function loadUserInfo() {
    setPageLoading(true);
    setPageError(false);

    getUserInfoApi()
      .then(function (res) {
        logger.info('ProfilePage', '获取用户资料', res);
        if (res.success === true && res.data) {
          var data = {
            username: res.data.username || '',
            nickname: res.data.nickname || res.data.username || '',
            avatar: res.data.avatar || '',
            signature: res.data.signature || '',
          };
          setUserInfo(data);
          setForm({ nickname: data.nickname, signature: data.signature });
        } else {
          setPageError(true);
          if (res.message) toast.error(res.message);
        }
      })
      .catch(function (error) {
        logger.error('ProfilePage', '加载用户资料失败', error);
        setPageError(true);
        toast.error('个人资料加载失败');
      })
      .finally(function () {
        setPageLoading(false);
      });
  }

  function loadAnimeTotal() {
    setAnimeLoading(true);
    setAnimeError(false);

    fetchAnimeCount()
      .then(function (res) {
        if (res.success) {
          setAnimeTotal(res.data || 0);
        } else {
          setAnimeError(true);
        }
      })
      .catch(function (error) {
        logger.error('ProfilePage', '获取动漫总数失败', error);
        setAnimeError(true);
      })
      .finally(function () {
        setAnimeLoading(false);
      });
  }

  // ============================================================
  // 资料编辑
  // ============================================================
  function handleEnterEdit() {
    setForm({ nickname: userInfo.nickname, signature: userInfo.signature });
    setAvatarFile(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
    setIsEditing(true);
    setActiveTab('profile');

    setTimeout(function () {
      var target = document.getElementById('profile-editor');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setAvatarFile(null);
    setPreview('');
    setForm({ nickname: userInfo.nickname, signature: userInfo.signature });
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleNicknameChange(event) {
    setForm({ nickname: event.target.value, signature: form.signature });
  }

  function handleSignatureChange(event) {
    setForm({ nickname: form.nickname, signature: event.target.value });
  }

  function handleFileChange(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/') === false) {
      toast.error('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB');
      return;
    }

    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSaveProfile(event) {
    event.preventDefault();

    if (form.nickname.trim() === '') {
      toast.error('昵称不能为空');
      return;
    }

    setSavingProfile(true);

    updateProfileApi(form.nickname, form.signature, avatarFile)
      .then(function (res) {
        if (res.success) {
          toast.success('资料更新成功！');
          setIsEditing(false);
          setAvatarFile(null);
          setPreview('');
          if (fileRef.current) fileRef.current.value = '';
          loadUserInfo();
        } else {
          toast.error(res.message || '资料更新失败');
        }
      })
      .catch(function (error) {
        logger.error('ProfilePage', '更新资料失败', error);
        toast.error('网络错误：' + error.message);
      })
      .finally(function () {
        setSavingProfile(false);
      });
  }

  // ============================================================
  // 密码修改
  // ============================================================
  function handleOldPasswordChange(event) {
    setPwdForm({
      oldPassword: event.target.value,
      newPassword: pwdForm.newPassword,
      confirmPassword: pwdForm.confirmPassword,
    });
  }

  function handleNewPasswordChange(event) {
    setPwdForm({
      oldPassword: pwdForm.oldPassword,
      newPassword: event.target.value,
      confirmPassword: pwdForm.confirmPassword,
    });
  }

  function handleConfirmPasswordChange(event) {
    setPwdForm({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmPassword: event.target.value,
    });
  }

  function handleUpdatePassword(event) {
    event.preventDefault();

    if (!pwdForm.oldPassword || !pwdForm.newPassword) {
      toast.error('密码不能为空');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('两次新密码输入不一致');
      return;
    }

    setUpdatingPassword(true);

    updatePasswordApi(pwdForm.oldPassword, pwdForm.newPassword)
      .then(function (res) {
        if (res.success) {
          toast.success('密码修改成功，请重新登录！');
          localStorage.clear();
          window.location.href = '/login';
        } else {
          toast.error(res.message || '密码修改失败');
        }
      })
      .catch(function (error) {
        logger.error('ProfilePage', '修改密码失败', error);
        toast.error('网络错误：' + error.message);
      })
      .finally(function () {
        setUpdatingPassword(false);
      });
  }

  function handleBackdropError(event) {
    event.currentTarget.style.opacity = '0';
  }

  // ============================================================
  // 派生数据
  // ============================================================
  var displayName = userInfo.nickname || userInfo.username || '动漫旅人';
  if (isEditing === true && form.nickname !== '') displayName = form.nickname;
  var displayedSignature = isEditing === true ? form.signature : userInfo.signature;
  var avatarSrc = preview !== '' ? preview : getAvatarUrl(userInfo.avatar);
  var avatarInitial = 'U';
  if (userInfo.nickname !== '') {
    avatarInitial = userInfo.nickname.slice(0, 1).toUpperCase();
  } else if (userInfo.username !== '') {
    avatarInitial = userInfo.username.slice(0, 1).toUpperCase();
  }
  if (isEditing === true && form.nickname !== '') {
    avatarInitial = form.nickname.slice(0, 1).toUpperCase();
  }

  var profileCompletion = 0;
  if (userInfo.avatar !== '') profileCompletion = profileCompletion + 30;
  if (userInfo.nickname !== '') profileCompletion = profileCompletion + 35;
  if (userInfo.signature !== '') profileCompletion = profileCompletion + 35;

  var profileChecklist = [
    { label: '上传专属头像', done: userInfo.avatar !== '' },
    { label: '设置展示昵称', done: userInfo.nickname !== '' },
    { label: '写下一句个性签名', done: userInfo.signature !== '' },
  ];

  var hasChanges = false;
  if (isEditing === true) {
    if (form.nickname !== userInfo.nickname) hasChanges = true;
    if (form.signature !== userInfo.signature) hasChanges = true;
    if (avatarFile !== null) hasChanges = true;
  }

  var passwordChecks = getPasswordChecks(pwdForm.newPassword);
  var passwordScore = 0;
  passwordChecks.forEach(function (rule) {
    if (rule.passed) passwordScore = passwordScore + 1;
  });
  var passwordHasValue = pwdForm.newPassword.length > 0;
  var passwordStrength = getPasswordStrengthMeta(passwordScore, passwordHasValue);
  var passwordWidth = passwordScore * 25;
  var passwordMismatch = pwdForm.confirmPassword !== '' && pwdForm.newPassword !== pwdForm.confirmPassword;
  var passwordInputType = showPasswords === true ? 'text' : 'password';

  // ============================================================
  // 首次加载骨架屏
  // ============================================================
  if (pageLoading === true && userInfo.username === '') {
    return (
      <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
          <Skeleton className="h-14 rounded-2xl bg-white/80" />
          <Skeleton className="h-64 rounded-[2rem] bg-slate-200/80 sm:h-72" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PROFILE_SKELETON_CARDS.map(function (key) {
              return <Skeleton key={key} className="h-32 rounded-2xl bg-white" />;
            })}
          </div>
          <Skeleton className="h-11 w-full max-w-md rounded-2xl bg-white" />
          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <Skeleton className="h-[520px] rounded-[2rem] bg-white" />
            <div className="space-y-6">
              <Skeleton className="h-44 rounded-[2rem] bg-white" />
              <Skeleton className="h-56 rounded-[2rem] bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 加载失败
  // ============================================================
  if (pageError === true && userInfo.username === '') {
    return (
      <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center">
          <Empty className="w-full rounded-[2rem] border border-dashed border-slate-200 bg-white/80 py-16 shadow-sm backdrop-blur-sm">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="mb-4 size-16 rounded-2xl bg-rose-50 text-rose-500"
              >
                <CircleAlertIcon className="size-7" />
              </EmptyMedia>
              <EmptyTitle className="text-xl font-semibold tracking-tight text-slate-900">
                个人资料加载失败
              </EmptyTitle>
              <EmptyDescription className="max-w-sm text-sm leading-6 text-slate-400">
                请检查登录状态或网络连接，然后重新加载。
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center">
              <Button
                onClick={loadUserInfo}
                className="h-10 rounded-xl bg-slate-900 px-5 text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                重新加载
              </Button>
              <Button
                variant="outline"
                onClick={function () { navigate('/'); }}
                className="h-10 rounded-xl border-slate-200 px-5 transition-all active:scale-95"
              >
                返回首页
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">

        {/* 顶部毛玻璃导航 */}
        <div className="sticky top-3 z-40 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <UserIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">个人中心</p>
              <p className="hidden truncate text-[10px] tracking-[0.18em] text-slate-400 sm:block">YOUR PROFILE SPACE</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={function () { navigate('/'); }}
              aria-label="返回首页"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <HomeIcon className="size-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Button>
            <Button
              variant="outline"
              onClick={function () { navigate('/monitor'); }}
              aria-label="我的片单"
              className="h-9 rounded-xl border-slate-200 bg-white/80 px-3 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 active:scale-95"
            >
              <FilmIcon className="size-4" />
              <span className="hidden sm:inline">我的片单</span>
            </Button>
          </div>
        </div>

        {/* 个人主页式头图 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-10 sm:py-10">
          {avatarSrc !== '' && (
            <img
              key={avatarSrc}
              src={avatarSrc}
              alt=""
              aria-hidden="true"
              onError={handleBackdropError}
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-2xl"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/60" />
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar className="size-24 shadow-2xl ring-4 ring-white/15 sm:size-28">
                  {avatarSrc !== '' && <AvatarImage src={avatarSrc} alt={displayName} />}
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-3xl font-semibold text-white">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-2 right-2 size-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium tracking-[0.22em] text-sky-300">PERSONAL PROFILE</span>
                  {isEditing === true && (
                    <Badge className="rounded-full border border-amber-300/20 bg-amber-400/15 px-2 py-0 text-[10px] text-amber-200">
                      编辑模式
                    </Badge>
                  )}
                </div>
                <h1 className="m-0 truncate text-3xl font-semibold tracking-tight sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1.5 text-sm text-white/45">@{userInfo.username || 'anonymous'}</p>
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/60">
                  {displayedSignature || '还没有个性签名，写一句属于你的话吧。'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/70">
                    <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-400" />
                    账号已登录
                  </Badge>
                  <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/70">
                    资料完整度 {profileCompletion}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isEditing === true ? (
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                  className="h-11 rounded-xl border-white/20 bg-white/10 px-4 text-white shadow-none transition-all hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <XIcon className="size-4" />
                  取消编辑
                </Button>
              ) : (
                <Button
                  onClick={handleEnterEdit}
                  className="h-11 rounded-xl bg-white px-4 text-slate-950 shadow-sm transition-all hover:bg-white/90 active:scale-95"
                >
                  <EditIcon className="size-4" />
                  编辑资料
                </Button>
              )}
              <Button
                variant="outline"
                onClick={function () { navigate('/monitor'); }}
                className="h-11 rounded-xl border-white/20 bg-white/10 px-4 text-white shadow-none transition-all hover:bg-white/15 hover:text-white active:scale-95"
              >
                <FilmIcon className="size-4" />
                我的片单
                <ArrowUpRightIcon className="size-3.5 text-white/40" />
              </Button>
            </div>
          </div>
        </header>

        {/* 概览数据 */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">馆藏作品</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 transition-colors duration-300 group-hover:bg-sky-100">
                  <BookOpenIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-3xl font-semibold tracking-tight text-slate-900">
                {animeLoading === true ? (
                  <Skeleton className="h-8 w-16 rounded-lg bg-slate-200/80" />
                ) : (
                  <span>
                    {animeError === true ? '--' : animeTotal}
                    <span className="ml-1 text-xs font-normal text-slate-400">部</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {animeError === true ? '暂时无法获取统计' : '已收录的动漫总数'}
              </p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">资料完整度</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500 transition-colors duration-300 group-hover:bg-violet-100">
                  <SparklesIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {profileCompletion}
                <span className="ml-1 text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500 transition-all duration-500"
                  style={{ width: profileCompletion + '%' }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">账户状态</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors duration-300 group-hover:bg-emerald-100">
                  <ShieldCheckIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                正常
              </div>
              <p className="mt-1 text-[11px] text-slate-400">账号状态良好</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">安全保护</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-colors duration-300 group-hover:bg-amber-100">
                  <LockKeyholeIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">已开启</div>
              <p className="mt-1 text-[11px] text-slate-400">密码与登录状态保护</p>
            </CardContent>
          </Card>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-11 w-full max-w-md rounded-2xl border border-white/80 bg-white/80 p-1 shadow-sm backdrop-blur-md">
            <TabsTrigger
              value="profile"
              className="h-9 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
            >
              <UserIcon className="size-4" />
              个人资料
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="h-9 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
            >
              <ShieldCheckIcon className="size-4" />
              账号安全
            </TabsTrigger>
          </TabsList>

          {/* ==================== 个人资料 ==================== */}
          <TabsContent
            value="profile"
            className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
              <Card
                id="profile-editor"
                className="scroll-mt-24 gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400">PROFILE INFORMATION</p>
                      <CardTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900">基本资料</CardTitle>
                      <CardDescription className="mt-1 text-sm text-slate-400">
                        你的头像、昵称和个人签名
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing === true && hasChanges === true && (
                        <Badge className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-600">
                          未保存更改
                        </Badge>
                      )}
                      {isEditing === false && (
                        <Button
                          variant="outline"
                          onClick={handleEnterEdit}
                          className="h-9 rounded-xl border-slate-200 px-3 text-slate-600 shadow-none transition-all hover:bg-slate-50 active:scale-95"
                        >
                          <EditIcon className="size-4" />
                          修改资料
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <Avatar className="size-24 shadow-sm ring-4 ring-slate-100">
                            {avatarSrc !== '' && <AvatarImage src={avatarSrc} alt={displayName} />}
                            <AvatarFallback className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-2xl font-semibold text-white">
                              {avatarInitial}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing === true && (
                            <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm">
                              <CameraIcon className="size-3.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {isEditing === true ? '预览将实时更新' : '个人头像'}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1 space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="profile-username">登录账号</Label>
                          <Input
                            id="profile-username"
                            value={userInfo.username}
                            disabled
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-400"
                          />
                          <p className="text-[10px] text-slate-400">登录账号不可修改</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="profile-nickname">昵称</Label>
                          {isEditing === true ? (
                            <Input
                              id="profile-nickname"
                              value={form.nickname}
                              onChange={handleNicknameChange}
                              placeholder="请输入昵称"
                              className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                            />
                          ) : (
                            <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700">
                              {userInfo.nickname || '未设置'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="profile-signature">个人签名</Label>
                        {isEditing === true && (
                          <span className="text-[10px] text-slate-400">{form.signature.length} 字</span>
                        )}
                      </div>
                      {isEditing === true ? (
                        <Textarea
                          id="profile-signature"
                          value={form.signature}
                          onChange={handleSignatureChange}
                          placeholder="介绍一下自己吧..."
                          rows={4}
                          className="min-h-28 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                        />
                      ) : (
                        <div className="min-h-24 whitespace-pre-wrap rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-7 text-slate-600">
                          {userInfo.signature || '这个人很懒，什么都没写~'}
                        </div>
                      )}
                    </div>

                    {isEditing === true && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                        <Label htmlFor="profile-avatar" className="text-xs text-slate-600">
                          更换头像
                        </Label>
                        <Input
                          id="profile-avatar"
                          type="file"
                          accept="image/*"
                          ref={fileRef}
                          onChange={handleFileChange}
                          className="mt-2 h-auto cursor-pointer rounded-xl border-slate-200 bg-white p-2 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                        />
                        <p className="mt-2 text-[10px] text-slate-400">
                          支持 JPG / PNG，文件不超过 5MB；不选择则保留原头像。
                        </p>
                      </div>
                    )}

                    {isEditing === true && (
                      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={savingProfile}
                          className="h-10 rounded-xl border-slate-200 px-4 transition-all active:scale-95"
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingProfile}
                          className="h-10 rounded-xl bg-slate-900 px-5 text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                          {savingProfile === true ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : (
                            <SaveIcon className="size-4" />
                          )}
                          {savingProfile === true ? '保存中...' : '保存更改'}
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-3">
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">账户概览</CardTitle>
                    <CardDescription className="text-sm text-slate-400">当前登录账号信息</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                      <span className="text-slate-400">登录账号</span>
                      <span className="max-w-40 truncate font-medium text-slate-700">{userInfo.username || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                      <span className="text-slate-400">展示昵称</span>
                      <span className="max-w-40 truncate font-medium text-slate-700">{userInfo.nickname || '未设置'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="text-slate-400">账户状态</span>
                      <Badge className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600">
                        已激活
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400">PROFILE COMPLETION</p>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">完善你的主页</h3>
                      </div>
                      <span className="text-2xl font-semibold tracking-tight text-slate-900">{profileCompletion}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 transition-all duration-500"
                        style={{ width: profileCompletion + '%' }}
                      />
                    </div>
                    <div className="mt-4 space-y-2.5">
                      {profileChecklist.map(function (item, index) {
                        return (
                          <div key={index} className="flex items-center gap-2.5 text-xs">
                            <span
                              className={
                                'flex size-5 items-center justify-center rounded-full ' +
                                (item.done === true ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300')
                              }
                            >
                              {item.done === true ? <CheckIcon className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                            </span>
                            <span className={item.done === true ? 'text-slate-600' : 'text-slate-400'}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-3">
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">快捷入口</CardTitle>
                    <CardDescription className="text-sm text-slate-400">一步抵达常用功能</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-6 pt-0">
                    <Button
                      variant="ghost"
                      onClick={function () { navigate('/'); }}
                      className="group/action h-11 w-full justify-start rounded-xl bg-slate-50 px-3 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                    >
                      <HomeIcon className="size-4 text-slate-400" />
                      <span className="ml-3 text-xs font-medium">返回首页</span>
                      <ArrowUpRightIcon className="ml-auto size-3.5 text-slate-300 transition-transform group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={function () { navigate('/monitor'); }}
                      className="group/action h-11 w-full justify-start rounded-xl bg-slate-50 px-3 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                    >
                      <FilmIcon className="size-4 text-slate-400" />
                      <span className="ml-3 text-xs font-medium">我的动漫库</span>
                      <ArrowUpRightIcon className="ml-auto size-3.5 text-slate-300 transition-transform group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={function () { navigate('/settings'); }}
                      className="group/action h-11 w-full justify-start rounded-xl bg-slate-50 px-3 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                    >
                      <SettingsIcon className="size-4 text-slate-400" />
                      <span className="ml-3 text-xs font-medium">系统设置</span>
                      <ArrowUpRightIcon className="ml-auto size-3.5 text-slate-300 transition-transform group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ==================== 账号安全 ==================== */}
          <TabsContent
            value="security"
            className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
              <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between gap-4 p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <KeyRoundIcon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">修改密码</CardTitle>
                      <CardDescription className="mt-1 text-sm text-slate-400">
                        修改成功后需要重新登录
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={function () { setShowPasswords(showPasswords === false); }}
                    aria-label={showPasswords === true ? '隐藏密码' : '显示密码'}
                    aria-pressed={showPasswords}
                    className="h-9 shrink-0 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                  >
                    {showPasswords === true ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
                    <span className="hidden sm:inline">{showPasswords === true ? '隐藏密码' : '显示密码'}</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                  <form onSubmit={handleUpdatePassword} className="mx-auto max-w-lg space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="old-password">原密码</Label>
                      <Input
                        id="old-password"
                        type={passwordInputType}
                        placeholder="输入当前密码"
                        autoComplete="current-password"
                        value={pwdForm.oldPassword}
                        onChange={handleOldPasswordChange}
                        className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <Input
                        id="new-password"
                        type={passwordInputType}
                        placeholder="8-16 位，含大小写和数字"
                        autoComplete="new-password"
                        value={pwdForm.newPassword}
                        onChange={handleNewPasswordChange}
                        className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                      />

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
                      <Label htmlFor="confirm-password">确认新密码</Label>
                      <Input
                        id="confirm-password"
                        type={passwordInputType}
                        placeholder="再次输入新密码"
                        autoComplete="new-password"
                        value={pwdForm.confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                      />
                      {passwordMismatch === true && (
                        <p className="flex items-center gap-1.5 text-[11px] text-rose-500">
                          <CircleAlertIcon className="size-3" />
                          两次新密码输入不一致
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2.5 text-[11px] leading-5 text-amber-700">
                      <LockKeyholeIcon className="mt-0.5 size-3.5 shrink-0" />
                      修改密码后当前会话将失效，需要使用新密码重新登录。
                    </div>

                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={updatingPassword}
                      className="h-11 w-full rounded-xl bg-rose-600 text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
                    >
                      {updatingPassword === true ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <KeyRoundIcon className="size-4" />
                      )}
                      {updatingPassword === true ? '提交中...' : '确认修改密码'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="relative gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-emerald-300/20 blur-3xl" />
                  <CardContent className="relative p-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                      <ShieldCheckIcon className="size-5" />
                    </div>
                    <p className="mt-4 text-[10px] font-medium tracking-[0.2em] text-slate-400">SECURITY STATUS</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">账号保护已开启</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      密码、登录会话和个人资料均处于保护状态。建议定期更新密码，保持账号安全。
                    </p>
                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <CheckIcon className="size-3.5 text-emerald-500" strokeWidth={3} />
                        密码登录保护
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <CheckIcon className="size-3.5 text-emerald-500" strokeWidth={3} />
                        个人资料独立存储
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <CheckIcon className="size-3.5 text-emerald-500" strokeWidth={3} />
                        修改密码后强制退出
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-3">
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">安全建议</CardTitle>
                    <CardDescription className="text-sm text-slate-400">几件小事，让账号更安全</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 pt-0">
                    <div className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                        <KeyRoundIcon className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">使用独立密码</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">不要与其他网站共用同一组密码。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                        <SparklesIcon className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">定期更新密码</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">建议每 6 个月更换一次密码。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <ShieldCheckIcon className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">保护个人信息</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-400">不要向他人透露你的密码或登录凭证。</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · 个人资料中心</span>
          <span>@{userInfo.username || 'anonymous'}</span>
        </footer>
      </div>
    </div>
  );
}
