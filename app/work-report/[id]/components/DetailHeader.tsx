'use client'

import Link from 'next/link'
import { FileText, Home, Shield, Settings, LogOut } from 'lucide-react'

interface CurrentUser {
  permissions?: { manage_users?: boolean } | null
}

interface Props {
  isEditing: boolean
  currentUser: CurrentUser | null
  onLogout: () => void
}

export function DetailHeader({ isEditing, currentUser, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
              {isEditing ? '作業日報 編集' : '作業日報 詳細'}
            </h1>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/dashboard"
              className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors"
              title="TOP画面"
            >
              <Home className="h-5 w-5" />
            </Link>
            {currentUser?.permissions?.manage_users && (
              <Link
                href="/admin"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="管理画面"
              >
                <Shield className="h-5 w-5" />
              </Link>
            )}
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
