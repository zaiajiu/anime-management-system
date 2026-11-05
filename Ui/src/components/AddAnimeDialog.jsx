import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  ImagePlusIcon,
  InfoIcon,
  Loader2Icon,
  LockKeyholeIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { createAnime, fetchGetSubmitToken } from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner';

// 从原来的 AddAnimeDialog 改为独立页面：/monitor/create
export default function AddAnimePage() {
  var navigate = useNavigate();
  var location = useLocation();

  // 返回地址：优先回到来源列表；创建成功后回到第一页并保留筛选条件
  var returnTo = '/monitor';
  var successTo = '/monitor';
  if (location.state !== null && location.state !== undefined) {
    if (typeof location.state.from === 'string' && location.state.from !== '') {
      returnTo = location.state.from;
    }
    if (typeof location.state.successTo === 'string' && location.state.successTo !== '') {
      successTo = location.state.successTo;
    }
  }
  if (returnTo.indexOf('/') !== 0) returnTo = '/monitor';
  if (successTo.indexOf('/') !== 0) successTo = '/monitor';

  // 表单状态
  var formState = useState({
    animeName: '',
    animeIntroduction: '',
    animeComment: '',
  });
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

  var draggingState = useState(false);
  var dragging = draggingState[0];
  var setDragging = draggingState[1];

  // 防重复提交 Token
  var submitTokenState = useState('');
  var submitToken = submitTokenState[0];
  var setSubmitToken = submitTokenState[1];

  var tokenLoadingState = useState(true);
  var tokenLoading = tokenLoadingState[0];
  var setTokenLoading = tokenLoadingState[1];

  var tokenErrorState = useState(false);
  var tokenError = tokenErrorState[0];
  var setTokenError = tokenErrorState[1];

  var fileRef = useRef(null);
  var previewUrlRef = useRef('');

  // ============================================================
  // 初始化提交 Token 与预览图清理
  // ============================================================
  useEffect(function () {
    loadSubmitToken();

    return function () {
      if (previewUrlRef.current !== '') {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function loadSubmitToken() {
    setTokenLoading(true);
    setTokenError(false);

    fetchGetSubmitToken()
      .then(function (res) {
        if (res.success === true) {
          setSubmitToken(res.data || '');
        } else {
          setTokenError(true);
          toast.error(res.message || '安全校验初始化失败');
        }
      })
      .catch(function (error) {
        logger.error('AddAnimePage', '获取防重 Token 失败', error);
        setTokenError(true);
        toast.error('安全校验初始化失败');
      })
      .finally(function () {
        setTokenLoading(false);
      });
  }

  // ============================================================
  // 表单输入
  // ============================================================
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

  // ============================================================
  // 封面选择
  // ============================================================
  function setCoverFromFile(file) {
    if (submitting === true) return;
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
    setDragging(false);
  }

  function handleFileChange(event) {
    var file = event.target.files[0];
    setCoverFromFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    var file = event.dataTransfer.files[0];
    setCoverFromFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function handlePickFile() {
    if (submitting === true) return;
    if (fileRef.current) fileRef.current.click();
  }

  function handleRemoveCover() {
    if (previewUrlRef.current !== '') {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setCoverFile(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  }

  // ============================================================
  // 提交与返回
  // ============================================================
  function handleSubmit(event) {
    event.preventDefault();

    if (form.animeName.trim() === '') {
      toast.error('请输入动漫名称');
      return;
    }
    if (submitting === true) return;

    setSubmitting(true);
    logger.info('AddAnimePage', '提交新建动漫', {
      hasToken: submitToken !== '',
      hasCover: coverFile !== null,
    });

    createAnime({
      animeName: form.animeName,
      animeIntroduction: form.animeIntroduction,
      animeComment: form.animeComment,
      image: coverFile,
      Token: submitToken,
    })
      .then(function (res) {
        if (res.success !== true) {
          toast.error(res.message || '新建失败');
          return;
        }
        toast.success('新建成功');
        navigate(successTo, { replace: true });
      })
      .catch(function (error) {
        logger.error('AddAnimePage', '新建动漫失败', error);
        toast.error('新建失败：' + error.message);
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function handleCancel() {
    if (submitting === true) return;
    navigate(returnTo, { replace: true });
  }

  var nameReady = form.animeName.trim() !== '';
  var coverReady = preview !== '';
  var tokenReady = tokenLoading === false && tokenError === false && submitToken !== '';
  var tokenLabel = '安全校验准备中';
  if (tokenError === true) tokenLabel = '安全校验待重试';
  if (tokenReady === true) tokenLabel = '安全校验已就绪';

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
              onClick={handleCancel}
              disabled={submitting}
              aria-label="返回动漫库"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:px-3"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">返回片单</span>
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">新建动漫</p>
              <p className="hidden truncate text-[10px] tracking-[0.18em] text-slate-400 sm:block">CREATE NEW TITLE</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span
              className={
                'size-1.5 rounded-full ' +
                (tokenError === true
                  ? 'bg-rose-400'
                  : tokenReady === true
                    ? 'bg-emerald-500'
                    : 'animate-pulse bg-amber-400')
              }
            />
            <span className="hidden sm:inline">{tokenLabel}</span>
          </div>
        </div>

        {/* 顶部视觉区 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-10 sm:py-10">
          <PlusIcon
            className="pointer-events-none absolute -right-8 -top-10 size-64 rotate-12 text-white/[0.035]"
            strokeWidth={0.8}
          />
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <SparklesIcon className="size-3.5 text-sky-300" />
                NEW TITLE
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-5xl">
                为新的故事，
                <span className="bg-gradient-to-r from-sky-300 via-white to-amber-200 bg-clip-text text-transparent">
                  留一个位置
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                填写作品资料，选择一张喜欢的封面。创建成功后，它会出现在你的专属片单里。
              </p>

              {/* 创建步骤：随表单实时点亮 */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5 text-[11px] text-white/40">
                <div className={'flex items-center gap-2 ' + (coverReady === true ? 'text-white/80' : '')}>
                  <span
                    className={
                      'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ' +
                      (coverReady === true ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white/50')
                    }
                  >
                    {coverReady === true ? <CheckIcon className="size-3" strokeWidth={3} /> : '01'}
                  </span>
                  封面
                </div>
                <span className="h-px w-6 bg-white/15" />
                <div className={'flex items-center gap-2 ' + (nameReady === true ? 'text-white/80' : '')}>
                  <span
                    className={
                      'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ' +
                      (nameReady === true ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white/50')
                    }
                  >
                    {nameReady === true ? <CheckIcon className="size-3" strokeWidth={3} /> : '02'}
                  </span>
                  作品资料
                </div>
                <span className="h-px w-6 bg-white/15" />
                <div className={'flex items-center gap-2 ' + (nameReady === true ? 'text-white/80' : '')}>
                  <span
                    className={
                      'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ' +
                      (nameReady === true ? 'bg-white text-slate-950' : 'bg-white/10 text-white/50')
                    }
                  >
                    03
                  </span>
                  准备发布
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                3:4 竖版封面
              </Badge>
              <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                防重复提交
              </Badge>
              <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/65">
                创建后可编辑
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          {/* 左侧：封面与安全校验 */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400">COVER IMAGE</p>
                    <CardTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900">封面</CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-400">
                      选择一张 3:4 竖版图片，也可以暂时跳过
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-[10px] text-slate-500">
                    可选
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handlePickFile}
                  onKeyDown={function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handlePickFile();
                    }
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  aria-label={coverReady === true ? '更换封面' : '选择封面'}
                  className={
                    'group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-2 border-dashed outline-none transition-all duration-300 active:scale-[0.99] ' +
                    (dragging === true
                      ? 'border-sky-400 bg-sky-50'
                      : coverReady === true
                        ? 'border-transparent bg-slate-100'
                        : 'border-slate-200 bg-slate-50/70 hover:border-sky-400 hover:bg-sky-50/60')
                  }
                >
                  {coverReady === true ? (
                    <div className="absolute inset-0">
                      <img
                        src={preview}
                        alt="封面预览"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                        <p className="text-[10px] font-medium tracking-[0.18em] text-white/50">COVER PREVIEW</p>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-white">
                          {form.animeName.trim() || '未命名动漫'}
                        </p>
                      </div>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1.5 text-[11px] text-white backdrop-blur-md">
                          <ImagePlusIcon className="size-3.5" />
                          点击更换
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:text-sky-500">
                        <ImagePlusIcon className="size-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">拖拽封面到这里</p>
                        <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                          或点击选择本地图片
                          <br />
                          JPG / PNG，文件不超过 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={submitting}
                  className="sr-only"
                  tabIndex={-1}
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
                    {coverFile !== null ? coverFile.name : '推荐 3:4 比例，视觉效果更佳'}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {coverReady === true && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveCover}
                        disabled={submitting}
                        className="h-9 rounded-xl px-3 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-rose-500 active:scale-95"
                      >
                        移除
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePickFile}
                      disabled={submitting}
                      className="h-9 rounded-xl border-slate-200 px-3 text-xs text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      <ImagePlusIcon className="size-3.5" />
                      {coverReady === true ? '更换封面' : '选择封面'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 防重复提交状态 */}
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={
                      'flex size-10 shrink-0 items-center justify-center rounded-xl ' +
                      (tokenError === true
                        ? 'bg-rose-50 text-rose-500'
                        : tokenReady === true
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-amber-50 text-amber-500')
                    }
                  >
                    {tokenReady === true ? <ShieldCheckIcon className="size-5" /> : <LockKeyholeIcon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">提交保护</p>
                      <Badge
                        variant="secondary"
                        className={
                          'rounded-full text-[10px] ' +
                          (tokenError === true
                            ? 'bg-rose-50 text-rose-500'
                            : tokenReady === true
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600')
                        }
                      >
                        {tokenError === true ? '需要重试' : tokenReady === true ? '已就绪' : '准备中'}
                      </Badge>
                    </div>

                    {tokenLoading === true ? (
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-3 w-4/5 rounded-full bg-slate-100" />
                        <Skeleton className="h-3 w-3/5 rounded-full bg-slate-100" />
                      </div>
                    ) : tokenError === true ? (
                      <div className="mt-2">
                        <p className="text-[11px] leading-5 text-slate-400">
                          安全校验暂未就绪，可重试后再提交。
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={loadSubmitToken}
                          disabled={submitting}
                          className="mt-2 h-8 rounded-lg px-2.5 text-[11px] text-sky-600 transition-all hover:bg-sky-50 active:scale-95"
                        >
                          <RefreshCwIcon className="size-3.5" />
                          重新获取
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] leading-5 text-slate-400">
                        已生成一次性提交凭证，避免重复创建同一条作品。
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：作品资料表单 */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card
              id="create-form"
              className="scroll-mt-24 gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-medium tracking-[0.2em] text-slate-400">ANIME DETAILS</p>
                    <CardTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900">作品资料</CardTitle>
                    <CardDescription className="mt-1 text-sm text-slate-400">
                      带 <span className="text-rose-500">*</span> 的字段为必填项
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      'rounded-full px-2.5 text-[10px] ' +
                      (nameReady === true ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')
                    }
                  >
                    {nameReady === true ? '可以发布' : '等待填写'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="anime-name">
                      动漫名称
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="anime-name"
                      placeholder="例如：夏目友人帐"
                      value={form.animeName}
                      onChange={handleNameChange}
                      disabled={submitting}
                      className="h-12 rounded-xl border-slate-200 bg-white text-base text-slate-800 transition-all placeholder:text-slate-300 focus-visible:border-sky-300"
                    />
                    <p className="text-[10px] text-slate-400">用于片单展示和搜索，创建后仍可修改。</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="anime-introduction">简介</Label>
                      <span className="text-[10px] text-slate-400">{form.animeIntroduction.length} 字</span>
                    </div>
                    <Textarea
                      id="anime-introduction"
                      rows={5}
                      placeholder="用一两句话介绍这部作品..."
                      value={form.animeIntroduction}
                      onChange={handleIntroductionChange}
                      disabled={submitting}
                      className="min-h-32 rounded-xl border-slate-200 bg-white text-sm leading-7 text-slate-800 transition-all placeholder:text-slate-300 focus-visible:border-sky-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="anime-comment">观后感</Label>
                      <span className="text-[10px] text-slate-400">{form.animeComment.length} 字</span>
                    </div>
                    <Textarea
                      id="anime-comment"
                      rows={5}
                      placeholder="写下你与这部作品的故事..."
                      value={form.animeComment}
                      onChange={handleCommentChange}
                      disabled={submitting}
                      className="min-h-32 rounded-xl border-slate-200 bg-white text-sm leading-7 text-slate-800 transition-all placeholder:text-slate-300 focus-visible:border-sky-300"
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-400">
                    <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                    创建成功后会返回片单，并自动刷新到第一页；封面可以稍后补充。
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] text-slate-400">提交即代表将这些内容保存到你的账号下</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="h-11 flex-1 rounded-xl border-slate-200 px-4 transition-all active:scale-95 sm:flex-none"
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-11 flex-1 rounded-xl bg-slate-900 px-5 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 sm:flex-none"
                      >
                        {submitting === true ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <PlusIcon className="size-4" />
                        )}
                        {submitting === true ? '创建中...' : '创建动漫'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 填写建议 */}
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-sky-500" />
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">WRITING GUIDE</p>
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">让作品更容易被记住</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-700">封面</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">优先使用 3:4 竖版海报，画面主体居中。</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-700">简介</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">一两句话讲清类型和看点，不要太长。</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-700">观后感</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">写下真实感受，之后回看会很有趣。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · 新建作品</span>
          <span>{nameReady === true ? '资料已就绪' : '等待填写作品名称'}</span>
        </footer>
      </div>
    </div>
  );
}
