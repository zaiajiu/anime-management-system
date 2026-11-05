import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  CircleAlertIcon,
  ClockIcon,
  EditIcon,
  FileTextIcon,
  FilmIcon,
  InfoIcon,
  Loader2Icon,
  MessageSquareQuoteIcon,
  RefreshCwIcon,
  SaveIcon,
  Share2Icon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { fetchAnimeById, updateAnime } from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var DETAIL_STAT_SKELETONS = [0, 1, 2, 3];

// 内联 SVG 兜底图
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

function toDate(value) {
  if (!value) return null;
  var text = String(value).replace(' ', 'T');
  var date = new Date(text);
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDateTime(value) {
  var date = toDate(value);
  if (date === null) return value || '-';
  return (
    date.getFullYear() +
    '年' +
    padNumber(date.getMonth() + 1) +
    '月' +
    padNumber(date.getDate()) +
    '日 ' +
    padNumber(date.getHours()) +
    ':' +
    padNumber(date.getMinutes())
  );
}

function formatShortDate(value) {
  var date = toDate(value);
  if (date === null) return '未知';
  return padNumber(date.getMonth() + 1) + '/' + padNumber(date.getDate());
}

function getDaysSince(value) {
  var date = toDate(value);
  if (date === null) return null;
  var diff = Date.now() - date.getTime();
  if (diff < 0) return 1;
  return Math.floor(diff / 86400000) + 1;
}

function getStatusMeta(id) {
  var seed = 0;
  if (typeof id === 'number') {
    seed = id;
  } else {
    seed = String(id || '').length;
  }
  var index = Math.abs(seed) % 3;
  if (index === 0) {
    return { label: '连载中', className: 'bg-emerald-500/95 text-white' };
  }
  if (index === 1) {
    return { label: '已完结', className: 'bg-slate-700/95 text-white' };
  }
  return { label: '热门', className: 'bg-rose-500/95 text-white' };
}

function getParagraphs(text) {
  if (!text) return [];
  return text.split(/\r?\n/).filter(function (line) {
    return line.trim() !== '';
  });
}

function AnimeDetailPage() {
  var params = useParams();
  var id = params.id;
  var navigate = useNavigate();

  var animeState = useState(null);
  var anime = animeState[0];
  var setAnime = animeState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  var editOpenState = useState(false);
  var editOpen = editOpenState[0];
  var setEditOpen = editOpenState[1];

  // ============================================================
  // 数据加载
  // ============================================================
  function loadAnime() {
    logger.debug('AnimeDetailPage', '加载动漫详情', { id: id });
    setLoading(true);
    setError('');

    fetchAnimeById(id)
      .then(function (res) {
        if (res.success === false) {
          setAnime(null);
          setError(res.message || '作品加载失败');
          return;
        }
        setAnime(res.data || null);
      })
      .catch(function (err) {
        logger.error('AnimeDetailPage', '加载动漫详情失败', err);
        setError('加载失败：' + err.message);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  useEffect(function () {
    loadAnime();
  }, [id]);

  // ============================================================
  // 交互
  // ============================================================
  function handleBack() {
    navigate(-1);
  }

  function handleEditSuccess() {
    setEditOpen(false);
    loadAnime();
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

  function handleCopyLink() {
    if (navigator.clipboard === undefined || navigator.clipboard.writeText === undefined) {
      toast.error('当前环境不支持复制');
      return;
    }

    navigator.clipboard.writeText(window.location.href)
      .then(function () { toast.success('作品链接已复制'); })
      .catch(function () { toast.error('复制失败，请稍后重试'); });
  }

  function handleOpenEdit() {
    setEditOpen(true);
  }

  // ============================================================
  // 骨架屏
  // ============================================================
  if (loading === true) {
    return (
      <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1440px] space-y-6">
          <Skeleton className="h-14 rounded-2xl bg-white/80" />
          <Skeleton className="h-80 rounded-[2rem] bg-slate-200/80 sm:h-96" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {DETAIL_STAT_SKELETONS.map(function (key) {
              return <Skeleton key={key} className="h-32 rounded-2xl bg-white" />;
            })}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
            <div className="space-y-6">
              <Skeleton className="h-11 w-full max-w-md rounded-2xl bg-white" />
              <Skeleton className="h-80 rounded-[2rem] bg-white" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 rounded-[2rem] bg-white" />
              <Skeleton className="h-44 rounded-[2rem] bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 错误 / 不存在
  // ============================================================
  if (error !== '' || anime === null) {
    var statusTitle = '没有找到这部动漫';
    var statusDescription = '它可能已经被删除，或者链接地址不正确。';
    if (error !== '') {
      statusTitle = '作品加载失败';
      statusDescription = error;
    }

    return (
      <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[72vh] w-full max-w-2xl items-center justify-center">
          <Empty className="w-full rounded-[2rem] border border-dashed border-slate-200 bg-white/80 py-16 shadow-sm backdrop-blur-sm">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="mb-4 size-16 rounded-2xl bg-rose-50 text-rose-500"
              >
                <CircleAlertIcon className="size-7" />
              </EmptyMedia>
              <EmptyTitle className="text-xl font-semibold tracking-tight text-slate-900">
                {statusTitle}
              </EmptyTitle>
              <EmptyDescription className="max-w-sm text-sm leading-6 text-slate-400">
                {statusDescription}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center">
              <Button
                onClick={loadAnime}
                className="h-10 rounded-xl bg-slate-900 px-5 text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                <RefreshCwIcon className="size-4" />
                重新加载
              </Button>
              <Button
                variant="outline"
                onClick={function () { navigate('/monitor'); }}
                className="h-10 rounded-xl border-slate-200 px-5 transition-all active:scale-95"
              >
                返回动漫库
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  // ============================================================
  // 派生数据
  // ============================================================
  var coverUrl = getImageUrl(anime.imagePath);
  var statusMeta = getStatusMeta(anime.id);
  var introduction = anime.animeIntroduction || '';
  var comment = anime.animeComment || '';
  var hasIntroduction = introduction.trim() !== '';
  var hasComment = comment.trim() !== '';
  var introParagraphs = getParagraphs(introduction);
  var commentParagraphs = getParagraphs(comment);
  var days = getDaysSince(anime.createTime);
  var completion = 0;
  if (anime.imagePath) completion = completion + 34;
  if (hasIntroduction === true) completion = completion + 33;
  if (hasComment === true) completion = completion + 33;

  var checklist = [
    { label: '封面已上传', done: Boolean(anime.imagePath) },
    { label: '简介已填写', done: hasIntroduction },
    { label: '观后感已记录', done: hasComment },
  ];

  // ============================================================
  // 页面
  // ============================================================
  return (
    <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-16 text-left sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">

        {/* 顶部毛玻璃导航 */}
        <div className="sticky top-3 z-40 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Button
              variant="ghost"
              onClick={handleBack}
              aria-label="返回上一页"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">返回</span>
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                <FilmIcon className="size-3.5" />
              </div>
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">作品详情</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={handleCopyLink}
              aria-label="复制作品链接"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <Share2Icon className="size-4" />
              <span className="hidden sm:inline">复制链接</span>
            </Button>
            <Button
              onClick={handleOpenEdit}
              className="h-9 rounded-xl bg-slate-900 px-3 text-xs text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 sm:px-3.5"
            >
              <EditIcon className="size-3.5" />
              编辑
            </Button>
          </div>
        </div>

        {/* 电影感详情头图 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-10 sm:py-10">
          {anime.imagePath && (
            <img
              key={coverUrl}
              src={coverUrl}
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

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <div className="group relative w-36 shrink-0 overflow-hidden rounded-2xl bg-slate-800 shadow-2xl ring-1 ring-white/15 sm:w-44 lg:w-52">
              <img
                key={coverUrl}
                src={coverUrl}
                alt={anime.animeName || '动漫封面'}
                onError={handleImageError}
                className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[9px] font-medium tracking-[0.2em] text-white/50">PRIVATE ARCHIVE</p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-white">
                  {anime.animeName || '未命名动漫'}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <SparklesIcon className="size-3.5 text-sky-300" />
                ANIME DETAIL · MY COLLECTION
              </div>
              <h1 className="m-0 line-clamp-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {anime.animeName || '未命名动漫'}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className={'rounded-full border-0 px-2.5 text-[10px] font-semibold shadow-sm ' + statusMeta.className}>
                  {statusMeta.label}
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                  ID #{anime.id}
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                  私人收藏
                </Badge>
              </div>

              <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-7 text-white/55">
                {introduction || '这部作品还没有写下简介，点击右上角编辑补充一段介绍。'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/35">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  创建于 {formatShortDate(anime.createTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCwIcon className="size-3.5" />
                  更新于 {formatShortDate(anime.updateTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpenIcon className="size-3.5" />
                  资料完整度 {completion}%
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 数据概览 */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">资料完整度</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 transition-colors duration-300 group-hover:bg-sky-100">
                  <SparklesIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {completion}
                <span className="ml-1 text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500 transition-all duration-500"
                  style={{ width: completion + '%' }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">简介字数</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500 transition-colors duration-300 group-hover:bg-violet-100">
                  <FileTextIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {introduction.length}
                <span className="ml-1 text-xs font-normal text-slate-400">字</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">作品简介内容长度</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">观后感字数</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-colors duration-300 group-hover:bg-amber-100">
                  <MessageSquareQuoteIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {comment.length}
                <span className="ml-1 text-xs font-normal text-slate-400">字</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">记录下来的观看感受</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">收录天数</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors duration-300 group-hover:bg-emerald-100">
                  <CalendarDaysIcon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {days === null ? '--' : days}
                <span className="ml-1 text-xs font-normal text-slate-400">天</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">从创建日期开始计算</p>
            </CardContent>
          </Card>
        </section>

        {/* 内容与侧栏 */}
        <div className="grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs defaultValue="intro" className="w-full">
              <TabsList className="h-11 w-full max-w-md rounded-2xl border border-white/80 bg-white/80 p-1 shadow-sm backdrop-blur-md">
                <TabsTrigger
                  value="intro"
                  className="h-9 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
                >
                  <BookOpenIcon className="size-4" />
                  作品简介
                </TabsTrigger>
                <TabsTrigger
                  value="comment"
                  className="h-9 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
                >
                  <MessageSquareQuoteIcon className="size-4" />
                  观后感
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="intro"
                className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-start gap-4 p-6 pb-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <BookOpenIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">作品简介</CardTitle>
                      <CardDescription className="mt-1 text-sm text-slate-400">
                        关于这部作品的基础介绍
                      </CardDescription>
                    </div>
                    <span className="hidden text-[10px] text-slate-300 sm:block">{introduction.length} 字</span>
                  </CardHeader>

                  <CardContent className="p-6 pt-2">
                    {hasIntroduction === false ? (
                      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                          <FileTextIcon className="size-6" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-700">还没有作品简介</p>
                        <p className="mt-1 text-xs text-slate-400">补充一段介绍，让这部作品更容易被记住。</p>
                        <Button
                          onClick={handleOpenEdit}
                          className="mt-4 h-9 rounded-xl bg-slate-900 px-4 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                          <EditIcon className="size-3.5" />
                          补充简介
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {introParagraphs.map(function (paragraph, index) {
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="comment"
                className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-start gap-4 p-6 pb-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <MessageSquareQuoteIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">观后感</CardTitle>
                      <CardDescription className="mt-1 text-sm text-slate-400">
                        记录你与这部作品的故事
                      </CardDescription>
                    </div>
                    <span className="hidden text-[10px] text-slate-300 sm:block">{comment.length} 字</span>
                  </CardHeader>

                  <CardContent className="p-6 pt-2">
                    {hasComment === false ? (
                      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                          <MessageSquareQuoteIcon className="size-6" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-700">还没有写下观后感</p>
                        <p className="mt-1 text-xs text-slate-400">趁记忆还新鲜，记下此刻最真实的感受。</p>
                        <Button
                          onClick={handleOpenEdit}
                          className="mt-4 h-9 rounded-xl bg-slate-900 px-4 text-xs text-white transition-all hover:bg-slate-800 active:scale-95"
                        >
                          <EditIcon className="size-3.5" />
                          写下观后感
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {commentParagraphs.map(function (paragraph, index) {
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-2">
                  <InfoIcon className="size-4 text-sky-500" />
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">DETAILS</p>
                </div>
                <CardTitle className="mt-2 text-lg font-semibold tracking-tight text-slate-900">作品信息</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                  <span className="text-slate-400">作品 ID</span>
                  <span className="max-w-40 truncate font-medium text-slate-700">#{anime.id}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                  <span className="text-slate-400">作品状态</span>
                  <Badge className={'rounded-full border-0 px-2.5 py-0.5 text-[10px] font-semibold ' + statusMeta.className}>
                    {statusMeta.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                  <span className="text-slate-400">创建时间</span>
                  <span className="text-right text-xs font-medium text-slate-600">{formatDateTime(anime.createTime)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                  <span className="text-slate-400">更新时间</span>
                  <span className="text-right text-xs font-medium text-slate-600">{formatDateTime(anime.updateTime)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-slate-400">封面状态</span>
                  <span className="text-xs font-medium text-slate-600">{anime.imagePath ? '已上传' : '默认占位图'}</span>
                </div>

                <div className="mt-2 space-y-2.5 rounded-xl bg-slate-50 p-3.5">
                  {checklist.map(function (item, index) {
                    return (
                      <div key={index} className="flex items-center gap-2.5 text-[11px]">
                        <span
                          className={
                            'flex size-4 items-center justify-center rounded-full ' +
                            (item.done === true ? 'bg-emerald-50 text-emerald-500' : 'bg-white text-slate-300')
                          }
                        >
                          {item.done === true ? <CheckIcon className="size-2.5" strokeWidth={3} /> : <span className="size-1 rounded-full bg-current" />}
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
                <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">快捷操作</CardTitle>
                <CardDescription className="text-sm text-slate-400">管理这部作品的快捷入口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-6 pt-0">
                <Button
                  onClick={handleOpenEdit}
                  className="h-12 w-full justify-start rounded-xl bg-slate-900 px-3.5 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                    <EditIcon className="size-4" />
                  </span>
                  <span className="ml-3 text-sm font-medium">编辑作品资料</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-12 w-full justify-start rounded-xl border-slate-200 px-3.5 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                    <Share2Icon className="size-4" />
                  </span>
                  <span className="ml-3 text-sm font-medium">复制作品链接</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={function () { navigate('/monitor'); }}
                  className="h-12 w-full justify-start rounded-xl px-3.5 text-slate-600 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <ArrowLeftIcon className="size-4" />
                  </span>
                  <span className="ml-3 text-sm font-medium">返回动漫库</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · 作品详情</span>
          <span>{anime.animeName || '未命名动漫'}</span>
        </footer>
      </div>

      <EditAnimeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        anime={anime}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

// ============================================================
// 编辑弹窗
// ============================================================
function EditAnimeDialog(props) {
  var open = props.open;
  var onOpenChange = props.onOpenChange;
  var anime = props.anime;
  var onSuccess = props.onSuccess;

  var formState = useState({ animeName: '', animeIntroduction: '', animeComment: '' });
  var form = formState[0];
  var setForm = formState[1];

  var coverFileState = useState(null);
  var coverFile = coverFileState[0];
  var setCoverFile = coverFileState[1];

  var previewState = useState('');
  var preview = previewState[0];
  var setPreview = previewState[1];

  var submittingState = useState(false);
  var submitting = submittingState[0];
  var setSubmitting = submittingState[1];

  var fileRef = useRef(null);
  var previewUrlRef = useRef('');

  useEffect(function () {
    if (open === true && anime !== null) {
      setForm({
        animeName: anime.animeName || '',
        animeIntroduction: anime.animeIntroduction || '',
        animeComment: anime.animeComment || '',
      });
      setCoverFile(null);
      setPreview('');
      if (fileRef.current) fileRef.current.value = '';
      if (previewUrlRef.current !== '') {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    }
  }, [open, anime]);

  useEffect(function () {
    return function () {
      if (previewUrlRef.current !== '') {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleNameChange(event) {
    setForm({
      animeName: event.target.value,
      animeIntroduction: form.animeIntroduction,
      animeComment: form.animeComment,
    });
  }

  function handleIntroductionChange(event) {
    setForm({
      animeName: form.animeName,
      animeIntroduction: event.target.value,
      animeComment: form.animeComment,
    });
  }

  function handleCommentChange(event) {
    setForm({
      animeName: form.animeName,
      animeIntroduction: form.animeIntroduction,
      animeComment: event.target.value,
    });
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

    if (previewUrlRef.current !== '') {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    var objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setCoverFile(file);
    setPreview(objectUrl);
  }

  function handleEditImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') return;
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (form.animeName.trim() === '') {
      toast.error('请输入动漫名称');
      return;
    }
    if (submitting === true) return;

    setSubmitting(true);
    logger.info('EditAnimeDialog', '修改动漫', { id: anime.id });

    updateAnime(anime.id, {
      animeName: form.animeName,
      animeIntroduction: form.animeIntroduction,
      animeComment: form.animeComment,
      image: coverFile,
    })
      .then(function (res) {
        if (res.success !== true) {
          toast.error(res.message || '修改失败');
          return;
        }
        toast.success('资料修改成功');
        onSuccess();
      })
      .catch(function (error) {
        logger.error('EditAnimeDialog', '修改失败', error);
        toast.error('修改失败：' + error.message);
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function handleClose() {
    if (submitting === true) return;
    onOpenChange(false);
  }

  var previewSrc = preview !== '' ? preview : getImageUrl(anime.imagePath);

  return (
    <Dialog open={open} onOpenChange={function (value) { if (value === false) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl sm:max-w-2xl"
      >
        <div className="relative border-b border-slate-100 p-6 pr-14">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">EDIT ANIME</span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <DialogTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              编辑作品资料
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              封面不选择时会保留原图，保存后将立即更新详情页。
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            disabled={submitting}
            aria-label="关闭编辑弹窗"
            className="absolute right-4 top-4 rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 p-6 sm:grid-cols-[150px_1fr]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                <img
                  key={previewSrc}
                  src={previewSrc}
                  alt="封面预览"
                  onError={handleEditImageError}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
              <div>
                <Label htmlFor="edit-image" className="text-xs text-slate-600">
                  更换封面
                </Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={handleFileChange}
                  disabled={submitting}
                  className="mt-2 h-auto cursor-pointer rounded-xl border-slate-200 bg-white p-2 text-[11px] text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-900 file:px-2.5 file:py-1 file:text-[10px] file:font-medium file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-2 text-[10px] leading-4 text-slate-400">JPG / PNG，不超过 5MB</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-anime-name">动漫名称</Label>
                <Input
                  id="edit-anime-name"
                  value={form.animeName}
                  onChange={handleNameChange}
                  disabled={submitting}
                  placeholder="请输入动漫名称"
                  className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="edit-introduction">简介</Label>
                  <span className="text-[10px] text-slate-400">{form.animeIntroduction.length} 字</span>
                </div>
                <Textarea
                  id="edit-introduction"
                  rows={4}
                  value={form.animeIntroduction}
                  onChange={handleIntroductionChange}
                  disabled={submitting}
                  placeholder="简单介绍一下这部作品..."
                  className="min-h-24 rounded-xl border-slate-200 bg-white text-sm leading-6 text-slate-800 transition-all focus-visible:border-sky-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="edit-comment">观后感</Label>
                  <span className="text-[10px] text-slate-400">{form.animeComment.length} 字</span>
                </div>
                <Textarea
                  id="edit-comment"
                  rows={4}
                  value={form.animeComment}
                  onChange={handleCommentChange}
                  disabled={submitting}
                  placeholder="写下你与这部作品的故事..."
                  className="min-h-24 rounded-xl border-slate-200 bg-white text-sm leading-6 text-slate-800 transition-all focus-visible:border-sky-300"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-b-2xl border-t border-slate-100 bg-white p-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-xl border-slate-200 px-4 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-slate-900 px-5 text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              {submitting === true ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              {submitting === true ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AnimeDetailPage;