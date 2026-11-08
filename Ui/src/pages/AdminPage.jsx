import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UsersIcon, FilmIcon, HardDriveIcon, RefreshCwIcon, TrashIcon, ShieldAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/utils/format'; // 假设你抽出了工具函数，如果没有请自己写一个
import logger from '@/utils/logger';

// 这里需要你新建一个 api/admin.js 来调管理员接口
// import { fetchAdminDashboard, fetchAdminAnimes, deleteAdminAnime, triggerAdminNews } from '@/api/admin';

export default function AdminPage() {
  // 看板数据
  var statsState = useState({ totalUsers: 0, totalAnimes: 0, totalFiles: 0 });
  var stats = statsState[0]; var setStats = statsState[1];

  // 动漫列表数据
  var listState = useState([]); var list = listState[0]; var setList = listState[1];
  
  // 加载状态
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var refreshingState = useState(false); var refreshing = refreshingState[0]; var setRefreshing = refreshingState[1];

  // 初始化加载数据
  useEffect(function () {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    
    // TODO: 对接真实后端接口
    // 模拟获取数据看板
    setTimeout(function () {
      setStats({ totalUsers: 128, totalAnimes: 452, totalFiles: 1250 });
      
      // 模拟获取全站动漫列表
      setList([
        { id: 1, animeName: '进击的巨人', username: '张三', imagePath: '/uploads/a.jpg', createTime: '2026-10-01' },
        { id: 2, animeName: '鬼灭之刃', username: '李四', imagePath: '/uploads/b.jpg', createTime: '2026-10-02' },
        { id: 3, animeName: '赛马娘', username: '王五', imagePath: '/uploads/c.jpg', createTime: '2026-10-03' },
      ]);
      setLoading(false);
    }, 800);
  }

  // 强制删除某部动漫
  function handleDeleteAnime(id, name) {
    if (!window.confirm(`确定要强制删除《${name}》吗？此操作不可逆！`)) return;
    
    // 调用 deleteAdminAnime(id)
    toast.success('已强制删除该动漫');
    setList(list.filter(function(item) { return item.id !== id; }));
  }

  // 触发系统更新（比如生成早报）
  function handleRefreshSystem() {
    setRefreshing(true);
    // 调用 triggerAdminNews()
    setTimeout(function () {
      toast.success('系统早报已强制刷新！');
      setRefreshing(false);
    }, 1500);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* 1. 顶部标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlertIcon className="text-primary size-8" />
            管理员控制台
          </h1>
          <p className="text-muted-foreground mt-1">
            全站数据总览与系统维护
          </p>
        </div>
        
        <Button onClick={handleRefreshSystem} disabled={refreshing}>
          <RefreshCwIcon className={'size-4 mr-2 ' + (refreshing ? 'animate-spin' : '')} />
          {refreshing ? '正在刷新...' : '强制刷新 AI 早报'}
        </Button>
      </div>

      {/* 2. 数据看板卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">全站注册用户</CardTitle>
            <UsersIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">人</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">全站动漫总数</CardTitle>
            <FilmIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAnimes}</div>
            <p className="text-xs text-muted-foreground mt-1">部</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">媒体文件占用</CardTitle>
            <HardDriveIcon className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">个文件</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. 全站动漫管理表 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>全站动漫管理</CardTitle>
          <CardDescription>这里展示所有用户上传的动漫，你可以删除违规内容。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">封面</TableHead>
                <TableHead>动漫名称</TableHead>
                <TableHead>所属用户</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                </TableRow>
              ) : (
                list.map(function(item) {
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="size-12 rounded-md overflow-hidden bg-muted">
                          {/* 假设你有一个拼接头像的公共方法 */}
                          <img src={item.imagePath} alt={item.animeName} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.animeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.username}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.createTime}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={function() { handleDeleteAnime(item.id, item.animeName); }}
                        >
                          <TrashIcon className="size-4 mr-1" /> 强制删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}