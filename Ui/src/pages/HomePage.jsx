import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, SparklesIcon } from 'lucide-react';

export default function HomePage() {
  var newsState = useState([]); var news = newsState[0]; var setNews = newsState[1];
  var dateState = useState(''); var date = dateState[0]; var setDate = dateState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];

  // 获取早报数据
  useEffect(function () {
    setTimeout(function () {
      var mockData = {
        date: '2026年10月28日',
        text: '1. OpenAI 发布全新多模态模型，代码能力大幅提升。\n2. Spring Boot 3.4 版本正式发布，全面拥抱虚拟线程。\n3. 2026 届秋招落幕，Java 岗位要求明显向全栈转移。\n4. DeepSeek 接入各大办公软件，打工人效率翻倍。'
      };
      setNews(mockData.text);
      setDate(mockData.date);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* 顶部欢迎语 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">你好，欢迎回来！</h1>
        <p className="text-muted-foreground mt-2">
          今天是 {date}，祝你度过愉快的一天。
        </p>
      </div>

      <Separator />

      {/* 核心区域：早报卡片 */}
      <div className="grid gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm bg-muted/10">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <NewspaperIcon className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                每日早报
                <SparklesIcon className="size-4 text-yellow-500" />
              </CardTitle>
              <CardDescription>每天 3 分钟，知晓天下事</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : (
              /* 使用 whitespace-pre-wrap 让 \n 换行生效 */
              <div className="text-base leading-8 whitespace-pre-wrap text-foreground/90 font-medium">
                {news}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部可以放一些你的系统数据统计或者快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">我的动漫库</CardTitle>
            <CardDescription>去查看和管理你的动漫收藏</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">个人中心</CardTitle>
            <CardDescription>修改头像、昵称或账号密码</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}