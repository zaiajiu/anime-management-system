import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Newspaper, LogIn, Sparkles, Loader2 } from 'lucide-react'
import { getNewspaperNews } from '@/api/Newspaper'
import { isLogin } from '@/utils/auth'

export default function HomePage() {
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [islogin, setIslogin] = useState(false)
  

  useEffect(() => {
    let alive = true
    
    getNewspaperNews()
      .then((res) => {
        if (!alive) return
        if (res.success && res.data) {
          setNews(res.data)
        }
      })
      .catch((err) => {
        console.error('获取资讯报错', err)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [])

  useEffect(()=>{
    setIslogin(isLogin());
  })


  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* 背景装饰 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* 顶部导航栏 */}

      <header className="relative z-20 w-full border-b border-slate-200/50 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Sparkles className="w-5 h-5" />
            <span>Anime</span>
          </div>
          {!isLogin ? (
          <Button asChild variant="default" className="rounded-full shadow-sm gap-2 px-6">
            <Link to="/login">
              <LogIn className="w-4 h-4" />
              登录/注册
            </Link>
          </Button>
          ) : (<></>)}

        </div>
      </header>

      {/* 页面主体 */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-6 md:p-10 space-y-12">
        
        {/* 居中欢迎语 */}
        <div className="text-center space-y-4 pt-10 pb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">欢迎回来</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            记录每一部让你心动的番剧，随时查阅你的专属观后感。
          </p>
        </div>

        {/* 分割线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-50 px-4 text-sm text-slate-400">最新动漫资讯</span>
          </div>
        </div>

        {/* 只有一条数据的展示区 */}
        <div className="flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              加载资讯中...
            </div>
          ) : news ? (
            <Card className="w-full max-w-2xl bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mb-2">
                  <Newspaper className="w-4 h-4" /> 
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {news.text}
                </p>
                <div className="text-right text-sm text-slate-400 pt-4 border-t border-slate-100">
                  发布于：{news.date}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-16 text-slate-400 bg-white/50 rounded-xl border border-slate-100 w-full">
              暂无最新资讯
            </div>
          )}
        </div>

      </main>
    </div>
  )
}