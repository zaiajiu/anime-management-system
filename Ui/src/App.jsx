import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Button } from "#/components/ui/button"
import { SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar"
import { AppSidebar } from "#/components/app-sidebar"
import { Outlet } from "react-router-dom"

import { Toaster } from '@/components/ui/sonner'; // ★ 引入
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {<>
        <SidebarProvider open={false} onOpenChange={() => {}}>
            <AppSidebar />
            <main className="flex-1 p-4">
              <Outlet />   {/* 页面在这里渲染 */}
            </main>
            <Toaster richColors position="top-center" />
          </SidebarProvider>
  
      </>}
    </>
    
  )
}

export default App
