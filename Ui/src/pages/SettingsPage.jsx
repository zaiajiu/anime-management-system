import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  CheckIcon,
  ClockIcon,
  Code2Icon,
  DatabaseIcon,
  DownloadIcon,
  FilmIcon,
  HardDriveIcon,
  HomeIcon,
  KeyboardIcon,
  LogOutIcon,
  RotateCcwIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getStoredSettings, saveSettings, SETTINGS_KEY, DEFAULT_SETTINGS } from '@/utils/preferences';
import { getUsername, isLogin, clearAuth } from '@/utils/auth';
import { toast } from 'sonner';

function padNumber(value) {
  if (value < 10) return '0' + value;
  return String(value);
}

function formatClock(date) {
  return padNumber(date.getHours()) + ':' + padNumber(date.getMinutes());
}

function getSortLabel(field) {
  if (field === 'name') return '按名称';
  if (field === 'createTime') return '按创建时间';
  if (field === 'updateTime') return '按修改时间';
  return '默认 (ID)';
}

export default function SettingsPage() {
  var navigate = useNavigate();
  var storedSettings = getStoredSettings();
  var username = getUsername();
  var loggedIn = isLogin();

  var activeSectionState = useState('preferences');
  var activeSection = activeSectionState[0];
  var setActiveSection = activeSectionState[1];

  var sortFieldState = useState(storedSettings.sortField);
  var sortField = sortFieldState[0];
  var setSortField = sortFieldState[1];

  var sortOrderState = useState(storedSettings.sortOrder);
  var sortOrder = sortOrderState[0];
  var setSortOrder = sortOrderState[1];

  var savedAtState = useState('');
  var savedAt = savedAtState[0];
  var setSavedAt = savedAtState[1];

  var cacheOpenState = useState(false);
  var cacheOpen = cacheOpenState[0];
  var setCacheOpen = cacheOpenState[1];

  var logoutOpenState = useState(false);
  var logoutOpen = logoutOpenState[0];
  var setLogoutOpen = logoutOpenState[1];

  var userInitial = 'U';
  if (username !== '') userInitial = username.slice(0, 1).toUpperCase();

  // ============================================================
  // 偏好
  // ============================================================
  function persistPreferences(field, order, notify) {
    var ok = saveSettings({ sortField: field, sortOrder: order });
    if (ok === false) {
      toast.error('偏好保存失败，请检查浏览器存储权限');
      return;
    }
    setSavedAt(formatClock(new Date()));
    if (notify === true) toast.success('偏好已保存');
  }

  function handleSortFieldChange(field) {
    setSortField(field);
    persistPreferences(field, sortOrder, false);
  }

  function handleSortOrderChange() {
    var nextOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(nextOrder);
    persistPreferences(sortField, nextOrder, false);
  }

  function handleResetPreferences() {
    setSortField(DEFAULT_SETTINGS.sortField);
    setSortOrder(DEFAULT_SETTINGS.sortOrder);
    persistPreferences(DEFAULT_SETTINGS.sortField, DEFAULT_SETTINGS.sortOrder, false);
    toast.success('已恢复默认浏览偏好');
  }

  // ============================================================
  // 数据管理
  // ============================================================
  function handleExportSettings() {
    var payload = {
      key: SETTINGS_KEY,
      sortField: sortField,
      sortOrder: sortOrder,
      exportedAt: new Date().toISOString(),
    };
    var content = JSON.stringify(payload, null, 2);
    var blob = new Blob([content], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');

    link.href = url;
    link.download = 'animehub-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('设置已导出');
  }

  function handleClearLocalCache() {
    try {
      var protectedKeys = ['token', 'userId', 'username'];
      var keysToRemove = [];
      var index = 0;

      for (index = 0; index < localStorage.length; index = index + 1) {
        var key = localStorage.key(index);
        if (key !== null && protectedKeys.indexOf(key) === -1) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(function (key) {
        localStorage.removeItem(key);
      });
      sessionStorage.clear();

      setSortField(DEFAULT_SETTINGS.sortField);
      setSortOrder(DEFAULT_SETTINGS.sortOrder);
      setSavedAt('');
      setCacheOpen(false);
      toast.success('本地缓存已清理，登录状态已保留');
    } catch (error) {
      toast.error('清理失败，请稍后重试');
    }
  }

  function handleLogout() {
    clearAuth();
    setLogoutOpen(false);
    navigate('/login', { replace: true });
  }

  // ============================================================
  // 文案
  // ============================================================
  var sectionTitle = '浏览偏好';
  var sectionDescription = '设置进入动漫库时使用的默认排序方式。';
  var sectionEyebrow = 'BROWSING PREFERENCES';

  if (activeSection === 'account') {
    sectionTitle = '账号与安全';
    sectionDescription = '管理当前登录账号、个人资料与退出操作。';
    sectionEyebrow = 'ACCOUNT & SECURITY';
  }
  if (activeSection === 'data') {
    sectionTitle = '数据与关于';
    sectionDescription = '管理保存在当前浏览器的数据，查看系统信息。';
    sectionEyebrow = 'DATA & ABOUT';
  }

  var savedLabel = savedAt === '' ? '自动保存已开启' : '已保存 ' + savedAt;
  var sortOrderLabel = sortOrder === 'DESC' ? '倒序' : '顺序';

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">

        {/* 顶部毛玻璃导航 */}
        <div className="sticky top-3 z-40 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              variant="ghost"
              onClick={function () { navigate('/'); }}
              aria-label="返回首页"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <HomeIcon className="size-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                <SettingsIcon className="size-3.5" />
              </div>
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">设置</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">{savedLabel}</span>
          </div>
        </div>

        {/* 设置中心头图 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-10 sm:py-10">
          <SettingsIcon
            className="pointer-events-none absolute -right-10 -top-12 size-72 rotate-12 text-white/[0.035]"
            strokeWidth={0.8}
          />
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <SparklesIcon className="size-3.5 text-sky-300" />
                CONTROL CENTER
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-5xl">
                把这里，
                <span className="bg-gradient-to-r from-sky-300 via-white to-amber-200 bg-clip-text text-transparent">
                  调成你喜欢的样子
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                管理浏览偏好、账号状态与本地数据。所有偏好设置会自动保存在当前浏览器。
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />
                  {loggedIn === true ? '账号已登录' : '当前未登录'}
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                  本地偏好自动保存
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                  {username || '动漫旅人'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={function () { navigate('/profile'); }}
                className="h-11 rounded-xl border-white/20 bg-white/10 px-4 text-white shadow-none transition-all hover:bg-white/15 hover:text-white active:scale-95"
              >
                <UserRoundIcon className="size-4" />
                个人中心
              </Button>
              <Button
                variant="outline"
                onClick={function () { navigate('/monitor'); }}
                className="h-11 rounded-xl border-white/20 bg-white/10 px-4 text-white shadow-none transition-all hover:bg-white/15 hover:text-white active:scale-95"
              >
                <FilmIcon className="size-4" />
                我的片单
              </Button>
            </div>
          </div>
        </header>

        {/* 概览 */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">账号状态</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <UserRoundIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {loggedIn === true ? '已登录' : '未登录'}
              </p>
              <p className="mt-1 truncate text-[11px] text-slate-400">@{username || 'anonymous'}</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">默认排序</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                  <ArrowUpDown className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{getSortLabel(sortField)}</p>
              <p className="mt-1 text-[11px] text-slate-400">{sortOrderLabel} · 打开动漫库时生效</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">本地偏好</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                  <CheckIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {savedAt === '' ? '自动保存' : '已保存'}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{savedAt === '' ? '当前浏览器' : '最近保存于 ' + savedAt}</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">系统状态</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <ShieldCheckIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                正常
              </p>
              <p className="mt-1 text-[11px] text-slate-400">设置中心运行中</p>
            </CardContent>
          </Card>
        </section>

        {/* 设置导航与内容 */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-3 lg:p-4">
                <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                  <Button
                    variant="ghost"
                    onClick={function () { setActiveSection('preferences'); }}
                    aria-current={activeSection === 'preferences' ? 'page' : undefined}
                    className={
                      'h-auto min-w-36 shrink-0 justify-start whitespace-normal rounded-xl px-3 py-3 transition-all active:scale-95 lg:w-full ' +
                      (activeSection === 'preferences'
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                    }
                  >
                    <span
                      className={
                        'flex size-8 shrink-0 items-center justify-center rounded-lg ' +
                        (activeSection === 'preferences' ? 'bg-white/10 text-white' : 'bg-sky-50 text-sky-500')
                      }
                    >
                      <SlidersHorizontalIcon className="size-4" />
                    </span>
                    <span className="ml-3 text-left">
                      <span className="block text-xs font-medium">浏览偏好</span>
                      <span
                        className={
                          'mt-0.5 hidden text-[10px] font-normal lg:block ' +
                          (activeSection === 'preferences' ? 'text-white/40' : 'text-slate-400')
                        }
                      >
                        排序与操作习惯
                      </span>
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={function () { setActiveSection('account'); }}
                    aria-current={activeSection === 'account' ? 'page' : undefined}
                    className={
                      'h-auto min-w-36 shrink-0 justify-start whitespace-normal rounded-xl px-3 py-3 transition-all active:scale-95 lg:w-full ' +
                      (activeSection === 'account'
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                    }
                  >
                    <span
                      className={
                        'flex size-8 shrink-0 items-center justify-center rounded-lg ' +
                        (activeSection === 'account' ? 'bg-white/10 text-white' : 'bg-violet-50 text-violet-500')
                      }
                    >
                      <UserRoundIcon className="size-4" />
                    </span>
                    <span className="ml-3 text-left">
                      <span className="block text-xs font-medium">账号与安全</span>
                      <span
                        className={
                          'mt-0.5 hidden text-[10px] font-normal lg:block ' +
                          (activeSection === 'account' ? 'text-white/40' : 'text-slate-400')
                        }
                      >
                        登录状态与退出
                      </span>
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={function () { setActiveSection('data'); }}
                    aria-current={activeSection === 'data' ? 'page' : undefined}
                    className={
                      'h-auto min-w-36 shrink-0 justify-start whitespace-normal rounded-xl px-3 py-3 transition-all active:scale-95 lg:w-full ' +
                      (activeSection === 'data'
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                    }
                  >
                    <span
                      className={
                        'flex size-8 shrink-0 items-center justify-center rounded-lg ' +
                        (activeSection === 'data' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-500')
                      }
                    >
                      <DatabaseIcon className="size-4" />
                    </span>
                    <span className="ml-3 text-left">
                      <span className="block text-xs font-medium">数据与关于</span>
                      <span
                        className={
                          'mt-0.5 hidden text-[10px] font-normal lg:block ' +
                          (activeSection === 'data' ? 'text-white/40' : 'text-slate-400')
                        }
                      >
                        本地数据与版本
                      </span>
                    </span>
                  </Button>
                </div>

                <div className="mt-3 hidden rounded-xl bg-slate-50 p-3 lg:block">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <ClockIcon className="size-3" />
                    更改会自动保存
                  </div>
                  <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
                    偏好仅保存在当前浏览器，不会上传到服务器。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            <div className="mb-4 px-1">
              <p className="text-[10px] font-medium tracking-[0.22em] text-slate-400">{sectionEyebrow}</p>
              <h2 className="m-0 mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{sectionTitle}</h2>
              <p className="mt-1 text-xs text-slate-400">{sectionDescription}</p>
            </div>

            {/* ==================== 浏览偏好 ==================== */}
            {activeSection === 'preferences' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">动漫库默认排序</CardTitle>
                        <CardDescription className="mt-1 text-sm text-slate-400">
                          每次打开动漫库时优先使用的排序方式
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleResetPreferences}
                        className="h-9 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                      >
                        <RotateCcwIcon className="size-3.5" />
                        恢复默认
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <Label>排序字段</Label>
                        <Select value={sortField} onValueChange={handleSortFieldChange}>
                          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-slate-700 transition-all hover:border-slate-300 active:scale-95">
                            <SelectValue placeholder="选择排序字段">
                              {getSortLabel(sortField)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-0 shadow-xl">
                            <SelectItem value="id">默认 (ID)</SelectItem>
                            <SelectItem value="name">按名称</SelectItem>
                            <SelectItem value="createTime">按创建时间</SelectItem>
                            <SelectItem value="updateTime">按修改时间</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>排序方向</Label>
                        <Button
                          variant="outline"
                          onClick={handleSortOrderChange}
                          className="h-11 w-full gap-2 rounded-xl border-slate-200 px-4 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
                        >
                          <ArrowUpDown className="size-4" />
                          {sortOrder === 'DESC' ? '倒序' : '顺序'}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-medium tracking-[0.16em] text-slate-400">CURRENT DEFAULT</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {getSortLabel(sortField)} · {sortOrderLabel}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-white text-[10px] text-slate-500">
                        打开片单时生效
                      </Badge>
                    </div>

                    <p className="mt-3 text-[10px] leading-5 text-slate-400">
                      如果地址栏中带有排序参数，将优先使用地址栏中的设置。
                    </p>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center gap-2">
                      <KeyboardIcon className="size-4 text-sky-500" />
                      <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">快捷键</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-slate-400">这些快捷键可以让你更快地操作</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
                      <span className="text-xs text-slate-600">在动漫库中聚焦搜索框</span>
                      <span className="flex items-center gap-1">
                        <Kbd>⌘K</Kbd>
                        <span className="text-[10px] text-slate-300">/</span>
                        <Kbd>Ctrl K</Kbd>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
                      <span className="text-xs text-slate-600">跳转页码</span>
                      <Kbd>Enter</Kbd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
                      <span className="text-xs text-slate-600">关闭弹窗</span>
                      <Kbd>Esc</Kbd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-slate-600">切换焦点</span>
                      <Kbd>Tab</Kbd>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== 账号与安全 ==================== */}
            {activeSection === 'account' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">当前登录账号</CardTitle>
                        <CardDescription className="mt-1 text-sm text-slate-400">账号资料由个人中心统一管理</CardDescription>
                      </div>
                      <Badge className="rounded-full bg-emerald-50 px-2.5 text-[10px] font-medium text-emerald-600">
                        已激活
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
                      <Avatar className="size-16 shadow-sm ring-4 ring-white">
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-xl font-semibold text-white">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{username || '动漫旅人'}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">@{username || 'anonymous'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            当前会话有效
                          </span>
                          <span className="h-3 w-px bg-slate-200" />
                          <span>登录凭证已保存在本地</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <Button
                        onClick={function () { navigate('/profile'); }}
                        className="h-11 flex-1 rounded-xl bg-slate-900 px-4 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                      >
                        <UserRoundIcon className="size-4" />
                        打开个人中心
                      </Button>
                      <Button
                        variant="outline"
                        onClick={function () { setLogoutOpen(true); }}
                        className="h-11 flex-1 rounded-xl border-slate-200 px-4 text-slate-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                      >
                        <LogOutIcon className="size-4" />
                        退出登录
                      </Button>
                    </div>

                    <div className="mt-6 space-y-0">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                        <span className="text-slate-400">登录状态</span>
                        <span className="font-medium text-slate-700">{loggedIn === true ? '在线' : '离线'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                        <span className="text-slate-400">资料管理</span>
                        <span className="font-medium text-slate-700">个人中心</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="text-slate-400">密码与安全</span>
                        <span className="font-medium text-slate-700">个人中心 · 账号安全</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                      <ShieldCheckIcon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">账号安全提示</h3>
                    <p className="mt-1.5 text-xs leading-6 text-slate-400">
                      请勿向他人透露登录密码。修改密码后当前会话会失效，需要使用新密码重新登录。
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
                        <CheckIcon className="size-3.5 text-emerald-500" strokeWidth={3} />
                        密码登录保护
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
                        <CheckIcon className="size-3.5 text-emerald-500" strokeWidth={3} />
                        个人资料独立存储
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== 数据与关于 ==================== */}
            {activeSection === 'data' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <HardDriveIcon className="size-4 text-sky-500" />
                      <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">本地数据</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-slate-400">
                      这些数据只保存在当前浏览器，不会上传到服务器
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                          <SlidersHorizontalIcon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">浏览偏好</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{getSortLabel(sortField)} · {sortOrderLabel}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleExportSettings}
                        className="h-9 shrink-0 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-white hover:text-slate-900 active:scale-95"
                      >
                        <DownloadIcon className="size-3.5" />
                        导出设置
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-700">恢复默认偏好</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">将动漫库默认排序恢复为 ID 倒序</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleResetPreferences}
                          className="h-9 shrink-0 rounded-xl border-slate-200 px-3 text-xs text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                        >
                          <RotateCcwIcon className="size-3.5" />
                          恢复默认
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-medium text-rose-600">清理本地缓存</p>
                          <p className="mt-0.5 text-[10px] text-rose-400">移除偏好与其他本地缓存，保留登录状态</p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={function () { setCacheOpen(true); }}
                          className="h-9 shrink-0 rounded-xl bg-rose-600 px-3 text-xs text-white transition-all hover:bg-rose-700 active:scale-95"
                        >
                          <Trash2Icon className="size-3.5" />
                          清理缓存
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Code2Icon className="size-4 text-violet-500" />
                      <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">关于 ANIME HUB</CardTitle>
                    </div>
                    <CardDescription className="text-sm text-slate-400">私人动漫收藏与管理系统</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">React</Badge>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">Tailwind CSS</Badge>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">shadcn/ui</Badge>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">Spring Boot</Badge>
                    </div>

                    <div className="mt-5 space-y-0">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                        <span className="text-slate-400">版本</span>
                        <span className="font-medium text-slate-700">v1.0.0</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                        <span className="text-slate-400">运行状态</span>
                        <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          正常
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="text-slate-400">数据存储</span>
                        <span className="font-medium text-slate-700">本地浏览器</span>
                      </div>
                    </div>

                    <p className="mt-4 text-[10px] leading-5 text-slate-400">
                      本系统包含多用户数据隔离、图片上传托管、防重 Token 提交校验以及接入大模型的 AI 早报功能。
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · CONTROL CENTER</span>
          <span>{savedLabel}</span>
        </footer>
      </div>

      {/* 清理缓存确认 */}
      <Dialog open={cacheOpen} onOpenChange={setCacheOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2Icon className="size-5" />
            </div>
            <DialogTitle className="text-lg">清理本地缓存？</DialogTitle>
            <DialogDescription className="leading-6">
              将移除浏览偏好与其他本地缓存，但会保留登录状态。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={function () { setCacheOpen(false); }}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearLocalCache}
              className="h-10 rounded-xl bg-rose-600 text-white transition-all hover:bg-rose-700 active:scale-95"
            >
              确认清理
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退出登录确认 */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <LogOutIcon className="size-5" />
            </div>
            <DialogTitle className="text-lg">退出当前账号？</DialogTitle>
            <DialogDescription className="leading-6">
              退出后需要重新登录才能访问动漫库与个人资料。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={function () { setLogoutOpen(false); }}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-10 rounded-xl bg-rose-600 text-white transition-all hover:bg-rose-700 active:scale-95"
            >
              退出登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}