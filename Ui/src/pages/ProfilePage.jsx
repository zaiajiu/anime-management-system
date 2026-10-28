import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditIcon } from 'lucide-react';
import { getUserInfoApi, updateProfileApi, updatePasswordApi } from '@/api/user';
import logger from '@/utils/logger';
import { toast } from 'sonner'; // ★ 引入

var BACKEND = 'http://localhost:8080';

// 辅助函数：拼接头像完整 URL
function getAvatarUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) return path;
  return BACKEND + path;
}

export default function ProfilePage() {
  // 用户数据状态
  var userInfoState = useState({
    username: '',
    nickname: '',
    avatar: '',
    signature: ''
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

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  // 密码表单状态
  var pwdFormState = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  var pwdForm = pwdFormState[0];
  var setPwdForm = pwdFormState[1];

  var fileRef = useRef(null);

  // 初始化加载用户信息
  useEffect(function () {
    loadUserInfo();
  }, []);

  function loadUserInfo() {
    getUserInfoApi()
      .then(function (res) {
        logger.info("ProfilePage.jsx",res);
        if (res.success) {
          var data = {
            username: res.data.username || '',
            nickname: res.data.nickname || res.data.username || '',
            avatar: res.data.avatar || '',
            signature: res.data.signature || ''
          };
          
          setUserInfo(data);
          setForm({ nickname: data.nickname, signature: data.signature });
        }
      })
      .finally(function () { setLoading(false); });
  }

  // ============================================================
  // 点击“修改”按钮进入编辑模式
  // ============================================================
  function handleEnterEdit() {
    setForm({ nickname: userInfo.nickname, signature: userInfo.signature });
    setAvatarFile(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = "";
    setIsEditing(true);
  }

  // ============================================================
  // 点击“取消”退出编辑模式
  // ============================================================
  function handleCancelEdit() {
    setIsEditing(false);
  }

  // ============================================================
  // 选择本地头像文件
  // ============================================================
  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('请选择图片文件');
    if (file.size > 5 * 1024 * 1024) return toast.error('图片不能超过 5MB');

    setAvatarFile(file);
    setPreview(URL.createObjectURL(file)); // 生成预览
  }

  // ============================================================
  // 保存个人资料（提交给后端）
  // ============================================================
  function handleSaveProfile(e) {
    e.preventDefault();
    if (!form.nickname.trim()) return toast.error('昵称不能为空');

    setLoading(true);
    // 调用 API 时，把表单数据和文件一起传过去
    updateProfileApi(form.nickname, form.signature, avatarFile)
      .then(function (res) {
        if (res.success) {
          toast.success('资料更新成功！');
          setIsEditing(false);
          loadUserInfo(); // 重新拉取最新数据刷新页面
        } else {
          toast.error(res.message);
        }
      })
      .catch(function (err) { toast.error('网络错误：' + err.message); })
      .finally(function () { setLoading(false); });
  }

  // ============================================================
  // 修改密码（不变）
  // ============================================================
  function handleUpdatePassword(e) {
    e.preventDefault();
    if (!pwdForm.oldPassword || !pwdForm.newPassword) return toast.error('密码不能为空');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return toast.error('两次新密码输入不一致');

    setLoading(true);
    updatePasswordApi(pwdForm.oldPassword, pwdForm.newPassword)
      .then(function (res) {
        if (res.success) {
          toast.success('密码修改成功，请重新登录！');
          localStorage.clear();
          window.location.href = '/login';
        } else {
          toast.error(res.message);
        }
      })
      .catch(function (err) { toast.error('网络错误'); })
      .finally(function () { setLoading(false); });
  }

  if (loading && !userInfo.username) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">个人中心</h1>
        <p className="text-muted-foreground text-sm">管理你的个人资料与账号安全</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="security">账号安全</TabsTrigger>
        </TabsList>

        {/* ==================== 1. 个人资料 ==================== */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>基本资料</CardTitle>
                <CardDescription>你的头像、昵称和个人签名</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={handleEnterEdit}>
                  <EditIcon className="size-4 mr-2" />
                  修改资料
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* 头像展示与上传 */}
                <div className="flex items-center gap-6">
                  <Avatar className="size-24 border-2 shadow-sm">
                    <AvatarImage src={preview || getAvatarUrl(userInfo.avatar)} />
                    <AvatarFallback className="text-2xl">
                      {userInfo.nickname ? userInfo.nickname[0] : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="space-y-2 flex-1">
                      <Label>更换头像（不选则保留原图）</Label>
                      <Input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>登录账号（不可修改）</Label>
                  <Input value={userInfo.username} disabled className="bg-muted" />
                </div>

                {/* 昵称（展示 vs 编辑） */}
                <div className="space-y-2">
                  <Label>昵称</Label>
                  {isEditing ? (
                    <Input
                      placeholder="请输入昵称"
                      value={form.nickname}
                      onChange={function (e) { setForm({ ...form, nickname: e.target.value }); }}
                    />
                  ) : (
                    <div className="p-2 border-b bg-muted/20">{userInfo.nickname || '未设置'}</div>
                  )}
                </div>

                {/* 签名（展示 vs 编辑） */}
                <div className="space-y-2">
                  <Label>个人签名</Label>
                  {isEditing ? (
                    <Textarea
                      placeholder="介绍一下自己吧..."
                      rows={4}
                      value={form.signature}
                      onChange={function (e) { setForm({ ...form, signature: e.target.value }); }}
                    />
                  ) : (
                    <div className="p-2 border-b bg-muted/20 whitespace-pre-wrap">
                      {userInfo.signature || '这个人很懒，什么都没写~'}
                    </div>
                  )}
                </div>

                {/* 底部操作按钮 */}
                {isEditing && (
                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? '保存中...' : '保存'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={loading}>
                      取消
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 2. 账号安全 ==================== */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>修改成功后需要重新登录</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>原密码</Label>
                  <Input
                    type="password"
                    placeholder="输入当前密码"
                    value={pwdForm.oldPassword}
                    onChange={function (e) { setPwdForm({ ...pwdForm, oldPassword: e.target.value }); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    placeholder="8-16 位，含大小写和数字"
                    value={pwdForm.newPassword}
                    onChange={function (e) { setPwdForm({ ...pwdForm, newPassword: e.target.value }); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>确认新密码</Label>
                  <Input
                    type="password"
                    placeholder="再次输入新密码"
                    value={pwdForm.confirmPassword}
                    onChange={function (e) { setPwdForm({ ...pwdForm, confirmPassword: e.target.value }); }}
                  />
                </div>

                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? '提交中...' : '确认修改密码'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}