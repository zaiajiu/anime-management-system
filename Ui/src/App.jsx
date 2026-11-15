import { Outlet, Link, useLocation } from 'react-router-dom';
import './App.css'
import { Button } from './components/ui/button'
import { Home, Monitor, Settings } from 'lucide-react';
export default function App() {
  var location = useLocation();
  return (
    <div className='flex min-h-screen bg-slate-100 p-4 gap-4 overflow-hidden'>
      {/*左侧导航栏 */}
      <aside className = "w-64 bg-slate-900 text-white p-4 shrink-0 rounded-xl shadow-sm flex flex-col">
        <h2 className='text-xl font-bold mb-8 pl-2'>Anime</h2>
        <nav className='flex flex-col gap-2'>
          {/**首页导航按钮 */}
          <Button
            variant={location.pathname === '/' ? 'secondary' : 'ghost'}
            className='justify-start w-full text-bass'
            asChild
          >
            <Link to = '/'><Home className="mr-2 size-5" /> 首页</Link>
          </Button>
          {/**动漫页导航按钮 */}
          <Button 
            variant={location.pathname.startsWith('/monitor') ? 'secondary' : 'ghost'} 
            className="justify-start w-full text-base" 
            asChild
          ><Link to = '/monitor'><Monitor className='mr-2 size-5'></Monitor>动漫管理</Link>
          </Button>
          
        </nav>
      </aside>
      {/*右边主内容页 */}
      <main className='flex-1 bg-slate-50 p-6 rounded-xl shadow-sm overflow-y-auto'>
        <Outlet/>{/**为跳转页面占位 */}
      </main>
    </div>
  );
}
