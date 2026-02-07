'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  BellOff,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Clock,
  Filter,
  Trash2,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchNotifications = async () => {
    try {
      const unreadOnly = filter === 'unread' ? '&unreadOnly=true' : ''
      const res = await fetch(`/api/notifications?limit=100${unreadOnly}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('取得失敗')
      }
      const data = await res.json()
      let items = data.notifications || []
      if (filter === 'read') {
        items = items.filter((n: Notification) => n.isRead)
      }
      setNotifications(items)
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('通知取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('既読エラー:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('全件既読エラー:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_submitted':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'report_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case 'report_rejected':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'reminder':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white'
    switch (type) {
      case 'report_submitted':
        return 'bg-blue-50'
      case 'report_approved':
        return 'bg-emerald-50'
      case 'report_rejected':
        return 'bg-red-50'
      case 'reminder':
        return 'bg-orange-50'
      default:
        return 'bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'たった今'
    if (diffMin < 60) return `${diffMin}分前`
    if (diffHour < 24) return `${diffHour}時間前`
    if (diffDay < 7) return `${diffDay}日前`
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600"
        >
          読み込み中...
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#0E3091]" />
                <h1 className="text-lg font-bold text-gray-900">通知</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>全て既読</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* フィルタータブ */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {([
            { key: 'all', label: '全て' },
            { key: 'unread', label: '未読' },
            { key: 'read', label: '既読' },
          ] as { key: FilterType; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 通知一覧 */}
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-1">
              {filter === 'unread' ? '未読の通知はありません' : filter === 'read' ? '既読の通知はありません' : '通知はありません'}
            </p>
            <p className="text-gray-400 text-sm">
              日報の提出・承認時に通知が届きます
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative rounded-xl border transition-all cursor-pointer group ${
                    getNotificationBg(notification.type, notification.isRead)
                  } ${
                    notification.isRead
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-blue-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* 未読ドット + アイコン */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        {!notification.isRead && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* コンテンツ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-semibold ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm mt-0.5 ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.linkUrl && (
                          <p className="text-xs text-[#0E3091] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            クリックして詳細を確認 →
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
