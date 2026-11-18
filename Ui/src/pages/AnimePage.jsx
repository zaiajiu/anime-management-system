import { useEffect, useState } from 'react';
import { fetchAnimeList,fetchAnimeByName } from '@/api/anime'
import AnimeCard from '@/components/AnimeCard';
import { Input } from '@/components/ui/input'
import { Plus, Search, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
export default function LoginPage() {
  var listState = useState([]);
  var list = listState[0];
  var setList = listState[1];
  const navigate = useNavigate()

  var [searchMode, setSearchMode] = useState(false)   // 是否进入搜索状态
  var [keyword, setKeyword] = useState('')            // 搜索关键字
  var [searchResult, setSearchResult] = useState([])  // 搜索结果
  var [sortField, setSortField] = useState('id')        // 排序字段，默认 id
  var [sortOrder, setSortOrder] = useState('DESC') // 排序方向，默认倒序
  
  useEffect(function(){
    fetchAnimeList(1,sortField,sortOrder)
    .then(function(res){
        if(res.success){
            console.log(res.data)
            setList(res.data);
        }
    });
  },[sortField, sortOrder]);
  // 防抖搜索：keyword 变化后 300ms 才请求
  useEffect(() => {
    if (!searchMode) return
    if (!keyword.trim()) {
      setSearchResult([])
      return
    }

    const timer = setTimeout(() => {
      fetchAnimeByName(keyword.trim(),2,sortField,sortOrder).then((res) => {
        if (res.success) setSearchResult(res.data)
      })
    }, 300)
    // 下次 effect 执行前清掉上一个定时器
    return () => clearTimeout(timer)
  }, [keyword, searchMode,sortField, sortOrder])
  const displayList = searchMode ? searchResult : list
  
  return (
    
    <div >
        <div className="flex items-center gap-3 mb-6">
            
            {/* 搜索框 */}
            <div >
                
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    type="text"
                    placeholder="搜索动漫名称..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onFocus={() => setSearchMode(true)}
                    onBlur={() => {
                        // 失焦时如果没输入内容，退出搜索状态
                        if (!keyword.trim()) {
                            setSearchMode(false)
                            setSearchResult([])
                        }
                    }}
                    className="pl-9"
                />
            </div>
            {/* 排序下拉框 */}
                <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="id">按 ID</option>
                        <option value="createTime">按创建时间</option>
                        <option value="updateTime">按修改时间</option>
                        <option value="name">按名称</option>
                </select>
                {/* 倒序/顺序切换按钮 */}
                <button
                onClick={() => setSortOrder((o) => (o === 'DESC' ? 'ASC' : 'DESC'))}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white hover:bg-slate-50 transition-colors"
                title={sortOrder === 'DESC' ? '当前倒序，点击切换正序' : '当前正序，点击切换倒序'}>
                {sortOrder === 'DESC' ? (
                    <ArrowDownWideNarrow className="w-4 h-4" />
                    ) : (
                    <ArrowUpNarrowWide className="w-4 h-4" />
                )}
                {sortOrder === 'DESC' ? '倒序' : '正序'}
                </button>
        </div>
        <div className='grid grid-cols-5 gap-10 p-6'>
        
        {/**新增卡片 */}
        {!searchMode && (<Card onClick={() => navigate('/add')}
            className="w-48 h-64 
            p-0 overflow-hidden relative group border-0 
            rounded-lg transition-all duration-300 ease-out 
            hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 
            active:scale-95 active:shadow-md cursor-pointer">
                <div className="w-full h-full 
                flex flex-col items-center 
                justify-center gap-2 text-slate-400 
                transition-transform duration-300 ease-out group-hover:scale-110">
                    <Plus className="w-10 h-10" />
                    <span className="text-sm font-medium">新增动漫</span>
                </div>
        </Card>
        )}

        {/**动漫展示卡片 */}
        {displayList.map((anime,index)=>(
            <AnimeCard key={anime.id ?? index} anime={anime} />
        ))}
        </div>

        {searchMode && displayList.length === 0 && (
        <p className="text-slate-500 mt-6">没有找到匹配的动漫</p>
        )}
      
    </div>
  );
}