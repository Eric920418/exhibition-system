'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import MobileNav from './MobileNav'
import { UserRole } from '@prisma/client'

interface AdminLayoutClientProps {
  children: React.ReactNode
  userRole: UserRole
}

export default function AdminLayoutClient({ children, userRole }: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 監聽 localStorage 變化
  useEffect(() => {
    const checkSidebar = () => {
      const saved = localStorage.getItem('sidebarCollapsed')
      setIsCollapsed(saved === 'true')
    }

    // 初始檢查
    checkSidebar()

    // 監聯 storage 事件（跨分頁同步）
    window.addEventListener('storage', checkSidebar)

    // 定期檢查（處理同一分頁的變化）
    const interval = setInterval(checkSidebar, 100)

    return () => {
      window.removeEventListener('storage', checkSidebar)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex">
      {/* 桌面版側邊欄 */}
      <AdminSidebar userRole={userRole} />

      {/* 移動端導航 */}
      <MobileNav userRole={userRole} />

      {/* 主要內容區域 - 響應式邊距 */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'md:ml-16' : 'md:ml-64'
        } ml-0`}
      >
        {children}
      </main>
    </div>
  )
}
