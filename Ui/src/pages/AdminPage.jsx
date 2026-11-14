import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  FilmIcon,
  HomeIcon,
  KeyRoundIcon,
  LayoutGridIcon,
  Loader2Icon,
  RotateCcwIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  adminBatchDeleteApi,
  banUserApi,
  fetchAllAnime,
  fetchAllUser,
  fetchCountAnime,
  fetchCountUser,
  unbanUserApi,
  updatePasswordApi,
} from '@/api/admin';
import { clearAuth, getRole, getUserId, getUsername } from '@/utils/auth';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var PAGE_SIZE = 8;
var SKELETON_ROWS = [0, 1, 2, 3, 4];

var ANIME_SORTS = [
  { value: 'id', label: '默认 ID' },
  { value: 'name', label: '按名称' },
  { value: 'createTime', label: '按创建时间' },
  { value: 'updateTime', label: '按更新时间' },
];

var USER_SORTS = [
  { value: 'id', label: '默认 ID' },
  { value: 'name', label: '按用户名' },
  { value: 'createTime', label: '按注册时间' },
  { value: 'updateTime', label: '按更新时间' },
];

// ============================================================
// 工具函数
// ============================================================
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

function getAvatarUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

function getInitial(name) {
  if (!name) return 'U';
  return String(name).slice(0, 1).toUpperCase();
}

function formatTime(value) {
  if (!value) return '—';
  var text = String(value);
  var normalized = text.replace(' ', 'T');
  var time = new Date(normalized).getTime();
  if (isNaN(time) === false) {
    var date = new Date(time);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    return (
      date.getFullYear() +
      '-' +
      (month < 10 ? '0' + month : month) +
      '-' +
      (day < 10 ? '0' + day : day) +
      ' ' +
      (hour < 10 ? '0' + hour : hour) +
      ':' +
      (minute < 10 ? '0' + minute : minute)
    );
  }
  if (text.length >= 16) return text.slice(0, 16).replace('T', ' ');
  return text;
}

function getSortLabel(options, value) {
  var matched = options.find(function (item) {
    return item.value === value;
  });
  if (matched) return matched.label;
  return options[0].label;
}

// 后端部分接口成功时也会带 success:false + message:"success"，这里统一兼容
function isOk(res) {
  if (!res) return false;
  if (res.success === true) return true;
  if (res.success === false && res.message === 'success') return true;
  return false;
}

function getErrorMessage(res, fallback) {
  if (!res || !res.message) return fallback;
  var message = res.message;
  if (message === 'ok' || message === 'success' || message === 'error' || message === 'fail') {
    return fallback;
  }
  return message;
}

function getStatusMeta(status) {
  if (status === 0) {
    return { label: '已封禁', banned: true, className: 'bg-rose-50 text-rose-600', dotClass: 'bg-rose-500' };
  }
  if (status === 1) {
    return { label: '正常', banned: false, className: 'bg-emerald-50 text-emerald-600', dotClass: 'bg-emerald-500' };
  }
  return { label: '状态未知', banned: false, className: 'bg-slate-100 text-slate-500', dotClass: 'bg-slate-400' };
}

function getRoleMeta(role) {
  if (role === 'ADMIN') {
    return { label: '管理员', className: 'bg-amber-50 text-amber-600', dotClass: 'bg-amber-500' };
  }
  return { label: '普通用户', className: 'bg-slate-100 text-slate-500', dotClass: 'bg-slate-400' };
}

// ============================================================
// 通用小组件
// ============================================================
function AdminEmpty(props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {props.icon}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-800">{props.title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-6 text-slate-400">{props.description}</p>
      {props.action}
    </div>
  );
}

function AdminError(props) {
  return (
    <div className="m-4 flex flex-col items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 sm:flex-row sm:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm">
        <CircleAlertIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-rose-700">{props.title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-rose-500/90">{props.description}</p>
      </div>
      <Button
        onClick={props.onRetry}
        className="h-9 shrink-0 rounded-xl bg-rose-600 px-3.5 text-xs text-white transition-all hover:bg-rose-700 active:scale-95"
      >
        <RotateCcwIcon className="size-3.5" />
        重新加载
      </Button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {SKELETON_ROWS.map(function (key) {
        return (
          <div key={key} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-4 rounded bg-slate-200/80" />
            <Skeleton className="h-14 w-10 rounded-lg bg-slate-200/80" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 rounded-full bg-slate-200/80" />
              <Skeleton className="h-3 w-24 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="hidden h-8 w-16 rounded-lg bg-slate-100 sm:block" />
          </div>
        );
      })}
    </div>
  );
}

