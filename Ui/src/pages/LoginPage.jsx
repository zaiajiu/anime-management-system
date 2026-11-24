// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Sparkles, User, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { loginApi, registerApi } from '@/api/user'

export default function LoginPage() {
  const navigate = useNavigate()

  // 当前激活的 Tab：'login' 或 'register'
  const [activeTab, setActiveTab] = useState('login')

  // 登录表单状态
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  // 注册表单状态
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' })

  // 密码是否可见（小眼睛图标切换）
  const [showPassword, setShowPassword] = useState(false)

  // 提交状态
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')



  // 统一处理输入变化
  const handleLoginChange = (key) => (e) => {
    setLoginData((prev) => ({ ...prev, [key]: e.target.value }))
  }
  const handleRegisterChange = (key) => (e) => {
    setRegisterData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const from = location.state?.from?.pathname || '/'
  // 登录提交
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setError('请输入账号和密码')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await loginApi(loginData.username,loginData.password)
      if (res.success) {
        console.log("登录返回：",res)
        toast.success('登录成功')
          localStorage.setItem("token",'session-login-' + Date.now())
        navigate(from, { replace: true }) 
      } else {
        throw new Error(res.message || '登录失败')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // 注册提交
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!registerData.username.trim() || !registerData.password.trim()) {
      setError('请填写完整的注册信息')
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await registerApi(registerData.username,registerData.password,registerData.confirmPassword)
      if (res.success) {
        toast.success('注册成功，请登录')
        setActiveTab('login') // 切换到登录 tab
        setLoginData({ username: registerData.username, password: '' }) // 带入账号
        setRegisterData({ username: '', password: '', confirmPassword: '' }) // 清空注册表单
      } else {
        throw new Error(res.message || '注册失败')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-slate-200">
        {/* 顶部 Logo 和标题 */}
        <CardHeader className="text-center space-y-2 pb-4">
          <div className='flex items-center'>
            <div className="translate-x-8 mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-slate-600"
              >返回首页</button>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">动漫管理系统</CardTitle>
          <CardDescription>登录以管理你的动漫收藏</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setError('') }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            {/* ================= 登录表单 ================= */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="login-username"
                      placeholder="请输入账号"
                      value={loginData.username}
                      onChange={handleLoginChange('username')}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={loginData.password}
                      onChange={handleLoginChange('password')}
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>

            {/* ================= 注册表单 ================= */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-username"
                      placeholder="设置一个账号"
                      value={registerData.username}
                      onChange={handleRegisterChange('username')}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="设置密码"
                      value={registerData.password}
                      onChange={handleRegisterChange('password')}
                      className="pl-9 pr-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">确认密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange('confirmPassword')}
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? '注册中...' : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}