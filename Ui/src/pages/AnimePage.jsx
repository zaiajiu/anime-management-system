import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  FilmIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  fetchAnimeList,
  fetchAnimeByName,
  deleteAnimeBatch,
  fetchAnimeCount,
  fetchAnimeCountByName,
} from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var PAGE_SIZE = 9;
var SKELETON_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 内联 SVG 兜底图，避免封面缺失时卡片塌陷
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

function getSortLabel(field) {
  if (field === 'id') return '默认 (ID)';
  if (field === 'name') return '按名称';
  if (field === 'createTime') return '按创建时间';
  if (field === 'updateTime') return '按修改时间';
  return '默认 (ID)';
}

// 用 id 做稳定映射，既有随机感，又不会在重渲染时闪烁
function getStatusMeta(item) {
  var id = item.id;
  var seed = 0;
  if (typeof id === 'number') {
    seed = id;
  } else {
    seed = String(id || item.animeName || '').length;
  }
  var index = Math.abs(seed) % 3;
  if (index === 0) {
    return { label: '连载中', className: 'bg-emerald-500/95 text-white' };
  }
  if (index === 1) {
    return { label: '已完结', className: 'bg-slate-950/80 text-white' };
  }
  return { label: '热门', className: 'bg-rose-500/95 text-white' };
}

