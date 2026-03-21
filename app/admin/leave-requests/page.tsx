'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  LogOut,
  Shield,
  Palmtree,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Download,
  X,
  Trash2,
  AlertTriangle,
  Check,
  XCircle,
  CheckCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
  permissions?: Record<string, boolean>
}

interface LeaveRequest {
  id: string
  userId: string
  userName?: string
  date: string
  leaveType: string
  reason: string | null
  attachmentName: string | null
  attachmentType: string | null
  status: string
  createdAt: string
}

const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  '有給': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '振替': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '代休': { bg: 'bg-teal-100', text: 'text-teal-800' },
  '看護': { bg: 'bg-pink-100', text: 'text-pink-800' },
  '介護': { bg: 'bg-orange-100', text: 'text-orange-800' },
  '特別休暇': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'その他': { bg: 'bg-gray-100', text: 'text-gray-800' },
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          承認待ち
        </span>
      )
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          承認済み
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          差戻し
        </span>
      )
    default:
      return <span className="text-xs text-gray-500">{status}</span>
  }
}

export default function AdminLeaveRequestsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          if (!data.user.permissions?.view_all_reports) {
            router.push('/dashboard')
            return
          }
          setCurrentUser(data.user)
          fetch('/api/admin/users')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (d?.users) {
                setAllUsers(d.users.filter((u: any) => u.isActive !== false).map((u: any) => ({ id: u.id, name: u.name })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'ja')))
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    fetchLeaveRequests()
  }, [currentUser, month])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leave-requests?all=true&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setLeaveRequests(data.leaveRequests)
      }
    } catch (err) {
      console.error('休暇届取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    setSelectedIds(new Set())
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leave-requests/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setLeaveRequests(prev => prev.filter(l => l.id !== deleteTarget.id))
        setDeleteTarget(null)
        setMessage('休暇届を削除しました')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
        setDeleteTarget(null)
      }
    } catch {
      setError('削除に失敗しました')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // 個別承認/差戻し
  const handleApproval = async (leaveRequestId: string, action: 'approve' | 'reject') => {
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/admin/leave-approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequestId, action }),
      })
      if (res.ok) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        setLeaveRequests(prev => prev.map(l => l.id === leaveRequestId ? { ...l, status: newStatus } : l))
        setSelectedIds(prev => { const next = new Set(prev); next.delete(leaveRequestId); return next })
        setMessage(action === 'approve' ? '承認しました' : '差し戻しました')
        if (selectedRequest?.id === leaveRequestId) {
          setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null)
        }
      } else {
        const data = await res.json()
        setError(data.error || '処理に失敗しました')
      }
    } catch {
      setError('処理に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  // 一括承認/差戻し
  const handleBulkApproval = async (action: 'bulk_approve' | 'bulk_reject') => {
    if (selectedIds.size === 0) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/admin/leave-approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequestIds: Array.from(selectedIds), action }),
      })
      if (res.ok) {
        const data = await res.json()
        const newStatus = action === 'bulk_approve' ? 'approved' : 'rejected'
        setLeaveRequests(prev => prev.map(l => selectedIds.has(l.id) ? { ...l, status: newStatus } : l))
        setSelectedIds(new Set())
        setMessage(action === 'bulk_approve' ? `${data.count}件を承認しました` : `${data.count}件を差し戻しました`)
      } else {
        const data = await res.json()
        setError(data.error || '処理に失敗しました')
      }
    } catch {
      setError('処理に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(l => {
      if (nameFilter && (l.userName || '') !== nameFilter) return false
      if (typeFilter && l.leaveType !== typeFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      return true
    })
  }, [leaveRequests, nameFilter, typeFilter, statusFilter])

  // 承認待ちの件だけチェックボックス対象
  const pendingInFiltered = useMemo(() => filteredRequests.filter(l => l.status === 'pending'), [filteredRequests])

  const allPendingSelected = pendingInFiltered.length > 0 && pendingInFiltered.every(l => selectedIds.has(l.id))

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingInFiltered.map(l => l.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ステータス別カウント
  const statusCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 }
    leaveRequests.forEach(l => {
      counts.all++
      if (l.status === 'pending') counts.pending++
      else if (l.status === 'approved') counts.approved++
      else if (l.status === 'rejected') counts.rejected++
    })
    return counts
  }, [leaveRequests])

  // 種別ごとの件数集計
  const typeCounts: Record<string, number> = {}
  leaveRequests.forEach(l => {
    typeCounts[l.leaveType] = (typeCounts[l.leaveType] || 0) + 1
  })

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
    catch (err) { console.error('ログアウトエラー:', err) }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`
  }

  const [y, m] = month.split('-').map(Number)
  const monthLabel = `${y}年${m}月`

  const canApprove = currentUser?.permissions?.approve_reports

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-600 flex items-center justify-center">
                <Palmtree className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">休暇届管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">全社員の休暇届</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/admin" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="管理画面">
                <Shield className="h-5 w-5" />
              </Link>
              <Link href="/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="TOP画面">
                <Home className="h-5 w-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ログアウト">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ステータスフィルタタブ */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          {([
            { key: 'all' as StatusFilter, label: '全て', count: statusCounts.all },
            { key: 'pending' as StatusFilter, label: '承認待ち', count: statusCounts.pending },
            { key: 'approved' as StatusFilter, label: '承認済み', count: statusCounts.approved },
            { key: 'rejected' as StatusFilter, label: '差戻し', count: statusCounts.rejected },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setSelectedIds(new Set()) }}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab.key === 'pending' && tab.count > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 月選択 + フィルタ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* 月ナビ */}
            <div className="flex items-center space-x-3">
              <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 min-w-[120px] text-center">{monthLabel}</h2>
              <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-500 ml-2">{filteredRequests.length}件</span>
            </div>

            {/* フィルタ */}
            <div className="flex items-center space-x-2">
              <select
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">全社員</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                <option value="">全種別</option>
                {Object.keys(LEAVE_TYPE_COLORS).map(t => (
                  <option key={t} value={t}>{t}{typeCounts[t] ? ` (${typeCounts[t]})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 種別サマリ */}
          {leaveRequests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const colors = LEAVE_TYPE_COLORS[type] || LEAVE_TYPE_COLORS['その他']
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      typeFilter === type ? 'ring-2 ring-offset-1 ring-green-500' : ''
                    } ${colors.bg} ${colors.text}`}
                  >
                    {type}: {count}件
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 一括操作バー */}
        {selectedIds.size > 0 && canApprove && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size}件選択中
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkApproval('bulk_approve')}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                一括承認
              </button>
              <button
                onClick={() => handleBulkApproval('bulk_reject')}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                一括差戻し
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                選択解除
              </button>
            </div>
          </div>
        )}

        {/* テーブル */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">読み込み中...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {leaveRequests.length === 0 ? `${monthLabel}の休暇届はありません` : '該当する休暇届がありません'}
            </div>
          ) : (
            <>
              {/* PC */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-slate-200">
                    <tr>
                      {canApprove && pendingInFiltered.length > 0 && (
                        <th className="px-3 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allPendingSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">添付</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ステータス</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map(lr => {
                      const colors = LEAVE_TYPE_COLORS[lr.leaveType] || LEAVE_TYPE_COLORS['その他']
                      const isPending = lr.status === 'pending'
                      return (
                        <tr key={lr.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${isPending ? 'bg-yellow-50/30' : ''}`} onClick={() => setSelectedRequest(lr)}>
                          {canApprove && pendingInFiltered.length > 0 && (
                            <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                              {isPending ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(lr.id)}
                                  onChange={() => toggleSelect(lr.id)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              ) : (
                                <span />
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(lr.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {lr.userName || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {lr.leaveType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {lr.reason || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {lr.attachmentName ? (
                              <span className="inline-flex items-center text-xs text-blue-600">
                                <Paperclip className="w-3.5 h-3.5 mr-1" />
                                {lr.attachmentName.length > 15 ? lr.attachmentName.slice(0, 15) + '...' : lr.attachmentName}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <StatusBadge status={lr.status} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1">
                              {isPending && canApprove && (
                                <>
                                  <button
                                    onClick={() => handleApproval(lr.id, 'approve')}
                                    disabled={processing}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="承認"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApproval(lr.id, 'reject')}
                                    disabled={processing}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="差戻し"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setDeleteTarget(lr)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* モバイル */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredRequests.map(lr => {
                  const colors = LEAVE_TYPE_COLORS[lr.leaveType] || LEAVE_TYPE_COLORS['その他']
                  const isPending = lr.status === 'pending'
                  return (
                    <div key={lr.id} className={`p-4 cursor-pointer active:bg-gray-50 ${isPending ? 'bg-yellow-50/30' : ''}`} onClick={() => setSelectedRequest(lr)}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-start space-x-2">
                          {isPending && canApprove && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(lr.id)}
                              onChange={() => toggleSelect(lr.id)}
                              onClick={e => e.stopPropagation()}
                              className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{formatDate(lr.date)}</p>
                            <p className="text-sm text-gray-700">{lr.userName || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {lr.leaveType}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge status={lr.status} />
                        <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                          {isPending && canApprove && (
                            <>
                              <button
                                onClick={() => handleApproval(lr.id, 'approve')}
                                disabled={processing}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                                title="承認"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproval(lr.id, 'reject')}
                                disabled={processing}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="差戻し"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteTarget(lr)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {lr.reason && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{lr.reason}</p>}
                      {lr.attachmentName && (
                        <span className="inline-flex items-center text-xs text-blue-600 mt-1">
                          <Paperclip className="w-3 h-3 mr-1" />
                          {lr.attachmentName}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* 詳細モーダル */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">休暇届詳細</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">氏名</p>
                  <p className="text-sm font-medium text-gray-900">{selectedRequest.userName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">日付</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">休暇種別</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(LEAVE_TYPE_COLORS[selectedRequest.leaveType] || LEAVE_TYPE_COLORS['その他']).bg} ${(LEAVE_TYPE_COLORS[selectedRequest.leaveType] || LEAVE_TYPE_COLORS['その他']).text}`}>
                    {selectedRequest.leaveType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">ステータス</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">理由</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 min-h-[48px]">
                  {selectedRequest.reason || '記載なし'}
                </p>
              </div>
              {selectedRequest.attachmentName && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">添付ファイル</p>
                  <a
                    href={`/api/leave-requests/${selectedRequest.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {selectedRequest.attachmentName}
                    <Download className="w-3.5 h-3.5 ml-2" />
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
              <div className="flex items-center space-x-2">
                {selectedRequest.status === 'pending' && canApprove && (
                  <>
                    <button
                      onClick={() => handleApproval(selectedRequest.id, 'approve')}
                      disabled={processing}
                      className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors inline-flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      承認
                    </button>
                    <button
                      onClick={() => handleApproval(selectedRequest.id, 'reject')}
                      disabled={processing}
                      className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors inline-flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      差戻し
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setDeleteTarget(selectedRequest); setSelectedRequest(null) }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors inline-flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  削除
                </button>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">休暇届削除</h3>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deleteTarget.userName}</span>の
                {formatDate(deleteTarget.date)}の{deleteTarget.leaveType}を削除しますか？
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                キャンセル
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
