'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import GlobalSearch from './GlobalSearch'

interface AdminHeaderProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* 左側空間 - 移動端為漢堡選單預留 */}
        <div className="flex items-center space-x-4">
          <div className="w-10 md:hidden" /> {/* 移動端漢堡選單佔位 */}
          <h1 className="text-lg md:text-xl font-bold text-gray-800 hidden sm:block">展覽管理系統</h1>
          <span className="text-sm text-gray-500 hidden md:block">
            {user.role === 'SUPER_ADMIN' ? '超級管理員' :
             user.role === 'CURATOR' ? '策展人' : '組長'}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* 全局搜尋 */}
          <GlobalSearch />
          {/* 通知鈴鐺 */}
          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg hover:bg-gray-50"
            >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
            <svg className="hidden sm:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1 sm:hidden">
                  {user.role === 'SUPER_ADMIN' ? '超級管理員' :
                   user.role === 'CURATOR' ? '策展人' : '組長'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                登出
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}