import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Home, Settings,createIcons, Monitor,User} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
const items = [
  { title: "个人中心", url: "/profile", icon: User },
  { title: "首页", url: "/", icon: Home },
  { title: "动漫", url: "/monitor", icon: Monitor },
  { title: "设置", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  
                    <Link to={item.url}>
                      <item.icon />
                      
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}