export default function AnimePage() {
  var navigate = useNavigate();
  var location = useLocation();

  // URL 参数：刷新、返回时恢复搜索与分页状态
  var searchParamsState = useSearchParams();
  var searchParams = searchParamsState[0];
  var setSearchParams = searchParamsState[1];

  var initKeyword = searchParams.get('keyword') || '';
  var initPage = parseInt(searchParams.get('page'), 10) || 1;
  var initField = searchParams.get('sortField') || 'id';
  var initOrder = searchParams.get('sortOrder') || 'DESC';

  // ============================================================
  // 状态管理
  // ============================================================
  var listState = useState([]);
  var list = listState[0];
  var setList = listState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var keywordState = useState(initKeyword);
  var keyword = keywordState[0];
  var setKeyword = keywordState[1];

  var pageState = useState(initPage);
  var page = pageState[0];
  var setPage = pageState[1];

  var totalState = useState(0);
  var total = totalState[0];
  var setTotal = totalState[1];

  var jumpPageState = useState(initPage.toString());
  var jumpPage = jumpPageState[0];
  var setJumpPage = jumpPageState[1];

  var sortFieldState = useState(initField);
  var sortField = sortFieldState[0];
  var setSortField = sortFieldState[1];

  var sortOrderState = useState(initOrder);
  var sortOrder = sortOrderState[0];
  var setSortOrder = sortOrderState[1];

  var editModeState = useState(false);
  var editMode = editModeState[0];
  var setEditMode = editModeState[1];

  var selectedIdsState = useState([]);
  var selectedIds = selectedIdsState[0];
  var setSelectedIds = selectedIdsState[1];

  var confirmOpenState = useState(false);
  var confirmOpen = confirmOpenState[0];
  var setConfirmOpen = confirmOpenState[1];

  var searchTimerRef = useRef(null);
  var searchInputRef = useRef(null);
  // 请求序号：忽略旧请求的迟到响应，避免搜索时列表闪回
  var requestSeqRef = useRef(0);

  // ============================================================
  // 核心数据请求
  // ============================================================
  function clearSearchTimer() {
    if (searchTimerRef.current !== null) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }

  function fetchData(targetPage, targetKeyword, targetField, targetOrder) {
    clearSearchTimer();

    var requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;

    setLoading(true);
    setPage(targetPage);
    setJumpPage(targetPage.toString());

    // 同步 URL，保证刷新和浏览器返回时状态不丢
    var newParams = { page: targetPage.toString() };
    if (targetKeyword.trim() !== '') newParams.keyword = targetKeyword.trim();
    if (targetField !== 'id') newParams.sortField = targetField;
    if (targetOrder !== 'DESC') newParams.sortOrder = targetOrder;
    setSearchParams(newParams);

    if (targetKeyword.trim() === '') {
      fetchAnimeList(targetPage, targetField, targetOrder)
        .then(function (res) {
          if (requestSeqRef.current !== requestId) return;
          if (res.success === false) {
            toast.error(res.message || '动漫列表加载失败');
            return;
          }
          setList(res.data || []);
        })
        .catch(function (error) {
          if (requestSeqRef.current !== requestId) return;
          logger.error('AnimePage', '获取动漫列表失败', error);
          toast.error('动漫列表加载失败，请稍后重试');
        })
        .finally(function () {
          if (requestSeqRef.current === requestId) setLoading(false);
        });

      fetchAnimeCount()
        .then(function (res) {
          if (requestSeqRef.current !== requestId) return;
          if (res.success) setTotal(res.data || 0);
        })
        .catch(function (error) {
          logger.error('AnimePage', '获取动漫总数失败', error);
        });
    } else {
      var trimmedKeyword = targetKeyword.trim();

      fetchAnimeByName(trimmedKeyword, targetPage, targetField, targetOrder)
        .then(function (res) {
          if (requestSeqRef.current !== requestId) return;
          if (res.success === false) {
            toast.error(res.message || '搜索失败');
            return;
          }
          setList(res.data || []);
        })
        .catch(function (error) {
          if (requestSeqRef.current !== requestId) return;
          logger.error('AnimePage', '搜索动漫失败', error);
          toast.error('搜索失败，请稍后重试');
        })
        .finally(function () {
          if (requestSeqRef.current === requestId) setLoading(false);
        });

      fetchAnimeCountByName(trimmedKeyword)
        .then(function (res) {
          if (requestSeqRef.current !== requestId) return;
          if (res.success) setTotal(res.data || 0);
        })
        .catch(function (error) {
          logger.error('AnimePage', '获取搜索结果总数失败', error);
        });
    }
  }

  // 首次挂载：读取 URL 状态
  useEffect(function () {
    fetchData(initPage, initKeyword, initField, initOrder);
  }, []);

  // 防抖计时器与全局快捷键清理
  useEffect(function () {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    }

    window.addEventListener('keydown', handleShortcut);

    return function () {
      window.removeEventListener('keydown', handleShortcut);
      if (searchTimerRef.current !== null) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // ============================================================
  // 搜索、排序、分页
  // ============================================================
  function handleKeywordChange(event) {
    var value = event.target.value;
    setKeyword(value);

    clearSearchTimer();
    searchTimerRef.current = setTimeout(function () {
      fetchData(1, value, sortField, sortOrder);
    }, 500);
  }

  function handleClearKeyword() {
    clearSearchTimer();
    setKeyword('');
    fetchData(1, '', sortField, sortOrder);
    if (searchInputRef.current) searchInputRef.current.focus();
  }

  var totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function handlePrevPage() {
    if (page > 1) fetchData(page - 1, keyword, sortField, sortOrder);
  }

  function handleNextPage() {
    if (page < totalPages) fetchData(page + 1, keyword, sortField, sortOrder);
  }

  function handleJumpPage() {
    var target = parseInt(jumpPage, 10);
    if (isNaN(target) || target < 1) target = 1;
    if (target > totalPages) target = totalPages;
    fetchData(target, keyword, sortField, sortOrder);
  }

  function handleSortChange(field) {
    setSortField(field);
    fetchData(1, keyword, field, sortOrder);
  }

  function handleOrderChange() {
    var newOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(newOrder);
    fetchData(1, keyword, sortField, newOrder);
  }

  // ============================================================
  // 新建、编辑、删除
  // ============================================================
  // 新建页需要知道返回地址，成功后回到第一页并保留筛选条件
  function handleCreateClick() {
    var currentUrl = location.pathname + location.search;
    var successParams = new URLSearchParams();
    successParams.set('page', '1');
    if (keyword.trim() !== '') successParams.set('keyword', keyword.trim());
    if (sortField !== 'id') successParams.set('sortField', sortField);
    if (sortOrder !== 'DESC') successParams.set('sortOrder', sortOrder);

    navigate('/monitor/create', {
      state: {
        from: currentUrl,
        successTo: '/monitor?' + successParams.toString(),
      },
    });
  }

  function handleImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') return;
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  function enterEditMode() {
    setEditMode(true);
    setSelectedIds([]);
  }

  function exitEditMode() {
    setEditMode(false);
    setSelectedIds([]);
  }

  function toggleSelect(id) {
    var index = selectedIds.indexOf(id);
    if (index === -1) {
      setSelectedIds(selectedIds.concat(id));
    } else {
      var copy = selectedIds.slice();
      copy.splice(index, 1);
      setSelectedIds(copy);
    }
  }

  function toggleSelectAll() {
    if (list.length === 0) return;
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
      return;
    }

    var allIds = list.map(function (item) {
      return item.id;
    });
    setSelectedIds(allIds);
  }

  function handleClickDelete() {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的动漫');
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    setConfirmOpen(false);
    setEditMode(false);

    var idsToDelete = selectedIds;
    setSelectedIds([]);

    deleteAnimeBatch(idsToDelete)
      .then(function (res) {
        if (res.success === false) toast.error(res.message);
        if (res.success === true) toast.success('删除动漫成功');

        // 当前页被删光时自动回退一页
        var targetPage = (idsToDelete.length === list.length && page > 1) ? page - 1 : page;
        fetchData(targetPage, keyword, sortField, sortOrder);
      })
      .catch(function (error) {
        toast.error('删除失败：' + error.message);
      });
  }

  function handleCardClick(item) {
    if (editMode === true) {
      toggleSelect(item.id);
    } else {
      navigate('/monitor/' + item.id);
    }
  }

  function handleCardKeyDown(event, item) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(item);
    }
  }

  function handleAddCardKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCreateClick();
    }
  }

  function handleJumpKeyDown(event) {
    if (event.key === 'Enter') handleJumpPage();
  }

  var allCurrentSelected = list.length > 0 && list.every(function (item) {
    return selectedIds.indexOf(item.id) !== -1;
  });
  var hasKeyword = keyword.trim() !== '';

  // ============================================================
  // 渲染
  // ============================================================
  return (
    <div className="-m-4 min-h-[calc(100vh-2rem)] bg-slate-50 p-4 pb-32 text-left sm:p-6 sm:pb-32 lg:p-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">

        {/* 顶部视觉区：流媒体式片头 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <SparklesIcon className="size-3.5 text-sky-300" />
                ANIME COLLECTION
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-5xl">
                把热爱的故事，
                <span className="bg-gradient-to-r from-sky-300 via-white to-amber-200 bg-clip-text text-transparent">
                  都收进这里
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                搜索、收藏、随时重温。你的专属动漫片单，正在持续更新。
              </p>
            </div>

            <div className="flex items-stretch gap-2 sm:gap-3">
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-md">
                <p className="text-[11px] tracking-wider text-white/45">馆藏作品</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {loading === true ? '···' : total}
                  <span className="ml-1 text-xs font-normal text-white/40">部</span>
                </p>
              </div>
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-md">
                <p className="text-[11px] tracking-wider text-white/45">当前页码</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {page}
                  <span className="ml-1 text-xs font-normal text-white/40">/ {totalPages}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 毛玻璃吸顶工具栏 */}
        <div className="sticky top-3 z-40 rounded-2xl border border-white/80 bg-white/80 p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md sm:p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <InputGroup className="h-11 w-full min-w-0 rounded-xl border-slate-200/80 bg-white/80 px-1 shadow-sm transition-all duration-300 focus-within:border-sky-300 focus-within:bg-white focus-within:shadow-md xl:max-w-md">
              <InputGroupAddon className="pl-3">
                <SearchIcon className="size-4 text-slate-400" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                className="h-11 text-[15px] text-slate-800 placeholder:text-slate-400"
                placeholder="搜索动漫名称..."
                value={keyword}
                onChange={handleKeywordChange}
                aria-label="搜索动漫名称"
              />
              <InputGroupAddon align="inline-end" className="gap-1 pr-2">
                {hasKeyword === true && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleClearKeyword}
                    className="rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                    aria-label="清空搜索"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                )}
                <Kbd className="hidden border border-slate-200/80 bg-white/80 sm:inline-flex">⌘K</Kbd>
              </InputGroupAddon>
            </InputGroup>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={sortField} onValueChange={handleSortChange}>
                <SelectTrigger className="h-11 w-[150px] rounded-xl border-slate-200/80 bg-white/80 px-3 text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-white active:scale-95">
                  <ArrowUpDown className="size-4 text-slate-400" />
                  <SelectValue placeholder="排序方式">
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

              <Button
                variant="outline"
                onClick={handleOrderChange}
                className="h-11 rounded-xl border-slate-200/80 bg-white/80 px-3.5 text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-95"
              >
                <ArrowUpDown className="size-4" />
                {sortOrder === 'DESC' ? '倒序' : '顺序'}
              </Button>

              <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

              <Button
                onClick={editMode === false ? enterEditMode : exitEditMode}
                className={
                  'ml-auto h-11 rounded-xl px-4 shadow-sm transition-all active:scale-95 sm:ml-0 ' +
                  (editMode === true
                    ? 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    : 'bg-slate-900 text-white hover:bg-slate-800')
                }
              >
                {editMode === false ? <EditIcon className="size-4" /> : <CheckIcon className="size-4" />}
                {editMode === false ? '编辑' : '完成'}
              </Button>
            </div>
          </div>
        </div>

        {/* 列表标题 */}
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                {hasKeyword === true ? '“' + keyword.trim() + '” 的搜索结果' : '动漫片单'}
              </h2>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {loading === true ? '···' : total}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              {editMode === true
                ? '点击卡片选择要删除的动漫，支持全选当前页'
                : '为你精选的动漫收藏，点击卡片查看详情'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={'size-1.5 rounded-full ' + (loading === true ? 'animate-pulse bg-amber-400' : 'bg-emerald-500')} />
            {loading === true ? '正在同步片单' : '片单已更新'}
          </div>
        </div>

        {/* 卡片列表：骨架屏 / 空状态 / 正式数据 */}
        {loading === true ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5" aria-busy="true">
            {SKELETON_ITEMS.map(function (key) {
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
                >
                  <Skeleton className="aspect-[3/4] w-full rounded-none bg-slate-200/80" />
                  <div className="space-y-2.5 p-3">
                    <Skeleton className="h-3.5 w-3/4 rounded-full bg-slate-200/80" />
                    <Skeleton className="h-3 w-1/2 rounded-full bg-slate-100" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : list.length === 0 ? (
          <Empty className="rounded-[2rem] border border-dashed border-slate-200 bg-white/70 py-16 shadow-sm backdrop-blur-sm sm:py-24">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="mb-4 size-16 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"
              >
                {hasKeyword === true ? <SearchXIcon className="size-7" /> : <FilmIcon className="size-7" />}
              </EmptyMedia>
              <EmptyTitle className="text-xl font-semibold tracking-tight text-slate-900">
                {hasKeyword === true ? '没有找到相关动漫' : '还没有添加动漫'}
              </EmptyTitle>
              <EmptyDescription className="max-w-sm text-sm leading-6 text-slate-400">
                {hasKeyword === true
                  ? '换个关键词试试，或者清空搜索看看完整片单。'
                  : '创建你的第一部动漫收藏，开启专属片单。'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasKeyword === true ? (
                <Button
                  onClick={handleClearKeyword}
                  className="h-10 rounded-xl bg-slate-900 px-5 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                >
                  <XIcon className="size-4" />
                  清空搜索
                </Button>
              ) : (
                <Button
                  onClick={handleCreateClick}
                  className="h-10 rounded-xl bg-slate-900 px-5 text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                >
                  <PlusIcon className="size-4" />
                  添加第一部动漫
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 xl:grid-cols-5">
            {/* 新建卡片：强烈的点击暗示 */}
            {editMode === false && (
              <Card
                onClick={handleCreateClick}
                onKeyDown={handleAddCardKeyDown}
                role="button"
                tabIndex={0}
                aria-label="添加动漫"
                className="group aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-0 shadow-sm ring-0 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:border-sky-400 hover:bg-sky-50/70 hover:shadow-lg active:scale-95"
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-500/25 sm:size-20">
                    <PlusIcon className="size-8 sm:size-9" strokeWidth={1.8} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-sky-600 sm:text-base">
                      添加动漫
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">创建新的收藏</p>
                  </div>
                </div>
              </Card>
            )}

            {list.map(function (item, index) {
              var isSelected = selectedIds.indexOf(item.id) !== -1;
              var statusMeta = getStatusMeta(item);
              return (
                <Card
                  key={item.id}
                  onClick={function () { handleCardClick(item); }}
                  onKeyDown={function (event) { handleCardKeyDown(event, item); }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={editMode === true ? isSelected : undefined}
                  className={
                    'group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm ring-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-lg active:scale-95 ' +
                    (isSelected === true
                      ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-50'
                      : 'ring-slate-900/5 hover:ring-slate-900/10')
                  }
                  style={{
                    animationDelay: (index * 35) + 'ms',
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

                    {/* 底部渐变遮罩，保证白色标题清晰 */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent opacity-95" />

                    {/* 悬浮播放提示 */}
                    {editMode === false && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-md">
                          <FilmIcon className="size-5" />
                        </span>
                      </div>
                    )}

                    {/* 图片左上角浮动标签 */}
                    <Badge
                      variant="secondary"
                      className={
                        'absolute left-3 top-3 z-20 h-6 rounded-full border-0 px-2.5 text-[11px] font-semibold tracking-wide shadow-sm backdrop-blur-md ' +
                        statusMeta.className
                      }
                    >
                      {statusMeta.label}
                    </Badge>

                    {/* 图片内白色标题 */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
                      <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-white drop-shadow sm:text-base">
                        {item.animeName || '未命名动漫'}
                      </CardTitle>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/65">
                        <span className="inline-block size-1 rounded-full bg-white/60" />
                        {editMode === true ? '点击选择' : '查看详情'}
                      </div>
                    </div>

                    {/* 编辑模式选中遮罩与勾选圆点 */}
                    {editMode === true && (
                      <div
                        className={
                          'absolute inset-0 z-10 transition-colors duration-300 ' +
                          (isSelected === true ? 'bg-slate-950/45' : 'bg-transparent group-hover:bg-slate-950/20')
                        }
                      />
                    )}
                    {editMode === true && (
                      <div
                        className={
                          'absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300 ' +
                          (isSelected === true
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-white/80 bg-slate-950/20 text-transparent backdrop-blur-sm')
                        }
                      >
                        {isSelected === true && <CheckIcon className="size-4" strokeWidth={3} />}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 纤细的居中分页 */}
        {loading === false && list.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-3">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-white/80 bg-white/80 px-2 py-1.5 shadow-sm backdrop-blur-md">
              <Button
                variant="ghost"
                onClick={handlePrevPage}
                disabled={page <= 1}
                className="h-9 rounded-full px-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              >
                <ChevronLeftIcon className="size-4" />
                <span className="hidden sm:inline">上一页</span>
              </Button>

              <div className="flex min-w-14 items-center justify-center gap-1 px-2 text-sm">
                <span className="font-semibold text-slate-900">{page}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400">{totalPages}</span>
              </div>

              <Button
                variant="ghost"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="h-9 rounded-full px-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              >
                <span className="hidden sm:inline">下一页</span>
                <ChevronRightIcon className="size-4" />
              </Button>

              <div className="mx-1 h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-1.5 pr-2 text-xs text-slate-400">
                <span>跳至</span>
                <Input
                  value={jumpPage}
                  onChange={function (event) { setJumpPage(event.target.value); }}
                  onBlur={handleJumpPage}
                  onKeyDown={handleJumpKeyDown}
                  onFocus={function (event) { event.target.select(); }}
                  inputMode="numeric"
                  aria-label="跳转页码"
                  className="h-8 w-12 rounded-lg border-slate-200 bg-white px-1 text-center text-xs font-medium text-slate-700 shadow-none transition-all focus-visible:border-sky-300"
                />
                <span>页</span>
              </div>
            </div>

            <p className="text-[11px] tracking-wide text-slate-400">
              共 {totalPages} 页 · {total} 部作品
            </p>
          </div>
        )}
      </div>

      {/* 底部悬浮批量删除栏 */}
      {editMode === true && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-white/70 bg-white/85 p-2.5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 sm:bottom-6 sm:gap-2 sm:p-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-1">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              {selectedIds.length}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-800">已选择 {selectedIds.length} 部</p>
              <p className="hidden truncate text-[11px] text-slate-400 sm:block">批量操作不会影响其他作品</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={toggleSelectAll}
            className="h-9 rounded-xl px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          >
            {allCurrentSelected === true ? '取消全选' : '全选本页'}
          </Button>

          <Button
            variant="ghost"
            onClick={exitEditMode}
            className="hidden h-9 rounded-xl px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 sm:inline-flex"
          >
            取消
          </Button>

          <Button
            variant="destructive"
            onClick={handleClickDelete}
            disabled={selectedIds.length === 0}
            className="h-9 rounded-xl bg-rose-600 px-3.5 text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95 disabled:bg-rose-200"
          >
            <TrashIcon className="size-4" />
            删除
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <TrashIcon className="size-5" />
            </div>
            <DialogTitle className="text-lg">确认删除</DialogTitle>
            <DialogDescription className="leading-6">
              确定要删除选中的 {selectedIds.length} 部动漫吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={function () { setConfirmOpen(false); }}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="h-10 rounded-xl bg-rose-600 text-white transition-all hover:bg-rose-700 active:scale-95"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
