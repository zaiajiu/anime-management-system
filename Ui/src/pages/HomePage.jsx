import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  Code2Icon,
  CopyIcon,
  FilmIcon,
  NewspaperIcon,
  PlayIcon,
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getNewspaperNews } from '@/api/Newspaper';
import { fetchAnimeCount, fetchAnimeList } from '@/api/anime';
import { isLogin, getUsername } from '@/utils/auth';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var RECENT_SKELETONS = [0, 1, 2, 3, 4, 5];

// 内联 SVG 兜底图，避免封面缺失时出现破图
function getDefaultImage(label) {
  var text = label || '无图';
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="266">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/>' +
    '</linearGradient></defs>' +
    '<rect width="100%" height="100%" fill="url(#g)"/>' +
    '<text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#94a3b8" font-size="16">' +
    text +
    '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getImageUrl(path) {
  if (!path) return getDefaultImage('未上传');
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

function padNumber(number) {
  if (number < 10) return '0' + number;
  return String(number);
}

function formatToday() {
  var date = new Date();
  var weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return (date.getMonth() + 1) + '月' + date.getDate() + '日 · ' + weekdays[date.getDay()];
}

function getGreeting() {
  var hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getReadingMinutes(text) {
  if (!text) return 0;
  var minutes = Math.ceil(text.length / 350);
  if (minutes < 1) minutes = 1;
  return minutes;
}

function formatUpdateDate(value) {
  if (!value) return '近期更新';
  var text = String(value);
  var normalized = text.replace(' ', 'T');
  var time = new Date(normalized).getTime();
  if (isNaN(time) === false) {
    var date = new Date(time);
    return padNumber(date.getMonth() + 1) + '/' + padNumber(date.getDate());
  }
  if (text.length >= 10) return text.slice(5, 10).replace('-', '/');
  return '近期更新';
}

function getNewsParagraphs(text) {
  if (!text) return [];
  return text.split(/\r?\n/).filter(function (line) {
    return line.trim() !== '';
  });
}

function getRecentStatus(index) {
  if (index === 0) {
    return { label: '今日主推', className: 'bg-white/95 text-slate-950' };
  }
  if (index === 1) {
    return { label: '人气精选', className: 'bg-amber-300/95 text-slate-950' };
  }
  return { label: '最近更新', className: 'bg-slate-950/75 text-white' };
}

export default function HomePage() {
  var navigate = useNavigate();
  var loggedIn = isLogin();
  var username = getUsername();

  var newsState = useState('');
  var news = newsState[0];
  var setNews = newsState[1];

  var dateState = useState('');
  var date = dateState[0];
  var setDate = dateState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var newsErrorState = useState(false);
  var newsError = newsErrorState[0];
  var setNewsError = newsErrorState[1];

  var totalState = useState(0);
  var total = totalState[0];
  var setTotal = totalState[1];

  var totalLoadingState = useState(loggedIn === true);
  var totalLoading = totalLoadingState[0];
  var setTotalLoading = totalLoadingState[1];

  var recentState = useState([]);
  var recent = recentState[0];
  var setRecent = recentState[1];

  var recentLoadingState = useState(loggedIn === true);
  var recentLoading = recentLoadingState[0];
  var setRecentLoading = recentLoadingState[1];

  var recentErrorState = useState(false);
  var recentError = recentErrorState[0];
  var setRecentError = recentErrorState[1];

  var newsExpandedState = useState(false);
  var newsExpanded = newsExpandedState[0];
  var setNewsExpanded = newsExpandedState[1];

  // ============================================================
  // 数据加载
  // ============================================================
  function loadNews() {
    setLoading(true);
    setNewsError(false);

    getNewspaperNews()
      .then(function (res) {
        if (res.success === true && res.data) {
          setNews(res.data.text || '');
          setDate(res.data.date || '');
        } else {
          setNewsError(true);
          if (res.message) toast.error(res.message);
        }
      })
      .catch(function (error) {
        logger.error('HomePage', '早报加载失败', error);
        setNewsError(true);
        toast.error('早报加载失败');
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function loadRecentAnime() {
    if (loggedIn === false) {
      setRecentLoading(false);
      return;
    }

    setRecentLoading(true);
    setRecentError(false);

    fetchAnimeList(1, 'updateTime', 'DESC')
      .then(function (res) {
        if (res.success === false) {
          setRecentError(true);
          if (res.message) toast.error(res.message);
          return;
        }
        setRecent(res.data || []);
      })
      .catch(function (error) {
        logger.error('HomePage', '最近更新加载失败', error);
        setRecentError(true);
        toast.error('最近更新加载失败');
      })
      .finally(function () {
        setRecentLoading(false);
      });
  }

  // 首屏：早报 + 登录后的动漫统计与最近更新
  useEffect(function () {
    loadNews();

    if (loggedIn === true) {
      fetchAnimeCount()
        .then(function (res) {
          if (res.success) setTotal(res.data || 0);
        })
        .catch(function (error) {
          logger.error('HomePage', '动漫总数加载失败', error);
        })
        .finally(function () {
          setTotalLoading(false);
        });

      loadRecentAnime();
    }
  }, []);

  // ============================================================
  // 交互
  // ============================================================
  function handleCopyNews() {
    if (news.trim() === '') return;

    if (navigator.clipboard === undefined || navigator.clipboard.writeText === undefined) {
      toast.error('当前环境不支持复制');
      return;
    }

    navigator.clipboard.writeText(news)
      .then(function () { toast.success('早报已复制'); })
      .catch(function () { toast.error('复制失败，请稍后重试'); });
  }

  function handleImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') return;
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  function handleBackdropError(event) {
    event.currentTarget.style.opacity = '0';
  }

  function handleScrollToNews() {
    var target = document.getElementById('daily-report');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var hasNews = news.trim() !== '';
  var readMinutes = getReadingMinutes(news);
  var newsParagraphs = getNewsParagraphs(news);
  var newsNeedsClamp = news.length > 360;
  var recentItems = recent.slice(0, 6);

  var spotlight = null;
  if (recent.length > 0) spotlight = recent[0];

  var userInitial = 'U';
  if (username !== '') userInitial = username.slice(0, 1).toUpperCase();

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
              <SparklesIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">ANIME HUB</p>
              <p className="hidden truncate text-[10px] tracking-[0.18em] text-slate-400 sm:block">
                PERSONAL STREAMING SPACE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={function () { navigate('/monitor'); }}
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <FilmIcon className="size-4" />
              <span className="hidden sm:inline">我的片单</span>
            </Button>

            {loggedIn === true ? (
              <Button
                variant="outline"
                onClick={function () { navigate('/profile'); }}
                className="h-9 rounded-xl border-slate-200 bg-white/80 px-2 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 active:scale-95 sm:pr-3"
                aria-label="进入个人中心"
              >
                <Avatar size="sm" className="size-6">
                  <AvatarFallback className="bg-slate-900 text-[10px] font-semibold text-white">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-24 truncate sm:inline">{username || '个人中心'}</span>
              </Button>
            ) : (
              <Button
                onClick={function () { navigate('/login'); }}
                className="h-9 rounded-xl bg-slate-900 px-3 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
              >
                <UserIcon className="size-4" />
                登录
              </Button>
            )}
          </div>
        </div>

        {/* 电影感主视觉 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10">
          {spotlight !== null && (
            <img
              src={getImageUrl(spotlight.imagePath)}
              alt=""
              aria-hidden="true"
              onError={handleBackdropError}
              className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-20 blur-[1px]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/55" />
          <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.85fr] lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                YOUR PERSONAL ANIME UNIVERSE
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-5xl">
                {getGreeting()}，
                <span className="bg-gradient-to-r from-sky-300 via-white to-amber-200 bg-clip-text text-transparent">
                  {loggedIn === true && username !== '' ? username : '欢迎回来'}
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                今天是 {date || formatToday()}。把喜欢的作品收进专属片单，随时回到属于你的故事里。
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  onClick={function () { navigate(loggedIn === true ? '/monitor' : '/login'); }}
                  className="h-11 rounded-xl bg-white px-5 text-slate-950 shadow-sm transition-all hover:bg-white/90 active:scale-95"
                >
                  <PlayIcon className="size-4 fill-current" />
                  {loggedIn === true ? '进入动漫库' : '登录开启片单'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScrollToNews}
                  className="h-11 rounded-xl border-white/20 bg-white/10 px-5 text-white shadow-none transition-all hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <NewspaperIcon className="size-4" />
                  阅读今日早报
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  AI 早报每日更新
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpenIcon className="size-3.5" />
                  {loggedIn === true
                    ? (totalLoading === true ? '正在同步馆藏' : '共 ' + total + ' 部馆藏作品')
                    : '登录后同步个人馆藏'}
                </span>
              </div>
            </div>

            {/* 今日主推 / 登录引导 */}
            {loggedIn === true ? (
              recentLoading === true ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md">
                  <div className="flex gap-3">
                    <Skeleton className="aspect-[3/4] w-20 shrink-0 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2.5 py-1">
                      <Skeleton className="h-3 w-20 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-3/4 rounded-full bg-white/10" />
                      <Skeleton className="h-3 w-1/2 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              ) : spotlight !== null ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={function () { navigate('/monitor/' + spotlight.id); }}
                  onKeyDown={function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate('/monitor/' + spotlight.id);
                    }
                  }}
                  className="group cursor-pointer rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-lg active:scale-95"
                >
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                      <img
                        src={getImageUrl(spotlight.imagePath)}
                        alt={spotlight.animeName || '今日主推'}
                        onError={handleImageError}
                        className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-medium tracking-[0.18em] text-sky-300">TODAY'S PICK</span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                        {spotlight.animeName || '未命名动漫'}
                      </p>
                      <p className="mt-1.5 text-[11px] text-white/45">
                        更新于 {formatUpdateDate(spotlight.updateTime)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-white/65 transition-colors group-hover:text-white">
                        查看详情
                        <ArrowUpRightIcon className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white/70">
                    <FilmIcon className="size-5" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">
                    {recentError === true ? '片单暂时没有连上' : '片单还在等待第一部作品'}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-white/40">
                    {recentError === true ? '稍后重试，或直接进入动漫库。' : '去动漫库添加作品，下一次打开就有主推。'}
                  </p>
                  <Button
                    onClick={function () {
                      if (recentError === true) {
                        loadRecentAnime();
                      } else {
                        navigate('/monitor');
                      }
                    }}
                    className="mt-4 h-9 rounded-xl bg-white/90 px-3.5 text-xs text-slate-950 transition-all hover:bg-white active:scale-95"
                  >
                    {recentError === true ? '重新加载' : '去添加动漫'}
                  </Button>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white/70">
                  <SparklesIcon className="size-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-white">登录后解锁专属片单</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  同步馆藏统计、最近更新与每日主推。
                </p>
                <Button
                  onClick={function () { navigate('/login'); }}
                  className="mt-4 h-9 rounded-xl bg-white/90 px-3.5 text-xs text-slate-950 transition-all hover:bg-white active:scale-95"
                >
                  立即登录
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* 数据统计 */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">我的动漫库</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 transition-colors duration-300 group-hover:bg-sky-100">
                  <BookOpenIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {loggedIn === true ? (totalLoading === true ? '···' : total) : '--'}
                <span className="ml-1 text-xs font-normal text-slate-400">部</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {loggedIn === true ? '已收录的动漫总数' : '登录后查看'}
              </p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">今日早报</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500 transition-colors duration-300 group-hover:bg-violet-100">
                  <NewspaperIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {loading === true ? '···' : (hasNews === true ? readMinutes : '--')}
                {loading === false && hasNews === true && (
                  <span className="ml-1 text-xs font-normal text-slate-400">min</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">AI 为你生成的阅读时长</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">最近更新</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-colors duration-300 group-hover:bg-amber-100">
                  <TrendingUpIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {loggedIn === true ? (recentLoading === true ? '···' : (recentError === true ? '--' : recentItems.length)) : '--'}
                <span className="ml-1 text-xs font-normal text-slate-400">部</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {loggedIn === true ? '近期同步的作品' : '登录后查看'}
              </p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">系统状态</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors duration-300 group-hover:bg-emerald-100">
                  <SparklesIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                正常
              </div>
              <p className="mt-1 text-[11px] text-slate-400">AI 引擎已接入，运行平稳</p>
            </CardContent>
          </Card>
        </section>

        {/* AI 早报 + 快捷入口 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card id="daily-report" className="relative h-full scroll-mt-24 gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-violet-400 to-amber-300" />
              <CardHeader className="flex flex-row items-start gap-4 p-6 pb-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                  <NewspaperIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                      今日 AI 早报
                    </CardTitle>
                    <Badge variant="secondary" className="rounded-full bg-violet-50 px-2.5 text-[10px] font-medium text-violet-600">
                      DeepSeek 生成
                    </Badge>
                  </div>
                  <CardDescription className="mt-1.5 text-sm text-slate-400">
                    每天 3 分钟，知晓科技与二次元大小事
                  </CardDescription>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>{date || '今日'}</span>
                    <span className="size-0.5 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      {loading === true ? '同步中' : '约 ' + readMinutes + ' 分钟'}
                    </span>
                  </div>
                </div>
                <div className="hidden select-none text-4xl font-black tracking-tighter text-slate-100 sm:block">
                  DAILY
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-2">
                {loading === true ? (
                  <div className="space-y-3.5">
                    <Skeleton className="h-4 w-11/12 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-10/12 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-8/12 rounded-full" />
                    <Skeleton className="h-4 w-9/12 rounded-full" />
                  </div>
                ) : newsError === true ? (
                  <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <NewspaperIcon className="size-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-700">早报暂时加载失败</p>
                    <p className="mt-1 text-xs text-slate-400">检查网络后再试一次，或者先去片单逛逛。</p>
                    <Button
                      onClick={loadNews}
                      className="mt-4 h-9 rounded-xl bg-slate-900 px-4 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                    >
                      重新获取
                    </Button>
                  </div>
                ) : hasNews === false ? (
                  <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <NewspaperIcon className="size-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-700">今日早报暂时还未生成</p>
                    <p className="mt-1 text-xs text-slate-400">请稍后再来，或先去动漫库发现新作品。</p>
                    <Button
                      onClick={function () { navigate('/monitor'); }}
                      className="mt-4 h-9 rounded-xl bg-slate-900 px-4 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                    >
                      去逛逛片单
                    </Button>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div
                      className={
                        'relative ' +
                        (newsExpanded === false && newsNeedsClamp === true ? 'max-h-80 overflow-hidden' : '')
                      }
                    >
                      <div className="space-y-4">
                        {newsParagraphs.map(function (paragraph, index) {
                          return (
                            <p
                              key={index}
                              className={
                                'text-[15px] leading-8 text-slate-600 ' +
                                (index === 0 ? '' : 'indent-8')
                              }
                            >
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                      {newsExpanded === false && newsNeedsClamp === true && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent" />
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={handleCopyNews}
                          className="h-9 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        >
                          <CopyIcon className="size-3.5" />
                          复制全文
                        </Button>
                        {newsNeedsClamp === true && (
                          <Button
                            variant="ghost"
                            onClick={function () { setNewsExpanded(newsExpanded === false); }}
                            aria-expanded={newsExpanded}
                            className="h-9 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                          >
                            {newsExpanded === true ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
                            {newsExpanded === true ? '收起' : '展开全文'}
                          </Button>
                        )}
                      </div>
                      <span className="text-[10px] tracking-wide text-slate-300">AI 生成内容 · 仅供参考</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">快捷入口</CardTitle>
                <CardDescription className="text-sm text-slate-400">一步抵达常用功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-6 pt-0">
                <Button
                  onClick={function () { navigate('/monitor'); }}
                  className="group/action h-14 w-full justify-start rounded-xl bg-slate-900 px-3.5 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                    <PlayIcon className="size-4 fill-current" />
                  </span>
                  <span className="ml-3 text-left">
                    <span className="block text-sm font-medium">进入动漫管理</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-white/45">管理、搜索与批量整理</span>
                  </span>
                  <ArrowUpRightIcon className="ml-auto size-4 text-white/35 transition-transform duration-300 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 group-hover/action:text-white" />
                </Button>

                <Button
                  variant="outline"
                  onClick={function () { navigate(loggedIn === true ? '/profile' : '/login'); }}
                  className="group/action h-14 w-full justify-start rounded-xl border-slate-200 bg-white px-3.5 text-slate-700 shadow-none transition-all hover:bg-slate-50 active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                    <UserIcon className="size-4" />
                  </span>
                  <span className="ml-3 text-left">
                    <span className="block text-sm font-medium">{loggedIn === true ? '个人中心' : '立即登录 / 注册'}</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                      {loggedIn === true ? (username || '查看账号与资料') : '同步专属动漫片单'}
                    </span>
                  </span>
                  <ArrowUpRightIcon className="ml-auto size-4 text-slate-300 transition-transform duration-300 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 group-hover/action:text-slate-500" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={function () { navigate('/settings'); }}
                  className="group/action h-14 w-full justify-start rounded-xl border border-transparent bg-slate-50 px-3.5 text-slate-700 shadow-none transition-all hover:border-slate-200 hover:bg-white active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                    <SettingsIcon className="size-4" />
                  </span>
                  <span className="ml-3 text-left">
                    <span className="block text-sm font-medium">系统设置</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-slate-400">偏好与账号配置</span>
                  </span>
                  <ArrowUpRightIcon className="ml-auto size-4 text-slate-300 transition-transform duration-300 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 group-hover/action:text-slate-500" />
                </Button>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Code2Icon className="size-4 text-sky-500" />
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">DEVELOPER NOTE</span>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  本系统基于 React + Spring Boot 构建。包含多用户数据隔离、图片上传托管、防重 Token 提交校验以及接入大模型的 AI 早报功能。
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">React</Badge>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">Spring Boot</Badge>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">AI</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近更新 */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-medium tracking-[0.22em] text-slate-400">RECENTLY ADDED</p>
              <h2 className="m-0 mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">最近更新</h2>
              <p className="mt-1 text-xs text-slate-400">从最新作品开始，继续探索你的动漫宇宙。</p>
            </div>
            <Button
              variant="ghost"
              onClick={function () { navigate(loggedIn === true ? '/monitor' : '/login'); }}
              className="h-9 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-white hover:text-slate-900 active:scale-95"
            >
              {loggedIn === true ? '查看全部' : '登录解锁'}
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>

          {recentLoading === true ? (
            <div className="flex gap-4 overflow-hidden pb-2 lg:grid lg:grid-cols-6 lg:gap-6">
              {RECENT_SKELETONS.map(function (key) {
                return (
                  <div key={key} className="w-[44%] shrink-0 sm:w-[30%] md:w-[23%] lg:w-auto">
                    <div className="overflow-hidden rounded-2xl bg-white p-0 shadow-sm ring-1 ring-slate-900/5">
                      <Skeleton className="aspect-[3/4] w-full rounded-none bg-slate-200/80" />
                      <div className="space-y-2 p-3">
                        <Skeleton className="h-3 w-3/4 rounded-full bg-slate-200/80" />
                        <Skeleton className="h-2.5 w-1/2 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : loggedIn === false ? (
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
                  <UserIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-900">登录后查看最近更新</h3>
                <p className="mt-1.5 max-w-sm text-xs leading-6 text-slate-400">
                  同步你的馆藏统计、最近上传的作品，以及下一次值得点开的今日主推。
                </p>
                <Button
                  onClick={function () { navigate('/login'); }}
                  className="mt-5 h-10 rounded-xl bg-slate-900 px-5 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                  立即登录
                </Button>
              </CardContent>
            </Card>
          ) : recent.length === 0 ? (
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FilmIcon className="size-6" />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-900">
                  {recentError === true ? '最近更新暂时加载失败' : '片单还是空的'}
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-6 text-slate-400">
                  {recentError === true ? '网络恢复后重新加载，或直接进入动漫库。' : '添加第一部动漫，让这里开始热闹起来。'}
                </p>
                <Button
                  onClick={function () {
                    if (recentError === true) {
                      loadRecentAnime();
                    } else {
                      navigate('/monitor');
                    }
                  }}
                  className="mt-5 h-10 rounded-xl bg-slate-900 px-5 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                  {recentError === true ? '重新加载' : '去添加动漫'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-6 lg:overflow-visible">
              {recentItems.map(function (item, index) {
                var statusMeta = getRecentStatus(index);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={function () { navigate('/monitor/' + item.id); }}
                    onKeyDown={function (event) {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate('/monitor/' + item.id);
                      }
                    }}
                    className="group w-[44%] shrink-0 cursor-pointer snap-start sm:w-[30%] md:w-[23%] lg:w-auto"
                  >
                    <Card
                      className="relative aspect-[3/4] gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                      style={{
                        animationDelay: (index * 45) + 'ms',
                        animationFillMode: 'both',
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden bg-slate-100">
                        <img
                          src={getImageUrl(item.imagePath)}
                          alt={item.animeName || '动漫封面'}
                          loading="lazy"
                          onError={handleImageError}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                        <Badge
                          variant="secondary"
                          className={
                            'absolute left-2.5 top-2.5 z-20 h-5 rounded-full border-0 px-2 text-[10px] font-semibold shadow-sm backdrop-blur-md ' +
                            statusMeta.className
                          }
                        >
                          {statusMeta.label}
                        </Badge>

                        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
                          <CardTitle className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-white drop-shadow sm:text-sm">
                            {item.animeName || '未命名动漫'}
                          </CardTitle>
                          <p className="mt-1 text-[10px] text-white/55">
                            {formatUpdateDate(item.updateTime)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · 私人动漫宇宙</span>
          <span>{formatToday()}</span>
        </footer>
      </div>
    </div>
  );
}
