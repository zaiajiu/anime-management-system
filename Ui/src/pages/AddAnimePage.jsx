// src/pages/AddAnimePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ImagePlus, Loader2, Save } from 'lucide-react'
import { createAnime,fetchGetSubmitToken } from '@/api/anime'

export default function AddAnimePage() {
  const navigate = useNavigate()

  // 表单文本数据：名称、简介、观后感
  const [data, setData] = useState({
    animeName: '',
    anime_introduction: '',
    anime_comment: '',
  })

  // 选中的图片文件对象（FormData 提交用）
  const [file, setFile] = useState(null)

  // 图片本地预览地址（blob URL，仅用于显示，不提交）
  const [preview, setPreview] = useState('')

  // 表单是否正在提交
  const [submitting, setSubmitting] = useState(false)

  // 错误提示信息，空字符串表示没有错误
  const [error, setError] = useState('')

  const [token, setToken] = useState('')

  const getToken = async() =>{
    const t =await fetchGetSubmitToken();
    setToken(t.data)
    console.log("Token: ",token,t)
  }

  useEffect(()=>{
    getToken();
  },[])

  // 统一处理文本输入变化
  const handleChange = (key) => (e) => {
    setData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  // 选图片：只存文件 + 本地预览，不上传
  const handleImageChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  // 提交：拼 FormData 传给 createAnime
  const handleSubmit = async () => {
    if (!data.animeName.trim()) {
      setError('请输入动漫名称')
      return
    }
    if (!file) {
      setError('请上传封面图片')
      return
    }

    setSubmitting(true)
    setError('')

    try {
        // 把你要传的字段组装成一个普通对象
        const payload = {
            animeName: data.animeName,
            animeIntroduction: data.anime_introduction, // 注意这里改成接口认的驼峰名
            animeComment: data.anime_comment,           // 改成接口认的驼峰名
            image: file,
            token: token, // 确保这个 token 是字符串！
        }

        console.log('提交的参数：', payload)

        // 直接把对象传给 createAnime
        const res = await createAnime(payload)
        if (res.success) {
            navigate('/')
        } else {
            throw new Error(res.message || '提交失败')
        }
        } catch (err) {
        setError(err.message)
        }
    }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 页头 */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">新增动漫</h1>
            <p className="text-sm text-slate-500 mt-0.5">填写信息并上传封面，提交后展示在列表中</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
              {/* 左侧：封面图 */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  封面图片 <span className="text-red-500">*</span>
                </Label>
                <label className="block cursor-pointer">
                  <div className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors overflow-hidden">
                    {preview ? (
                      <img src={preview} alt="封面预览" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="w-10 h-10" />
                        <span className="text-sm font-medium">上传封面</span>
                        <span className="text-xs">点击选择图片</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-400 mt-2">建议竖图，比例 3:4</p>
              </div>

              {/* 右侧：表单 */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="animeName">
                    动漫名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="animeName"
                    value={data.animeName}
                    onChange={handleChange('animeName')}
                    placeholder="例如：鬼灭之刃"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anime_introduction">简介</Label>
                  <textarea
                    id="anime_introduction"
                    value={data.anime_introduction}
                    onChange={handleChange('anime_introduction')}
                    placeholder="简单介绍一下这部动漫..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anime_comment">观后感</Label>
                  <textarea
                    id="anime_comment"
                    value={data.anime_comment}
                    onChange={handleChange('anime_comment')}
                    placeholder="写下你的观后感..."
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t bg-slate-50/50 px-6 py-4">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  提交
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}