function AdminPagination(props) {
  var jumpState = useState(String(props.page));
  var jumpValue = jumpState[0];
  var setJumpValue = jumpState[1];

  function handleSubmit() {
    var target = parseInt(jumpValue, 10);
    if (isNaN(target) === true) target = props.page;
    if (target < 1) target = 1;
    if (target > props.totalPages) target = props.totalPages;
    setJumpValue(String(target));
    props.onJump(target);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row">
      <p className="text-[11px] tracking-wide text-slate-400">
        共 {props.total}
        {props.unit} · 第 {props.page} / {props.totalPages} 页
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-white/80 bg-white/80 px-2 py-1 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          onClick={props.onPrev}
          disabled={props.page <= 1}
          className="h-9 rounded-full px-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:inline">上一页</span>
        </Button>

        <div className="flex min-w-14 items-center justify-center gap-1 px-2 text-sm">
          <span className="font-semibold text-slate-900">{props.page}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">{props.totalPages}</span>
        </div>

        <Button
          variant="ghost"
          onClick={props.onNext}
          disabled={props.page >= props.totalPages}
          className="h-9 rounded-full px-3 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <span className="hidden sm:inline">下一页</span>
          <ChevronRightIcon className="size-4" />
        </Button>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5 pr-2 text-xs text-slate-400">
          <span>跳至</span>
          <Input
            value={jumpValue}
            onChange={function (event) { setJumpValue(event.target.value); }}
            onBlur={handleSubmit}
            onKeyDown={function (event) {
              if (event.key === 'Enter') handleSubmit();
            }}
            onFocus={function (event) { event.target.select(); }}
            inputMode="numeric"
            aria-label="跳转页码"
            className="h-8 w-12 rounded-lg border-slate-200 bg-white px-1 text-center text-xs font-medium text-slate-700 shadow-none transition-all focus-visible:border-sky-300"
          />
          <span>页</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 管理员控制台
// ============================================================
export default function AdminPage() {
  var navigate = useNavigate();
  var isAdmin = getRole() === 'ADMIN';
  var currentUserId = getUserId();
  var currentUsername = getUsername();

  // 统计
  var countAnimeState = useState(null);
  var countAnime = countAnimeState[0];
  var setCountAnime = countAnimeState[1];

  var countUserState = useState(null);
  var countUser = countUserState[0];
  var setCountUser = countUserState[1];

  var countLoadingState = useState(true);
  var countLoading = countLoadingState[0];
  var setCountLoading = countLoadingState[1];

  // 选项卡
  var activeTabState = useState('anime');
  var activeTab = activeTabState[0];
  var setActiveTab = activeTabState[1];

  // 动漫列表
  var animeListState = useState([]);
  var animeList = animeListState[0];
  var setAnimeList = animeListState[1];

  var animePageState = useState(1);
  var animePage = animePageState[0];
  var setAnimePage = animePageState[1];

  var animeSortFieldState = useState('updateTime');
  var animeSortField = animeSortFieldState[0];
  var setAnimeSortField = animeSortFieldState[1];

  var animeSortOrderState = useState('DESC');
  var animeSortOrder = animeSortOrderState[0];
  var setAnimeSortOrder = animeSortOrderState[1];

  var animeLoadingState = useState(true);
  var animeLoading = animeLoadingState[0];
  var setAnimeLoading = animeLoadingState[1];

  var animeErrorState = useState(false);
  var animeError = animeErrorState[0];
  var setAnimeError = animeErrorState[1];

  var selectedIdsState = useState([]);
  var selectedIds = selectedIdsState[0];
  var setSelectedIds = selectedIdsState[1];

  // 用户列表
  var userListState = useState([]);
  var userList = userListState[0];
  var setUserList = userListState[1];

  var userPageState = useState(1);
  var userPage = userPageState[0];
  var setUserPage = userPageState[1];

  var userSortFieldState = useState('id');
  var userSortField = userSortFieldState[0];
  var setUserSortField = userSortFieldState[1];

  var userSortOrderState = useState('DESC');
  var userSortOrder = userSortOrderState[0];
  var setUserSortOrder = userSortOrderState[1];

  var userLoadingState = useState(true);
  var userLoading = userLoadingState[0];
  var setUserLoading = userLoadingState[1];

  var userErrorState = useState(false);
  var userError = userErrorState[0];
  var setUserError = userErrorState[1];

  // 弹窗
  var deleteTargetState = useState(null);
  var deleteTarget = deleteTargetState[0];
  var setDeleteTarget = deleteTargetState[1];

  var deletingState = useState(false);
  var deleting = deletingState[0];
  var setDeleting = deletingState[1];

  var banTargetState = useState(null);
  var banTarget = banTargetState[0];
  var setBanTarget = banTargetState[1];

  var banBusyState = useState(false);
  var banBusy = banBusyState[0];
  var setBanBusy = banBusyState[1];

  var pwdTargetState = useState(null);
  var pwdTarget = pwdTargetState[0];
  var setPwdTarget = pwdTargetState[1];

  var newPwdState = useState('');
  var newPwd = newPwdState[0];
  var setNewPwd = newPwdState[1];

  var confirmPwdState = useState('');
  var confirmPwd = confirmPwdState[0];
  var setConfirmPwd = confirmPwdState[1];

  var showPwdState = useState(false);
  var showPwd = showPwdState[0];
  var setShowPwd = showPwdState[1];

  var pwdSavingState = useState(false);
  var pwdSaving = pwdSavingState[0];
  var setPwdSaving = pwdSavingState[1];

  var refreshTickState = useState(0);
  var refreshTick = refreshTickState[0];
  var setRefreshTick = refreshTickState[1];

  var animeRequestRef = useRef(0);
  var userRequestRef = useRef(0);

  // ============================================================
  // 数据加载
  // ============================================================
  useEffect(function () {
    loadCounts();
  }, [refreshTick]);

  useEffect(function () {
    loadAnimeList();
  }, [animePage, animeSortField, animeSortOrder, refreshTick]);

  useEffect(function () {
    loadUserList();
  }, [userPage, userSortField, userSortOrder, refreshTick]);

  function handleAuthExpired(res) {
    if (res && res.success === false && res.message === '未登录') {
      clearAuth();
      toast.error('登录已过期，请重新登录');
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  }

  function loadCounts() {
    setCountLoading(true);

    var animeCountPromise = fetchCountAnime()
      .then(function (res) {
        if (res && res.success === true) {
          setCountAnime(res.data || 0);
          return;
        }
        handleAuthExpired(res);
      })
      .catch(function (error) {
        logger.error('AdminPage', '获取动漫总数失败', error);
      });

    var userCountPromise = fetchCountUser()
      .then(function (res) {
        if (res && res.success === true) {
          setCountUser(res.data || 0);
          return;
        }
        handleAuthExpired(res);
      })
      .catch(function (error) {
        logger.error('AdminPage', '获取用户总数失败', error);
      });

    Promise.all([animeCountPromise, userCountPromise]).finally(function () {
      setCountLoading(false);
    });
  }

  function loadAnimeList() {
    var requestId = animeRequestRef.current + 1;
    animeRequestRef.current = requestId;

    setAnimeLoading(true);
    setAnimeError(false);

    fetchAllAnime(animePage, PAGE_SIZE, animeSortField, animeSortOrder)
      .then(function (res) {
        if (animeRequestRef.current !== requestId) return;

        if (res && res.success === true) {
          setAnimeList(res.data || []);
          return;
        }
        if (handleAuthExpired(res) === true) return;
        setAnimeList([]);
        setAnimeError(true);
        logger.warn('AdminPage', '动漫列表返回异常', res);
      })
      .catch(function (error) {
        if (animeRequestRef.current !== requestId) return;
        logger.error('AdminPage', '加载动漫列表失败', error);
        setAnimeList([]);
        setAnimeError(true);
        toast.error('动漫列表加载失败，请稍后重试');
      })
      .finally(function () {
        if (animeRequestRef.current === requestId) setAnimeLoading(false);
      });
  }

  function loadUserList() {
    var requestId = userRequestRef.current + 1;
    userRequestRef.current = requestId;

    setUserLoading(true);
    setUserError(false);

    fetchAllUser(userPage, PAGE_SIZE, userSortField, userSortOrder)
      .then(function (res) {
        if (userRequestRef.current !== requestId) return;

        if (res && res.success === true) {
          setUserList(res.data || []);
          return;
        }
        if (handleAuthExpired(res) === true) return;
        setUserList([]);
        setUserError(true);
        logger.warn('AdminPage', '用户列表返回异常', res);
      })
      .catch(function (error) {
        if (userRequestRef.current !== requestId) return;
        logger.error('AdminPage', '加载用户列表失败', error);
        setUserList([]);
        setUserError(true);
        toast.error('用户列表加载失败，请稍后重试');
      })
      .finally(function () {
        if (userRequestRef.current === requestId) setUserLoading(false);
      });
  }

  function reloadAll() {
    setRefreshTick(function (value) { return value + 1; });
  }

  function refreshAnime() {
    loadCounts();
    loadAnimeList();
  }

  function refreshUsers() {
    loadCounts();
    loadUserList();
  }

  // ============================================================
  // 动漫：选择、排序、分页、删除
  // ============================================================
  var animeTotal = countAnime === null ? animeList.length : countAnime;
  var animeTotalPages = Math.ceil(animeTotal / PAGE_SIZE);
  if (animeTotalPages < 1) animeTotalPages = 1;

  var allSelected = animeList.length > 0 && selectedIds.length === animeList.length;

  function isSelected(id) {
    return selectedIds.indexOf(id) !== -1;
  }

  function toggleSelect(id) {
    var index = selectedIds.indexOf(id);
    if (index === -1) {
      setSelectedIds(selectedIds.concat(id));
      return;
    }
    var next = selectedIds.slice();
    next.splice(index, 1);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (animeList.length === 0) return;
    if (allSelected === true) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(
      animeList.map(function (item) {
        return item.id;
      })
    );
  }

  function handleAnimeSortFieldChange(value) {
    setAnimeSortField(value);
    setAnimePage(1);
    setSelectedIds([]);
  }

  function handleAnimeOrderChange() {
    setAnimeSortOrder(animeSortOrder === 'DESC' ? 'ASC' : 'DESC');
    setAnimePage(1);
    setSelectedIds([]);
  }

  function handleAnimePageJump(target) {
    if (target === animePage) return;
    setAnimePage(target);
    setSelectedIds([]);
  }

  function handleAnimePrev() {
    if (animePage > 1) {
      setAnimePage(animePage - 1);
      setSelectedIds([]);
    }
  }

  function handleAnimeNext() {
    if (animePage < animeTotalPages) {
      setAnimePage(animePage + 1);
      setSelectedIds([]);
    }
  }

  function openDeleteSingle(item) {
    setDeleteTarget({ ids: [item.id], names: [item.animeName || '未命名动漫'] });
  }

  function openDeleteSelected() {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的动漫');
      return;
    }
    var names = animeList
      .filter(function (item) {
        return selectedIds.indexOf(item.id) !== -1;
      })
      .map(function (item) {
        return item.animeName || '未命名动漫';
      });

    setDeleteTarget({ ids: selectedIds.slice(), names: names });
  }

  function handleConfirmDelete() {
    if (deleteTarget === null) return;

    var ids = deleteTarget.ids;
    var names = deleteTarget.names;

    setDeleting(true);

    adminBatchDeleteApi(ids)
      .then(function (res) {
        if (isOk(res) === true) {
          toast.success('已删除 ' + ids.length + ' 部动漫');
          setDeleteTarget(null);
          setSelectedIds([]);

          var remaining = animeList.length - names.length;
          if (remaining <= 0 && animePage > 1) {
            setAnimePage(animePage - 1);
            loadCounts();
          } else {
            refreshAnime();
          }
          return;
        }
        if (handleAuthExpired(res) === true) {
          setDeleteTarget(null);
          return;
        }
        toast.error(getErrorMessage(res, '删除失败，请稍后重试'));
        logger.warn('AdminPage', '删除动漫失败', res);
      })
      .catch(function (error) {
        logger.error('AdminPage', '删除动漫异常', error);
        toast.error('删除失败：' + error.message);
      })
      .finally(function () {
        setDeleting(false);
      });
  }

  // ============================================================
  // 用户：排序、分页、封禁、重置密码
  // ============================================================
  var userTotal = countUser === null ? userList.length : countUser;
  var userTotalPages = Math.ceil(userTotal / PAGE_SIZE);
  if (userTotalPages < 1) userTotalPages = 1;

  function handleUserSortFieldChange(value) {
    setUserSortField(value);
    setUserPage(1);
  }

  function handleUserOrderChange() {
    setUserSortOrder(userSortOrder === 'DESC' ? 'ASC' : 'DESC');
    setUserPage(1);
  }

  function handleUserPageJump(target) {
    if (target === userPage) return;
    setUserPage(target);
  }

  function handleUserPrev() {
    if (userPage > 1) setUserPage(userPage - 1);
  }

  function handleUserNext() {
    if (userPage < userTotalPages) setUserPage(userPage + 1);
  }

  function isProtectedUser(item) {
    if (item.role === 'ADMIN') return true;
    if (currentUserId !== null && item.id === currentUserId) return true;
    return false;
  }

  function openBanDialog(item) {
    if (isProtectedUser(item) === true) {
      toast.error('不能封禁管理员或当前登录账号');
      return;
    }
    var meta = getStatusMeta(item.status);
    setBanTarget({ user: item, banned: meta.banned });
  }

  function handleConfirmBan() {
    if (banTarget === null) return;

    var targetUser = banTarget.user;
    var wasBanned = banTarget.banned;
    var request = wasBanned ? unbanUserApi(targetUser.id) : banUserApi(targetUser.id);

    setBanBusy(true);

    request
      .then(function (res) {
        if (isOk(res) === true) {
          toast.success(wasBanned ? '已解除封禁' : '已封禁该用户');
          setBanTarget(null);

          // 后端列表未必返回 status 字段，这里先本地同步，保证操作反馈立即可见
          setUserList(function (current) {
            return current.map(function (item) {
              if (item.id !== targetUser.id) return item;
              var next = Object.assign({}, item);
              next.status = wasBanned ? 1 : 0;
              return next;
            });
          });
          loadCounts();
          return;
        }
        if (handleAuthExpired(res) === true) {
          setBanTarget(null);
          return;
        }
        toast.error(getErrorMessage(res, '操作失败，请稍后重试'));
        logger.warn('AdminPage', '封禁/解封失败', res);
      })
      .catch(function (error) {
        logger.error('AdminPage', '封禁/解封异常', error);
        toast.error('操作失败：' + error.message);
      })
      .finally(function () {
        setBanBusy(false);
      });
  }

  function openPwdDialog(item) {
    setPwdTarget(item);
    setNewPwd('');
    setConfirmPwd('');
    setShowPwd(false);
  }

  function closePwdDialog() {
    if (pwdSaving === true) return;
    setPwdTarget(null);
    setNewPwd('');
    setConfirmPwd('');
    setShowPwd(false);
  }

  function handleResetPassword() {
    if (pwdTarget === null) return;

    if (newPwd.length < 6) {
      toast.error('新密码至少 6 位');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    setPwdSaving(true);

    updatePasswordApi(pwdTarget.username, newPwd)
      .then(function (res) {
        if (isOk(res) === true) {
          toast.success('已重置「' + pwdTarget.username + '」的密码');
          setPwdTarget(null);
          setNewPwd('');
          setConfirmPwd('');
          setShowPwd(false);
          return;
        }
        if (handleAuthExpired(res) === true) return;
        toast.error(getErrorMessage(res, '密码重置失败'));
        logger.warn('AdminPage', '重置密码失败', res);
      })
      .catch(function (error) {
        logger.error('AdminPage', '重置密码异常', error);
        toast.error('密码重置失败：' + error.message);
      })
      .finally(function () {
        setPwdSaving(false);
      });
  }

  // ============================================================
  // 派生数据
  // ============================================================
  var animeOrderLabel = animeSortOrder === 'DESC' ? '倒序' : '顺序';
  var userOrderLabel = userSortOrder === 'DESC' ? '倒序' : '顺序';
  var animeCountLabel = countLoading === true ? '···' : countAnime === null ? '—' : countAnime;
  var userCountLabel = countLoading === true ? '···' : countUser === null ? '—' : countUser;

  var pwdTooShort = newPwd.length > 0 && newPwd.length < 6;
  var pwdMismatch = confirmPwd !== '' && confirmPwd !== newPwd;
  var pwdCanSubmit = newPwd.length >= 6 && newPwd === confirmPwd && pwdSaving === false;
  var pwdInputType = showPwd === true ? 'text' : 'password';

  var deleteTitle = '确认删除动漫？';
  var deleteDescription = '删除后封面文件会一并移除，且不可撤销。';
  if (deleteTarget !== null && deleteTarget.ids.length > 1) {
    deleteTitle = '确认批量删除？';
    deleteDescription = '将删除选中的 ' + deleteTarget.ids.length + ' 部动漫，封面文件会一并移除，且不可撤销。';
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
                <ShieldIcon className="size-3.5" />
              </div>
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">管理员控制台</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="hidden rounded-full bg-amber-50 px-2.5 text-[10px] font-medium text-amber-600 sm:inline-flex">
              ADMIN
            </Badge>
            <Button
              variant="ghost"
              onClick={reloadAll}
              aria-label="刷新全部数据"
              className="h-9 rounded-xl px-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              <RotateCcwIcon className="size-4" />
              <span className="hidden sm:inline">刷新</span>
            </Button>
          </div>
        </div>

        {/* 头图 */}
        <header className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/4 size-80 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <ShieldIcon
            className="pointer-events-none absolute -right-8 -top-10 size-64 rotate-12 text-white/[0.035]"
            strokeWidth={0.8}
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] text-white/55">
                <SparklesIcon className="size-3.5 text-amber-300" />
                ADMIN CONSOLE
              </div>
              <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-amber-200 via-white to-sky-200 bg-clip-text text-transparent">
                  全站运营，尽在掌握
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                集中管理全站动漫与用户：批量清理违规内容、封禁异常账号、重置登录密码。
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/70">
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />
                  会话有效
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/70">
                  当前账号 {currentUsername || 'admin'}
                </Badge>
                <Badge className="rounded-full border border-white/10 bg-white/10 px-2.5 text-[10px] font-medium text-white/70">
                  数据源 /api/admin
                </Badge>
              </div>
            </div>

            <div className="flex items-stretch gap-2 sm:gap-3">
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-md">
                <p className="text-[11px] tracking-wider text-white/45">全站动漫</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {animeCountLabel}
                  <span className="ml-1 text-xs font-normal text-white/40">部</span>
                </p>
              </div>
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-md">
                <p className="text-[11px] tracking-wider text-white/45">注册用户</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {userCountLabel}
                  <span className="ml-1 text-xs font-normal text-white/40">人</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 概览 */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">全站动漫</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 transition-colors group-hover:bg-sky-100">
                  <FilmIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {animeCountLabel}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">所有用户创建的动漫总数</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">注册用户</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500 transition-colors group-hover:bg-violet-100">
                  <UsersIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {userCountLabel}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">全站账号数量</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">当前页动漫</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition-colors group-hover:bg-amber-100">
                  <LayoutGridIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {animeLoading === true ? '···' : animeList.length}
                <span className="ml-1 text-xs font-normal text-slate-400">/ {PAGE_SIZE}</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-400">每页展示条数</p>
            </CardContent>
          </Card>

          <Card className="group gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">管理权限</p>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-100">
                  <ShieldCheckIcon className="size-4" />
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                {isAdmin === true ? 'ADMIN' : '受限'}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">全站数据读写权限</p>
            </CardContent>
          </Card>
        </section>

        {/* 管理区 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-12 w-full max-w-md rounded-2xl border border-white/80 bg-white/80 p-1 shadow-sm backdrop-blur-md">
            <TabsTrigger
              value="anime"
              className="h-10 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
            >
              <FilmIcon className="size-4" />
              动漫管理
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {animeCountLabel}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="h-10 gap-2 rounded-xl text-xs font-medium text-slate-500 transition-all data-active:bg-slate-900 data-active:text-white active:scale-95 sm:text-sm"
            >
              <UsersIcon className="size-4" />
              用户管理
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {userCountLabel}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== 动漫管理 ==================== */}
          <TabsContent value="anime" className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 工具栏 */}
            <Card className="gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={animeSortField} onValueChange={handleAnimeSortFieldChange}>
                    <SelectTrigger
                      aria-label="动漫排序字段"
                      className="h-10 w-[150px] rounded-xl border-slate-200 bg-white px-3 text-slate-600 transition-all hover:border-slate-300 active:scale-95"
                    >
                      <ArrowUpDown className="size-4 text-slate-400" />
                      <SelectValue placeholder="排序方式">{getSortLabel(ANIME_SORTS, animeSortField)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-xl">
                      {ANIME_SORTS.map(function (option) {
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={handleAnimeOrderChange}
                    className="h-10 rounded-xl border-slate-200 px-3.5 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <ArrowUpDown className="size-4" />
                    {animeOrderLabel}
                  </Button>

                  <div className="hidden h-6 w-px bg-slate-200 sm:block" />

                  <p className="text-[11px] text-slate-400">
                    {selectedIds.length > 0 ? '已选 ' + selectedIds.length + ' 部' : '勾选可批量删除'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <Button
                    onClick={openDeleteSelected}
                    disabled={selectedIds.length === 0}
                    className="h-10 rounded-xl bg-rose-600 px-4 text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95 disabled:bg-rose-200"
                  >
                    <Trash2Icon className="size-4" />
                    批量删除
                  </Button>
                  <Button
                    variant="outline"
                    onClick={refreshAnime}
                    className="h-10 rounded-xl border-slate-200 px-3.5 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <RotateCcwIcon className="size-4" />
                    刷新
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 列表 */}
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0">
              <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">全站动漫</CardTitle>
                  <CardDescription className="mt-1 text-xs text-slate-400">
                    第 {animePage} 页 · {getSortLabel(ANIME_SORTS, animeSortField)} · {animeOrderLabel}
                  </CardDescription>
                </div>
                <Badge className="rounded-full bg-slate-100 px-2.5 text-[10px] font-medium text-slate-500">
                  {animeTotal} 部
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {animeLoading === true ? (
                  <TableSkeleton />
                ) : animeError === true ? (
                  <AdminError
                    title="动漫列表加载失败"
                    description="接口没有返回有效数据，请确认登录状态与后端服务后重试。"
                    onRetry={loadAnimeList}
                  />
                ) : animeList.length === 0 ? (
                  <AdminEmpty
                    icon={<FilmIcon className="size-6" />}
                    title="暂无动漫数据"
                    description={
                      animeTotal > 0
                        ? '统计显示全站共有 ' + animeTotal + ' 部动漫，但当前页接口未返回记录，可尝试刷新或切换页码。'
                        : '全站还没有任何动漫，等用户上传后会出现在这里。'
                    }
                    action={
                      <Button
                        variant="outline"
                        onClick={refreshAnime}
                        className="mt-5 h-9 rounded-xl border-slate-200 px-3.5 text-xs text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                      >
                        <RotateCcwIcon className="size-3.5" />
                        刷新列表
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {/* 桌面表格 */}
                    <div className="hidden md:block">
                      <Table className="min-w-[860px]">
                        <TableHeader>
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="w-12 pl-6">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                aria-label="全选当前页动漫"
                                className="size-4 cursor-pointer accent-slate-900"
                              />
                            </TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">封面</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">动漫名称</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">作者 ID</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">更新时间</TableHead>
                            <TableHead className="pr-6 text-right text-[11px] font-medium text-slate-400">
                              操作
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {animeList.map(function (item) {
                            var selected = isSelected(item.id);

                            return (
                              <TableRow
                                key={item.id}
                                className={
                                  'border-slate-100 transition-colors hover:bg-slate-50/80 ' +
                                  (selected === true ? 'bg-slate-50' : '')
                                }
                              >
                                <TableCell className="pl-6">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={function () { toggleSelect(item.id); }}
                                    aria-label={'选择 ' + (item.animeName || '未命名动漫')}
                                    className="size-4 cursor-pointer accent-slate-900"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="h-14 w-10 overflow-hidden rounded-lg bg-slate-100">
                                    <img
                                      src={getImageUrl(item.imagePath)}
                                      alt={item.animeName || '动漫封面'}
                                      loading="lazy"
                                      onError={function (event) {
                                        event.currentTarget.src = getDefaultImage('无图');
                                      }}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[320px]">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    {item.animeName || '未命名动漫'}
                                  </p>
                                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                    {item.animeIntroduction || '暂无简介'}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                                    #{item.userId === undefined || item.userId === null ? '—' : item.userId}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">{formatTime(item.updateTime)}</TableCell>
                                <TableCell className="pr-6 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      onClick={function () { navigate('/monitor/' + item.id); }}
                                      className="h-8 rounded-lg px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                    >
                                      查看
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={function () { openDeleteSingle(item); }}
                                      aria-label={'删除 ' + (item.animeName || '动漫')}
                                      className="h-8 rounded-lg px-2.5 text-xs text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                    >
                                      <Trash2Icon className="size-3.5" />
                                      删除
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 移动端卡片 */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {animeList.map(function (item) {
                        var selected = isSelected(item.id);

                        return (
                          <div
                            key={item.id}
                            className={
                              'flex items-start gap-3 p-4 transition-colors ' +
                              (selected === true ? 'bg-slate-50' : '')
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={function () { toggleSelect(item.id); }}
                              aria-label={'选择 ' + (item.animeName || '未命名动漫')}
                              className="mt-1 size-4 shrink-0 cursor-pointer accent-slate-900"
                            />
                            <div className="h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={getImageUrl(item.imagePath)}
                                alt={item.animeName || '动漫封面'}
                                loading="lazy"
                                onError={function (event) {
                                  event.currentTarget.src = getDefaultImage('无图');
                                }}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {item.animeName || '未命名动漫'}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                作者 #{item.userId === undefined || item.userId === null ? '—' : item.userId} ·{' '}
                                {formatTime(item.updateTime)}
                              </p>
                              <div className="mt-2 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  onClick={function () { navigate('/monitor/' + item.id); }}
                                  className="h-8 rounded-lg px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                >
                                  查看
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={function () { openDeleteSingle(item); }}
                                  className="h-8 rounded-lg px-2.5 text-xs text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                >
                                  <Trash2Icon className="size-3.5" />
                                  删除
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <AdminPagination
                      key={'anime-page-' + animePage}
                      page={animePage}
                      totalPages={animeTotalPages}
                      total={animeTotal}
                      unit="部"
                      onPrev={handleAnimePrev}
                      onNext={handleAnimeNext}
                      onJump={handleAnimePageJump}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 用户管理 ==================== */}
          <TabsContent value="user" className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 工具栏 */}
            <Card className="gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-sm ring-0">
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={userSortField} onValueChange={handleUserSortFieldChange}>
                    <SelectTrigger
                      aria-label="用户排序字段"
                      className="h-10 w-[160px] rounded-xl border-slate-200 bg-white px-3 text-slate-600 transition-all hover:border-slate-300 active:scale-95"
                    >
                      <ArrowUpDown className="size-4 text-slate-400" />
                      <SelectValue placeholder="排序方式">{getSortLabel(USER_SORTS, userSortField)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-xl">
                      {USER_SORTS.map(function (option) {
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={handleUserOrderChange}
                    className="h-10 rounded-xl border-slate-200 px-3.5 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <ArrowUpDown className="size-4" />
                    {userOrderLabel}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <p className="hidden text-[11px] text-slate-400 sm:block">
                    管理员与当前登录账号不可封禁
                  </p>
                  <Button
                    variant="outline"
                    onClick={refreshUsers}
                    className="h-10 rounded-xl border-slate-200 px-3.5 text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <RotateCcwIcon className="size-4" />
                    刷新
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 列表 */}
            <Card className="gap-0 overflow-hidden rounded-[2rem] border-0 bg-white py-0 shadow-sm ring-0">
              <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">全站用户</CardTitle>
                  <CardDescription className="mt-1 text-xs text-slate-400">
                    第 {userPage} 页 · {getSortLabel(USER_SORTS, userSortField)} · {userOrderLabel}
                  </CardDescription>
                </div>
                <Badge className="rounded-full bg-slate-100 px-2.5 text-[10px] font-medium text-slate-500">
                  {userTotal} 人
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {userLoading === true ? (
                  <TableSkeleton />
                ) : userError === true ? (
                  <AdminError
                    title="用户列表加载失败"
                    description="接口没有返回有效数据，请确认登录状态与后端服务后重试。"
                    onRetry={loadUserList}
                  />
                ) : userList.length === 0 ? (
                  <AdminEmpty
                    icon={<UsersIcon className="size-6" />}
                    title="暂无用户数据"
                    description={
                      userTotal > 0
                        ? '统计显示全站共有 ' + userTotal + ' 位用户，但当前页接口未返回记录，可尝试刷新或切换页码。'
                        : '全站还没有注册用户。'
                    }
                    action={
                      <Button
                        variant="outline"
                        onClick={refreshUsers}
                        className="mt-5 h-9 rounded-xl border-slate-200 px-3.5 text-xs text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                      >
                        <RotateCcwIcon className="size-3.5" />
                        刷新列表
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {/* 桌面表格 */}
                    <div className="hidden md:block">
                      <Table className="min-w-[780px]">
                        <TableHeader>
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="pl-6 text-[11px] font-medium text-slate-400">用户</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">ID</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">角色</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">状态</TableHead>
                            <TableHead className="text-[11px] font-medium text-slate-400">注册时间</TableHead>
                            <TableHead className="pr-6 text-right text-[11px] font-medium text-slate-400">
                              操作
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userList.map(function (item) {
                            var statusMeta = getStatusMeta(item.status);
                            var roleMeta = getRoleMeta(item.role);
                            var protectedUser = isProtectedUser(item);
                            var avatarSrc = getAvatarUrl(item.avatar);
                            var displayName = item.nickname || item.username || '未知用户';

                            return (
                              <TableRow key={item.id} className="border-slate-100 transition-colors hover:bg-slate-50/80">
                                <TableCell className="pl-6">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="size-9 ring-2 ring-white">
                                      {avatarSrc !== '' && <AvatarImage src={avatarSrc} alt={displayName} />}
                                      <AvatarFallback className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-xs font-semibold text-white">
                                        {getInitial(displayName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-slate-800">{item.username}</p>
                                      <p className="mt-0.5 truncate text-[11px] text-slate-400">{displayName}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                                    #{item.id}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + roleMeta.className}>
                                    {roleMeta.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={'inline-flex items-center gap-1.5 text-[11px] font-medium ' + statusMeta.className}>
                                    <span className={'size-1.5 rounded-full ' + statusMeta.dotClass} />
                                    {statusMeta.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">{formatTime(item.createdAt || item.createTime)}</TableCell>
                                <TableCell className="pr-6 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      onClick={function () { openPwdDialog(item); }}
                                      className="h-8 rounded-lg px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                    >
                                      <KeyRoundIcon className="size-3.5" />
                                      重置密码
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={function () { openBanDialog(item); }}
                                      disabled={protectedUser === true}
                                      title={protectedUser === true ? '管理员或当前账号不可封禁' : undefined}
                                      className={
                                        'h-8 rounded-lg px-2.5 text-xs transition-all active:scale-95 disabled:opacity-40 ' +
                                        (statusMeta.banned === true
                                          ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                          : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600')
                                      }
                                    >
                                      {statusMeta.banned === true ? (
                                        <ShieldCheckIcon className="size-3.5" />
                                      ) : (
                                        <ShieldBanIcon className="size-3.5" />
                                      )}
                                      {statusMeta.banned === true ? '解封' : '封禁'}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 移动端卡片 */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {userList.map(function (item) {
                        var statusMeta = getStatusMeta(item.status);
                        var roleMeta = getRoleMeta(item.role);
                        var protectedUser = isProtectedUser(item);
                        var avatarSrc = getAvatarUrl(item.avatar);
                        var displayName = item.nickname || item.username || '未知用户';

                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10 ring-2 ring-white">
                                {avatarSrc !== '' && <AvatarImage src={avatarSrc} alt={displayName} />}
                                <AvatarFallback className="bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-xs font-semibold text-white">
                                  {getInitial(displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800">{item.username}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                  #{item.id} · {displayName}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              <Badge className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + roleMeta.className}>
                                {roleMeta.label}
                              </Badge>
                              <span className={'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ' + statusMeta.className}>
                                <span className={'size-1.5 rounded-full ' + statusMeta.dotClass} />
                                {statusMeta.label}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatTime(item.createdAt || item.createTime)}</span>
                            </div>

                            <div className="mt-3 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                onClick={function () { openPwdDialog(item); }}
                                className="h-8 rounded-lg px-2.5 text-xs text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                              >
                                <KeyRoundIcon className="size-3.5" />
                                重置密码
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={function () { openBanDialog(item); }}
                                disabled={protectedUser === true}
                                className={
                                  'h-8 rounded-lg px-2.5 text-xs transition-all active:scale-95 disabled:opacity-40 ' +
                                  (statusMeta.banned === true
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-rose-500 hover:bg-rose-50')
                                }
                              >
                                {statusMeta.banned === true ? (
                                  <ShieldCheckIcon className="size-3.5" />
                                ) : (
                                  <ShieldBanIcon className="size-3.5" />
                                )}
                                {statusMeta.banned === true ? '解封' : '封禁'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <AdminPagination
                      key={'user-page-' + userPage}
                      page={userPage}
                      totalPages={userTotalPages}
                      total={userTotal}
                      unit="人"
                      onPrev={handleUserPrev}
                      onNext={handleUserNext}
                      onJump={handleUserPageJump}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] tracking-wide text-slate-400">
          <span>ANIME HUB · ADMIN CONSOLE</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-3" />
            仅管理员可见 · 操作请谨慎
          </span>
        </footer>
      </div>

      {/* 删除确认 */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={function (open) {
          if (open === false && deleting === false) setDeleteTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2Icon className="size-5" />
            </div>
            <DialogTitle className="text-lg">{deleteTitle}</DialogTitle>
            <DialogDescription className="leading-6">{deleteDescription}</DialogDescription>
          </DialogHeader>

          {deleteTarget !== null && (
            <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3">
              {deleteTarget.names.slice(0, 5).map(function (name, index) {
                return (
                  <p key={index} className="truncate text-xs text-slate-600">
                    · {name}
                  </p>
                );
              })}
              {deleteTarget.names.length > 5 && (
                <p className="text-[11px] text-slate-400">等共 {deleteTarget.names.length} 部动漫</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={function () { setDeleteTarget(null); }}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="h-10 rounded-xl bg-rose-600 text-white transition-all hover:bg-rose-700 active:scale-95"
            >
              {deleting === true ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
              {deleting === true ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 封禁确认 */}
      <Dialog
        open={banTarget !== null}
        onOpenChange={function (open) {
          if (open === false && banBusy === false) setBanTarget(null);
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div
              className={
                'mb-2 flex size-11 items-center justify-center rounded-2xl ' +
                (banTarget !== null && banTarget.banned === true
                  ? 'bg-emerald-50 text-emerald-500'
                  : 'bg-rose-50 text-rose-500')
              }
            >
              {banTarget !== null && banTarget.banned === true ? (
                <ShieldCheckIcon className="size-5" />
              ) : (
                <ShieldBanIcon className="size-5" />
              )}
            </div>
            <DialogTitle className="text-lg">
              {banTarget !== null && banTarget.banned === true ? '解除封禁？' : '封禁该用户？'}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {banTarget !== null && banTarget.banned === true
                ? '解封后该用户可以重新登录并继续使用系统。'
                : '封禁后该用户将无法登录，已登录的会话也会被后端拦截。'}
            </DialogDescription>
          </DialogHeader>

          {banTarget !== null && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                  {getInitial(banTarget.user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{banTarget.user.username}</p>
                <p className="text-[11px] text-slate-400">用户 ID #{banTarget.user.id}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={banBusy}
              onClick={function () { setBanTarget(null); }}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              disabled={banBusy}
              onClick={handleConfirmBan}
              className={
                'h-10 rounded-xl text-white transition-all active:scale-95 ' +
                (banTarget !== null && banTarget.banned === true
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700')
              }
            >
              {banBusy === true && <Loader2Icon className="size-4 animate-spin" />}
              {banBusy === true
                ? '处理中…'
                : banTarget !== null && banTarget.banned === true
                  ? '确认解封'
                  : '确认封禁'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码 */}
      <Dialog
        open={pwdTarget !== null}
        onOpenChange={function (open) {
          if (open === false) closePwdDialog();
        }}
      >
        <DialogContent className="rounded-2xl border-0 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
              <KeyRoundIcon className="size-5" />
            </div>
            <DialogTitle className="text-lg">重置用户密码</DialogTitle>
            <DialogDescription className="leading-6">
              为指定账号设置新密码。重置后请通知用户使用新密码重新登录。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-slate-600">目标用户</Label>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <UserRoundIcon className="size-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-700">{pwdTarget !== null ? pwdTarget.username : ''}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-400">
                  {pwdTarget !== null ? '#' + pwdTarget.id : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="admin-new-password" className="text-[11px] text-slate-600">
                  新密码
                </Label>
                <button
                  type="button"
                  onClick={function () { setShowPwd(showPwd === false); }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showPwd === true ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
                  {showPwd === true ? '隐藏' : '显示'}
                </button>
              </div>
              <Input
                id="admin-new-password"
                type={pwdInputType}
                value={newPwd}
                onChange={function (event) { setNewPwd(event.target.value); }}
                placeholder="至少 6 位，建议含大小写与数字"
                autoComplete="new-password"
                aria-invalid={pwdTooShort}
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
              />
              {pwdTooShort === true && (
                <p className="flex items-center gap-1.5 text-[11px] text-rose-500">
                  <CircleAlertIcon className="size-3" />
                  新密码至少 6 位
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-confirm-password" className="text-[11px] text-slate-600">
                确认新密码
              </Label>
              <Input
                id="admin-confirm-password"
                type={pwdInputType}
                value={confirmPwd}
                onChange={function (event) { setConfirmPwd(event.target.value); }}
                placeholder="再次输入新密码"
                autoComplete="new-password"
                aria-invalid={pwdMismatch}
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-800 transition-all focus-visible:border-sky-300"
              />
              {pwdMismatch === true && (
                <p className="flex items-center gap-1.5 text-[11px] text-rose-500">
                  <CircleAlertIcon className="size-3" />
                  两次输入的新密码不一致
                </p>
              )}
              {confirmPwd !== '' && pwdMismatch === false && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <CheckIcon className="size-3" strokeWidth={3} />
                  两次输入一致
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2.5 text-[11px] leading-5 text-amber-700">
              <ShieldIcon className="mt-0.5 size-3.5 shrink-0" />
              密码会由后端加密后写入数据库，请勿把密码明文发给他人。
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={pwdSaving}
              onClick={closePwdDialog}
              className="h-10 rounded-xl border-slate-200 transition-all active:scale-95"
            >
              取消
            </Button>
            <Button
              disabled={pwdCanSubmit === false}
              onClick={handleResetPassword}
              className="h-10 rounded-xl bg-slate-900 px-4 text-white transition-all hover:bg-slate-800 active:scale-95 disabled:bg-slate-300"
            >
              {pwdSaving === true ? <Loader2Icon className="size-4 animate-spin" /> : <KeyRoundIcon className="size-4" />}
              {pwdSaving === true ? '保存中…' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
