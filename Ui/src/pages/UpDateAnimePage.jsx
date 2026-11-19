import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ImageOff, Edit2, Save, X } from 'lucide-react'
import { fetchAnimeById, updateAnime } from '@/api/anime'

export default function AnimeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  

  const [isEditing, setIsEditing] = useState(false) // 是否处于编辑模式
  const [editData, setEditData] = useState({})      // 编辑时的表单数据
  const [newFile, setNewFile] = useState(null)      // 选中的新图片
  const [preview, setPreview] = useState('')        // 新图片本地预览
  const [imgError, setImgError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 获取详情数据
  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchAnimeById(id)
      .then((res) => {
        if (!alive) return
        if (res.success) {
          const rawData = Array.isArray(res.data) ? res.data[0] : res.data
          setData(rawData)
          // 初始化编辑表单数据
          setEditData({
            animeName: rawData.animeName || '',
            animeIntroduction: rawData.animeIntroduction || '',
            animeComment: rawData.animeComment || '',
          })
        } else {
          throw new Error(res.message || '获取详情失败')
        }
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [id])

  // 统一处理图片地址
  const getImageUrl = (path) => {
    if (!path) return ''
    if (path.indexOf('http') === 0) return path
    return `http://localhost:8080${path}`
  }

  // 处理文本输入
  const handleChange = (key) => (e) => {
    setEditData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  // 选图片
  const handleImageChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setNewFile(f)
    setPreview(URL.createObjectURL(f))
  }

  // 点击取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewFile(null)
    setPreview('')
    // 还原表单数据
    setEditData({
      animeName: data.animeName || '',
      animeIntroduction: data.animeIntroduction || '',
      animeComment: data.animeComment || '',
    })
  }

  // 提交修改
  const handleSave = async () => {
  if (!editData.animeName.trim()) return setError('动漫名称不能为空')

  setSubmitting(true)
  setError('')
  try {
    // 1. 组装普通对象
    const updateParams = {
      animeName: editData.animeName,
      animeIntroduction: editData.animeIntroduction,
      animeComment: editData.animeComment,
      image: newFile, // 如果没有选新图，这就是 null
    }

    // 2. 直接把普通对象传给接口
    const res = await updateAnime(id, updateParams)
    
    if (res.success) {
      toast.success("修改成功")
    }
  } catch (err) {
    toast.error("修改失败")
  } finally {
    setSubmitting(false)
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || '未找到该动漫信息'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>返回</Button>
      </div>
    )
  }

  const showFallback = !data.imagePath || imgError

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditing ? '编辑动漫' : '动漫详情'}
              </h1>
            </div>
          </div>
          
          {/* 编辑/保存按钮 */}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" /> 编辑
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} disabled={submitting} className="gap-2">
                <X className="w-4 h-4" /> 取消
              </Button>
              <Button onClick={handleSave} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
              {/* 左侧：封面图 */}
              <div>
                {isEditing ? (
                  <label className="block cursor-pointer group relative">
                    <div className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                      {preview ? (
                        <img src={preview} alt="新封面预览" className="w-full h-full object-cover" />
                      ) : !showFallback ? (
                        <>
                          <img src={getImageUrl(data.imagePath)} alt="原封面" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center text-white font-medium bg-black/30">
                            点击更换图片
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 text-sm">点击上传封面</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                ) : (
                  <div className="w-full aspect-[3/4] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
                    {showFallback ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <ImageOff className="w-10 h-10" strokeWidth={1.5} />
                        <span className="text-sm">暂无封面</span>
                      </div>
                    ) : (
                      <img
                        src={getImageUrl(data.imagePath)}
                        alt={data.animeName}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 右侧：信息区 */}
              <div className="flex flex-col gap-6">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>动漫名称 <span className="text-red-500">*</span></Label>
                      <Input value={editData.animeName} onChange={handleChange('animeName')} />
                    </div>
                    <div className="space-y-2">
                      <Label>简介</Label>
                      <textarea
                        value={editData.animeIntroduction}
                        onChange={handleChange('animeIntroduction')}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>观后感</Label>
                      <textarea
                        value={editData.animeComment}
                        onChange={handleChange('animeComment')}
                        rows={5}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">{data.animeName}</h2>
                      {data.createTime && <p className="text-sm text-slate-400">收录于：{data.createTime.split(' ')[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">简介</h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {data.animeIntroduction || '暂无简介'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">观后感</h3>
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100">
                        {data.animeComment || '暂无观后感'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}