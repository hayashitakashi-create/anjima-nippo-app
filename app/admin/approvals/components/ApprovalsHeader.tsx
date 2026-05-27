'use client'

import Link from 'next/link'
import { Home, Settings, LogOut, Shield } from 'lucide-react'

interface Props {
  onLogout: () => void
}

export function ApprovalsHeader({ onLogout }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">承認管理</h1>
              <p className="text-xs text-gray-500 hidden sm:block">営業日報・作業日報の承認・差戻し</p>
            </div>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/dashboard"
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="TOP画面"
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              href="/admin"
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="管理画面"
            >
              <Shield className="h-5 w-5" />
            </Link>
            <Link
              href="/settings"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="設定"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={onLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="ログアウト"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
