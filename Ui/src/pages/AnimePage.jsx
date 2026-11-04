import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchIcon, PlusIcon, EditIcon, CheckIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUpDown } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AddAnimeDialog from '@/components/AddAnimeDialog';
import { fetchAnimeList, fetchAnimeByName, deleteAnimeBatch, fetchAnimeCount, fetchAnimeCountByName } from '@/api/anime';
import logger from '@/utils/logger';
import { toast } from 'sonner';

var BACKEND = 'http://localhost:8080';
var PAGE_SIZE = 9;

function getDefaultImage(label) {
  var text = label || '无图';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="266"><rect width="100%" height="100%" fill="#eeeeee"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#999999" font-size="16">' + text + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getImageUrl(path) {
  if (!path) return getDefaultImage('未上传');
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

export default function AnimePage() {
  var navigate = useNavigate();
  
  // ★ 核心 1：获取 URL 参数钩子
  var [searchParams, setSearchParams] = useSearchParams();

  // ★ 核心 2：从 URL 提取初始状态（用于刷新或返回时恢复状态）
  var initKeyword = searchParams.get('keyword') || '';
  var initPage = parseInt(searchParams.get('page'), 10) || 1;
  var initField = searchParams.get('sortField') || 'id';
  var initOrder = searchParams.get('sortOrder') || 'DESC';

  // ============================================================
  // 状态管理
  // ============================================================
  var listState = useState([]); var list = listState[0]; var setList = listState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  
  // 初始值全部从 URL 读取
  var keywordState = useState(initKeyword); var keyword = keywordState[0]; var setKeyword = keywordState[1];
  var pageState = useState(initPage); var page = pageState[0]; var setPage = pageState[1];
  var totalState = useState(0); var total = totalState[0]; var setTotal = totalState[1];
  var jumpPageState = useState(initPage.toString()); var jumpPage = jumpPageState[0]; var setJumpPage = jumpPageState[1];

  var sortFieldState = useState(initField); var sortField = sortFieldState[0]; var setSortField = sortFieldState[1];
  var sortOrderState = useState(initOrder); var sortOrder = sortOrderState[0]; var setSortOrder = sortOrderState[1];

  var dialogOpenState = useState(false); var dialogOpen = dialogOpenState[0]; var setDialogOpen = dialogOpenState[1];
  var editModeState = useState(false); var editMode = editModeState[0]; var setEditMode = editModeState[1];
  var selectedIdsState = useState([]); var selectedIds = selectedIdsState[0]; var setSelectedIds = selectedIdsState[1];
  var confirmOpenState = useState(false); var confirmOpen = confirmOpenState[0]; var setConfirmOpen = confirmOpenState[1];

  var searchTimerRef = useRef(null);

  // ============================================================
  // 核心数据请求
  // ============================================================
  
  // 统一的获取数据入口
  function fetchData(targetPage, targetKeyword, targetField, targetOrder) {
    setLoading(true);
    setPage(targetPage);
    setJumpPage(targetPage.toString());

    // 同步更新 URL，保证刷新和返回不丢失状态
    var newParams = { page: targetPage.toString() };
    if (targetKeyword.trim() !== '') newParams.keyword = targetKeyword.trim();
    if (targetField !== 'id') newParams.sortField = targetField;
    if (targetOrder !== 'DESC') newParams.sortOrder = targetOrder;
    setSearchParams(newParams);

    if (targetKeyword.trim() === '') {
      // 查全部
      fetchAnimeList(targetPage, targetField, targetOrder)
        .then(function (res) {
          if (res.success) setList(res.data || []);
        })
        .finally(function () { setLoading(false); });
        
      fetchAnimeCount()
        .then(function (res) { if (res.success) setTotal(res.data || 0); });
    } else {
      // 条件搜索
      fetchAnimeByName(targetKeyword.trim(), targetPage, targetField, targetOrder)
        .then(function (res) {
          if (res.success) setList(res.data || []);
        })
        .finally(function () { setLoading(false); });
        
      fetchAnimeCountByName(targetKeyword.trim())
        .then(function (res) { if (res.success) setTotal(res.data || 0); });
    }
  }

  // 页面初次挂载时，根据 URL 状态加载
  useEffect(function () {
    fetchData(initPage, initKeyword, initField, initOrder);
  }, []);

  // 搜索防抖
  function handleKeywordChange(event) {
    var value = event.target.value;
    setKeyword(value);
    
    if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
    
    searchTimerRef.current = setTimeout(function () {
      fetchData(1, value, sortField, sortOrder); // 搜索时强制回到第 1 页
    }, 500);
  }

  // ============================================================
  // 翻页与排序
  // ============================================================
  var totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function handlePrevPage() { if (page > 1) fetchData(page - 1, keyword, sortField, sortOrder); }
  function handleNextPage() { if (page < totalPages) fetchData(page + 1, keyword, sortField, sortOrder); }
  
  function handleJumpPage() {
    var target = parseInt(jumpPage, 10);
    if (isNaN(target) || target < 1) target = 1;
    if (target > totalPages) target = totalPages;
    fetchData(target, keyword, sortField, sortOrder);
  }

  // 排序切换
  function handleSortChange(field) {
    setSortField(field);
    fetchData(1, keyword, field, sortOrder); // 排序切换时回到第 1 页
  }

  function handleOrderChange() {
    var newOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(newOrder);
    fetchData(1, keyword, sortField, newOrder);
  }

  // ============================================================
  // 增删改操作
  // ============================================================
  function handleAddSuccess() {
    fetchData(1, keyword, sortField, sortOrder);
  }

  function handleImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') return;
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  function enterEditMode() { setEditMode(true); setSelectedIds([]); }
  function exitEditMode() { setEditMode(false); setSelectedIds([]); }

  function toggleSelect(id) {
    var index = selectedIds.indexOf(id);
    if (index === -1) {
      setSelectedIds(selectedIds.concat(id));
    } else {
      var copy = selectedIds.slice(); copy.splice(index, 1); setSelectedIds(copy);
    }
  }

  function handleClickDelete() {
    if (selectedIds.length === 0) return toast.error('请先选择要删除的动漫');
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
        if (res.success === true) toast.success("删除动漫成功");
        
        // 如果当前页被删光了，自动往前翻一页
        var targetPage = (idsToDelete.length === list.length && page > 1) ? page - 1 : page;
        fetchData(targetPage, keyword, sortField, sortOrder);
      })
      .catch(function (error) { toast.error('删除失败：' + error.message); });
  }

  function handleCardClick(item) {
    if (editMode === true) {
      toggleSelect(item.id);
    } else {
      navigate('/monitor/' + item.id); 
    }
  }

  // ============================================================
  // 渲染视图
  // ============================================================
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-4 flex-wrap">
        <InputGroup className="max-w-sm">
          <InputGroupInput placeholder="搜索动漫名称..." value={keyword} onChange={handleKeywordChange} />
          <InputGroupAddon><SearchIcon className="text-muted-foreground" /></InputGroupAddon>
          <InputGroupAddon align="inline-end"><Kbd>⌘K</Kbd></InputGroupAddon>
        </InputGroup>
        
        {/* 排序组件 */}
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="排序方式">
                {sortField === 'id' ? '默认 (ID)' : 
                 sortField === 'name' ? '按名称' :
                 sortField === 'createTime' ? '按创建时间' : '按修改时间'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">默认 (ID)</SelectItem>
              <SelectItem value="name">按名称</SelectItem>
              <SelectItem value="createTime">按创建时间</SelectItem>
              <SelectItem value="updateTime">按修改时间</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleOrderChange}>
            <ArrowUpDown className="size-4 mr-2" />
            {sortOrder === 'DESC' ? '倒序' : '顺序'}
          </Button>
        </div>

        <div className="ml-auto">
          {editMode === false ? (
            <Button variant="outline" onClick={enterEditMode}><EditIcon className="size-4 mr-2" />编辑</Button>
          ) : (
            <Button variant="outline" onClick={exitEditMode}>完成</Button>
          )}
        </div>
      </div>

      {/* 卡片列表 */}
      {loading === true ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {editMode === false && (
            <Card onClick={function () { setDialogOpen(true); }} className="cursor-pointer border-dashed border-2 bg-muted/30 hover:bg-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center aspect-[3/4] p-0">
                <PlusIcon className="size-10 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-2">添加动漫</span>
              </CardContent>
            </Card>
          )}

          {list.map(function (item) {
            var isSelected = selectedIds.indexOf(item.id) !== -1;
            return (
              <Card key={item.id} onClick={function () { handleCardClick(item); }}
                className={'overflow-hidden pt-0 relative ' + 
                  'hover:-translate-y-1 hover:shadow-lg ' +
                  'active:scale-95 ' +
                   (editMode ? 'cursor-pointer ' : '') + (isSelected ? 'ring-2 ring-primary' : '')}>
                <img src={getImageUrl(item.imagePath)} alt={item.animeName} className="w-full aspect-[3/4] object-cover bg-muted transition-transform duration-500 hover:scale-105" onError={handleImageError} />
                <CardContent className="p-3"><CardTitle className="text-sm line-clamp-1">{item.animeName}</CardTitle></CardContent>
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

      {/* 底部分页组件 */}
      {list.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
            <ChevronLeftIcon className="size-4 mr-1" /> 上一页
          </Button>
          <div className="text-sm font-medium">第 {page} 页</div>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= totalPages}>
            下一页 <ChevronRightIcon className="size-4 ml-1" />
          </Button>
          
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm text-muted-foreground">跳至</span>
            <Input className="w-16 h-8 text-center" value={jumpPage} onChange={function (e) { setJumpPage(e.target.value); }} onBlur={handleJumpPage} onKeyDown={function (e) { if (e.key === 'Enter') handleJumpPage(); }} />
            <span className="text-sm text-muted-foreground">页</span>
          </div>
          
          <div className="text-sm text-muted-foreground ml-4 border-l pl-4">
            共 {totalPages} 页 / 总计 {total} 个动漫
          </div>
        </div>
      )}

      {/* 底部批量删除悬浮栏 */}
      {editMode === true && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex items-center justify-between z-50">
          <span className="text-sm text-muted-foreground">已选择 {selectedIds.length} 个</span>
          <Button variant="destructive" onClick={handleClickDelete} disabled={selectedIds.length === 0}>
            <TrashIcon className="size-4 mr-2" /> 删除
          </Button>
        </div>
      )}

      <AddAnimeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleAddSuccess} />

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