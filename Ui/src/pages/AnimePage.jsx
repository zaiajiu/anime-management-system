import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, PlusIcon, EditIcon, CheckIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AddAnimeDialog from '@/components/AddAnimeDialog';
import { fetchAnimeList, fetchAnimeByName, deleteAnimeBatch, fetchAnimeCount } from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner'; // ★ 引入

// 全局配置
var BACKEND = 'http://localhost:8080';
var PAGE_SIZE = 9; // 后端设定一页返回 9 个，前端用来计算总页数

/**
 * 工具函数：生成内联 SVG 兜底图
 * @param {string} label - 图片中间显示的文字
 * @returns {string} 可以直接用在 img src 里的 base64 数据
 */
function getDefaultImage(label) {
  var text = label || '无图';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="266"><rect width="100%" height="100%" fill="#eeeeee"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#999999" font-size="16">' + text + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/**
 * 工具函数：拼接图片完整 URL
 * @param {string} path - 后端返回的相对路径（如 /uploads/xxx.jpg）
 * @returns {string} 完整的可访问 URL
 */
function getImageUrl(path) {
  if (!path) return getDefaultImage('未上传');
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

/**
 * 动漫列表主页面组件
 */
export default function AnimePage() {
  // 路由跳转工具（用于点击卡片跳详情页）
  var navigate = useNavigate();

  // ============================================================
  // 组件状态管理 (State)
  // ============================================================
  // 列表相关
  var listState = useState([]); var list = listState[0]; var setList = listState[1]; // 存储当前页的动漫数组
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1]; // 是否正在加载数据
  var keywordState = useState(''); var keyword = keywordState[0]; var setKeyword = keywordState[1]; // 搜索框的输入内容

  // 分页相关
  var pageState = useState(1); var page = pageState[0]; var setPage = pageState[1]; // 当前页码
  var totalState = useState(0); var total = totalState[0]; var setTotal = totalState[1]; // 总数据条数
  var jumpPageState = useState(''); var jumpPage = jumpPageState[0]; var setJumpPage = jumpPageState[1]; // 跳转输入框里的内容

  // 弹窗与编辑模式相关
  var dialogOpenState = useState(false); var dialogOpen = dialogOpenState[0]; var setDialogOpen = dialogOpenState[1]; // 新增动漫弹窗的开关
  var editModeState = useState(false); var editMode = editModeState[0]; var setEditMode = editModeState[1]; // 是否处于“批量编辑”模式
  var selectedIdsState = useState([]); var selectedIds = selectedIdsState[0]; var setSelectedIds = selectedIdsState[1]; // 处于编辑模式时，勾选的动漫 id 数组
  var confirmOpenState = useState(false); var confirmOpen = confirmOpenState[0]; var setConfirmOpen = confirmOpenState[1]; // 删除确认弹窗的开关

  // 用于搜索防抖的定时器（用 useRef 存，避免组件重新渲染时丢失）
  var searchTimerRef = useRef(null);

  // ============================================================
  // 核心业务方法 (Functions)
  // ============================================================

  /**
   * 加载分页数据和总数
   * @param {number} targetPage - 要加载的页码（比如第 2 页）
   */
  function loadPageList(targetPage) {
    setLoading(true);

    // 1. 发起请求：查询当前页的动漫列表
    fetchAnimeList(targetPage)
      .then(function (res) {
        if (res.success) {
          setList(res.data || []); // 后端返回的是数组，直接存进 list 状态
          setPage(targetPage);     // 更新当前页码状态
          setJumpPage(targetPage.toString()); // 同步更新跳转输入框的值
        }
      })
      .catch(function (error) { logger.error('AnimePage', '加载列表失败', error); })
      .finally(function () { setLoading(false); }); // 无论成功失败，停止 loading

    // 2. 发起请求：查询总数（为了算总页数）
    fetchAnimeCount()
      .then(function (res) {
        if (res.success) {
          setTotal(res.data || 0);
        }
      })
      .catch(function (error) { logger.error('AnimePage', '加载总数失败', error); });
  }

  /**
   * 副作用：组件挂载时（页面第一次打开），默认加载第一页
   */
  useEffect(function () { loadPageList(1); }, []);

  /**
   * 按名称模糊搜索（不走分页，直接查出所有匹配的）
   * @param {string} name - 搜索关键词
   */
  function searchByName(name) {
    setLoading(true);
    fetchAnimeByName(name)
      .then(function (res) {
        logger.info('animeApi', '获取动漫成功', res);
        console.log("获取动漫成功",res)
        if (res.success) setList(res.data || []);
        else setList([]);
      })
      .finally(function () { setLoading(false); });
  }

  /**
   * 监听搜索框输入事件（带 500ms 防抖）
   * 用户连续打字时不会发请求，停下 500ms 后才真正发请求
   */
  function handleKeywordChange(event) {
    var value = event.target.value;
    setKeyword(value);
    // 如果之前有定时器，先清空
    if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);

    // 重新开启定时器
    searchTimerRef.current = setTimeout(function () {
      if (value.trim() === '') loadPageList(1); // 如果清空了搜索框，回到第一页全部数据
      else searchByName(value.trim());          // 否则发起搜索请求
    }, 500);
  }

  // ============================================================
  // 翻页逻辑
  // ============================================================
  // 计算总页数（比如总数 10 条，每页 9 条，Math.ceil(10/9) = 2 页）
  var totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // 点击“上一页”
  function handlePrevPage() { if (page > 1) loadPageList(page - 1); }
  
  // 点击“下一页”
  function handleNextPage() { if (page < totalPages) loadPageList(page + 1); }
  
  // 输入页码跳转
  function handleJumpPage() {
    var target = parseInt(jumpPage, 10);
    if (isNaN(target) || target < 1) target = 1; // 防呆设计：如果输入非数字或小于1，强制设为1
    if (target > totalPages) target = totalPages; // 如果超过最大页，强制设为最大页
    loadPageList(target);
  }

  // ============================================================
  // 增删改逻辑
  // ============================================================

  /**
   * 新增动漫成功后的回调函数（由 AddAnimeDialog 组件触发）
   * 逻辑：如果当前在搜索状态，就重新搜；如果没搜索，就重新加载第一页
   */
  function handleAddSuccess() {
    if (keyword.trim() === '') loadPageList(1);
    else searchByName(keyword.trim());
  }

  /**
   * 图片加载失败时的兜底处理
   * （防止死循环：用 dataset.failed 标记，如果已经替换过一次还失败，就不再替换）
   */
  function handleImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') return;
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  // 进入编辑模式（清空之前选中的记录）
  function enterEditMode() { setEditMode(true); setSelectedIds([]); }
  
  // 退出编辑模式
  function exitEditMode() { setEditMode(false); setSelectedIds([]); }
  
  /**
   * 选中/取消选中某个动漫卡片
   * @param {number} id - 动漫的 id
   */
  function toggleSelect(id) {
    var index = selectedIds.indexOf(id);
    if (index === -1) {
      // 没选中 -> 加入数组
      setSelectedIds(selectedIds.concat(id));
    } else {
      // 已经选中 -> 从数组剔除
      var copy = selectedIds.slice(); copy.splice(index, 1); setSelectedIds(copy);
    }
  }

  /**
   * 点击底部“删除”按钮（打开确认弹窗）
   */
  function handleClickDelete() {
    if (selectedIds.length === 0) return toast.error('请先选择要删除的动漫');
    setConfirmOpen(true);
  }

  /**
   * 在确认弹窗中点击“确认删除”（真正执行删除）
   */
  function handleConfirmDelete() {
    setConfirmOpen(false); 
    setEditMode(false);
    
    var idsToDelete = selectedIds; 
    setSelectedIds([]); // 清空选中的状态

    // 发起批量删除请求
    deleteAnimeBatch(idsToDelete)
      .then(function (res) {
        if (res.success === false) toast.error(res.message);
        if (res.success==true) {
          toast.success("删除动漫成功")
        }
        // 刷新列表逻辑
        if (keyword.trim() === '') {
          // 如果当前页的数据被删光了，且不是第一页，就自动往前翻一页
          var targetPage = (idsToDelete.length === list.length && page > 1) ? page - 1 : page;
          loadPageList(targetPage);
        } else {
          // 如果是搜索状态，重新搜索
          searchByName(keyword.trim());
        }
      })
      .catch(function (error) { toast.error('删除失败：' + error.message); });
  }

  /**
   * 点击动漫卡片的处理逻辑
   * @param {object} item - 动漫对象
   */
  function handleCardClick(item) {
    if (editMode === true) {
      toggleSelect(item.id); // 如果在编辑模式，就切换选中状态
    } else {
      navigate('/monitor/' + item.id); // 否则跳转到详情页
    }
  }

  // ============================================================
  // 渲染视图 (UI)
  // ============================================================
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* 顶部工具栏：搜索框 + 编辑按钮 */}
      <div className="flex items-center gap-4">
        <InputGroup className="max-w-sm">
          <InputGroupInput placeholder="搜索动漫名称..." value={keyword} onChange={handleKeywordChange} />
          <InputGroupAddon><SearchIcon className="text-muted-foreground" /></InputGroupAddon>
          <InputGroupAddon align="inline-end"><Kbd>⌘K</Kbd></InputGroupAddon>
        </InputGroup>
        <div className="ml-auto">
          {editMode === false ? (
            <Button variant="outline" onClick={enterEditMode}><EditIcon className="size-4 mr-2" />编辑</Button>
          ) : (
            <Button variant="outline" onClick={exitEditMode}>完成</Button>
          )}
        </div>
      </div>

      {/* 卡片列表：判断是否正在加载 */}
      {loading === true ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* 如果是普通模式，显示“添加动漫”的加号卡片 */}
          {editMode === false && (
            <Card onClick={function () { setDialogOpen(true); }} className="cursor-pointer border-dashed border-2 bg-muted/30 hover:bg-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center aspect-[3/4] p-0">
                <PlusIcon className="size-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-2">添加动漫</span>
              </CardContent>
            </Card>
          )}

          {/* 遍历渲染动漫数据 */}
          {list.map(function (item) {
            var isSelected = selectedIds.indexOf(item.id) !== -1;
            return (
              <Card key={item.id} onClick={function () { handleCardClick(item); }}
                className={'overflow-hidden pt-0 relative ' + (editMode ? 'cursor-pointer ' : '') + (isSelected ? 'ring-2 ring-primary' : '')}>
                {/* 封面图 */}
                <img src={getImageUrl(item.imagePath)} alt={item.animeName} className="w-full aspect-[3/4] object-cover bg-muted" onError={handleImageError} />
                {/* 标题 */}
                <CardContent className="p-3"><CardTitle className="text-sm line-clamp-1">{item.animeName}</CardTitle></CardContent>
                {/* 编辑模式下的右下角勾选圈 */}
                {editMode === true && (
                  <div className={'absolute bottom-2 right-2 size-6 rounded-full border-2 flex items-center justify-center transition-colors ' + (isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background/80 border-muted-foreground')}>
                    {isSelected === true && <CheckIcon className="size-4" />}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 底部分页组件：只有在非搜索状态且有数据时才显示 */}
      {keyword.trim() === '' && list.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
            <ChevronLeftIcon className="size-4 mr-1" /> 上一页
          </Button>
          <div className="text-sm font-medium">第 {page} 页</div>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= totalPages}>
            下一页 <ChevronRightIcon className="size-4 ml-1" />
          </Button>
          
          {/* 跳转输入框 */}
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm text-muted-foreground">跳至</span>
            <Input className="w-16 h-8 text-center" value={jumpPage} onChange={function (e) { setJumpPage(e.target.value); }} onBlur={handleJumpPage} onKeyDown={function (e) { if (e.key === 'Enter') handleJumpPage(); }} />
            <span className="text-sm text-muted-foreground">页</span>
          </div>
          
          {/* 总页数/总数展示 */}
          <div className="text-sm text-muted-foreground ml-4 border-l pl-4">
            共 {totalPages} 页 / 总计 {total} 个动漫
          </div>
        </div>
      )}

      {/* 底部批量删除悬浮栏：仅在编辑模式显示 */}
      {editMode === true && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex items-center justify-between z-50">
          <span className="text-sm text-muted-foreground">已选择 {selectedIds.length} 个</span>
          <Button variant="destructive" onClick={handleClickDelete} disabled={selectedIds.length === 0}>
            <TrashIcon className="size-4 mr-2" /> 删除
          </Button>
        </div>
      )}

      {/* 引入的新增动漫弹窗 */}
      <AddAnimeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleAddSuccess} />

      {/* 删除确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除选中的 {selectedIds.length} 个动漫吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={function () { setConfirmOpen(false); }}>取消</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}