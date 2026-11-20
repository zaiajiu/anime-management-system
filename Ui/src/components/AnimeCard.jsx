import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ImageOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom' 

export default function AnimeCard({ anime }) {
  var BACKEND = 'http://localhost:8080';
  const navigate = useNavigate() 
  const [imgError, setImgError] = useState(false)
  const showFallback = !anime.imagePath || imgError
  function getImageUrl(path) {
    if (!path) return getDefaultImage('未上传');
    if (path.indexOf('http') === 0) return path;
    return BACKEND + path;
  }
  return (
    <Card onClick={() => navigate(`/update/${anime.id}`)} className="w-48 h-64 p-0 overflow-hidden relative group border-0 rounded-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 active:scale-95 active:shadow-md cursor-pointer select-none">
      {/* 图片 / 兜底图容器：统一放大 + 过渡 */}
      <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-110">
        {showFallback ? (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ImageOff className="w-8 h-8" strokeWidth={1.5} />
          </div>
        ) : (
          <img
            src={getImageUrl(anime.imagePath)}
            alt={anime.animeName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 底部渐变遮罩 + 名字 */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-left select-none">
        <h3 className="text-white font-medium text-sm leading-tight truncate">
          {anime.animeName}
        </h3>
      </div>
    </Card>
  )
}