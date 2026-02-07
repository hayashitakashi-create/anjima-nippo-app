'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { VisitRecordInput } from '@/lib/types'
import { Home, Settings, LogOut, Building2, Shield, CheckCircle, XCircle, Clock, Trash2, Printer } from 'lucide-react'

// CSSアニメーション定義用のスタイル
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.8);
    }
  }
`

interface User {
  id: string
  name: string
  position?: string
  role: string
  defaultReportType: string
}

export default function EditNippoPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')
  const [showCharacter, setShowCharacter] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approvals, setApprovals] = useState<Array<{
    id: string
    approverRole: string
    status: string
    approverUserId?: string
    approvedAt?: string
    approver?: { name: string; position?: string }
  }>>([])

  const [formData, setFormData] = useState({
    date: '',
    userId: '',
    specialNotes: '',
  })

  const [visitRecords, setVisitRecords] = useState<VisitRecordInput[]>([
    { destination: '', contactPerson: '', startTime: '08:00', endTime: '09:00', content: '', expense: undefined, order: 0 }
  ])

  // 30分刻みの時刻オプションを生成（絶対に必要）
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        options.push(timeStr)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // ログインユーザーと既存日報データを取得
  useEffect(() => {
    // ユーザー情報取得
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user)
          setFormData(prev => ({ ...prev, userId: data.user.id }))
          setReportType(data.user.defaultReportType === 'sales' ? 'sales' : 'work')
        }
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // 既存日報データを取得
    fetch(`/api/nippo/${reportId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('日報の取得に失敗しました')
        }
        return res.json()
      })
      .then(data => {
        // 日付をYYYY-MM-DD形式に変換
        const dateObj = new Date(data.date)
        const formattedDate = dateObj.toISOString().split('T')[0]

        setFormData({
          date: formattedDate,
          userId: data.userId,
          specialNotes: data.specialNotes || '',
        })

        // 訪問記録を設定
        const loadedRecords = data.visitRecords.map((record: any, index: number) => ({
          destination: record.destination || '',
          contactPerson: record.contactPerson || '',
          startTime: record.startTime || '08:00',
          endTime: record.endTime || '',
          content: record.content || '',
          expense: record.expense,
          order: index
        }))

        // 最低1行を確保
        if (loadedRecords.length === 0) {
          loadedRecords.push({
            destination: '',
            contactPerson: '',
            startTime: '08:00',
            endTime: '09:00',
            content: '',
            expense: undefined,
            order: 0
          })
        }

        setVisitRecords(loadedRecords)

        // 承認情報を設定
        if (data.approvals) {
          setApprovals(data.approvals)
        }
      })
      .catch(error => {
        console.error('日報取得エラー:', error)
        alert('日報の取得に失敗しました')
        router.push('/nippo')
      })
  }, [router, reportId])

  // 訪問記録を追加
  const addVisitRecord = () => {
    if (visitRecords.length < 16) {
      setVisitRecords([
        ...visitRecords,
        { destination: '', contactPerson: '', startTime: '08:00', endTime: '09:00', content: '', expense: undefined, order: visitRecords.length }
      ])
    }
  }

  // 開始時刻が変更されたら終了時刻を1時間後に設定
  const handleStartTimeChange = (index: number, startTime: string) => {
    updateVisitRecord(index, 'startTime', startTime)

    // 終了時刻を1時間後に設定
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const endHours = (hours + 1) % 24
      const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      updateVisitRecord(index, 'endTime', endTime)
    }
  }

  // 訪問記録を削除
  const removeVisitRecord = (index: number) => {
    const newRecords = visitRecords.filter((_, i) => i !== index)
    setVisitRecords(newRecords.map((record, i) => ({ ...record, order: i })))
  }

  // 訪問記録を更新
  const updateVisitRecord = (index: number, field: keyof VisitRecordInput, value: any) => {
    const newRecords = [...visitRecords]
    newRecords[index] = { ...newRecords[index], [field]: value }
    setVisitRecords(newRecords)
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/nippo/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          visitRecords: visitRecords.filter(record => record.destination.trim() !== ''),
        }),
      })

      if (!response.ok) {
        throw new Error('日報の更新に失敗しました')
      }

      // キャラクター表示
      setShowCharacter(true)

      // 3秒後にキャラクターを非表示にしてリダイレクト
      setTimeout(() => {
        setShowCharacter(false)
        // 一覧ページにリダイレクト
        setTimeout(() => {
          router.push('/nippo')
        }, 500) // フェードアウト完了後にリダイレクト
      }, 3000)
    } catch (error) {
      console.error('送信エラー:', error)
      alert('日報の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const reportTypeName = reportType === 'sales' ? '営業日報' : '作業日報'

  const handleBackButton = () => {
    router.push('/nippo')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleSettings = () => {
    router.push('/settings')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/nippo/${reportId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }
      router.push('/nippo')
    } catch (error: any) {
      console.error('削除エラー:', error)
      alert(error.message || '日報の削除に失敗しました')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50 relative">
        {/* キャラクター表示 */}
      {showCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-500"
          style={{
            animation: showCharacter ? 'fadeIn 0.5s ease-in' : 'fadeOut 0.5s ease-out'
          }}
        >
          <div className="animate-bounce">
            <img
              src="/images/character.png"
              alt="保存完了"
              className="w-64 h-64 object-contain"
              style={{
                animation: 'fadeIn 0.5s ease-in'
              }}
            />
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              日報を削除しますか？
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              この操作は取り消せません。訪問記録や承認情報も全て削除されます。
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{reportTypeName}編集</h1>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              {currentUser?.role === 'admin' && (
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
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white shadow rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-normal text-gray-600 mb-2">
                  日付
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-600 mb-2">
                  氏名
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  {currentUser ? (
                    <span className="text-gray-900 text-base">
                      {currentUser.name} {currentUser.position ? `(${currentUser.position})` : ''}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-base">読み込み中...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 訪問記録 */}
          <div className="bg-white shadow rounded-lg p-8">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">訪問記録</h2>
            </div>

            <div className="space-y-8">
              {visitRecords.map((record, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5 relative">
                  {visitRecords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVisitRecord(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-2">
                        訪問先 <span className="text-red-500">★</span>
                      </label>
                      <input
                        type="text"
                        value={record.destination}
                        onChange={(e) => updateVisitRecord(index, 'destination', e.target.value)}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例: ○○株式会社"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-normal text-gray-600 mb-2">
                          面接者ご氏名
                        </label>
                        <input
                          type="text"
                          value={record.contactPerson || ''}
                          onChange={(e) => updateVisitRecord(index, 'contactPerson', e.target.value)}
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 田中 太郎様"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-normal text-gray-600 mb-2">
                            作業開始時刻
                          </label>
                          <select
                            value={record.startTime || '08:00'}
                            onChange={(e) => handleStartTimeChange(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{
                              fontSize: '22px',
                              padding: '18px 16px',
                              minHeight: '64px',
                              lineHeight: '1.2'
                            }}
                          >
                            {timeOptions.map(time => (
                              <option
                                key={time}
                                value={time}
                                style={{
                                  fontSize: '22px',
                                  padding: '16px',
                                  minHeight: '56px',
                                  lineHeight: '2'
                                }}
                              >
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-normal text-gray-600 mb-2">
                            作業終了時刻
                          </label>
                          <select
                            value={record.endTime || '09:00'}
                            onChange={(e) => updateVisitRecord(index, 'endTime', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{
                              fontSize: '22px',
                              padding: '18px 16px',
                              minHeight: '64px',
                              lineHeight: '1.2'
                            }}
                          >
                            {timeOptions.map(time => (
                              <option
                                key={time}
                                value={time}
                                style={{
                                  fontSize: '22px',
                                  padding: '16px',
                                  minHeight: '56px',
                                  lineHeight: '2'
                                }}
                              >
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-2">
                        営業内容
                      </label>
                      <textarea
                        value={record.content || ''}
                        onChange={(e) => updateVisitRecord(index, 'content', e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="訪問の目的や商談内容を記入してください"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">{(record.content || '').length} / 500文字</div>
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-2">
                        支出経費（円）
                      </label>
                      <input
                        type="number"
                        value={record.expense || ''}
                        onChange={(e) => updateVisitRecord(index, 'expense', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 特記事項 */}
          <div className="bg-white shadow rounded-lg p-8">
            <label className="block text-xs font-normal text-gray-600 mb-2">
              連絡事項・備考
            </label>
            <textarea
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="その他の連絡事項・特記事項など"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">{(formData.specialNotes || '').length} / 500文字</div>
          </div>

          {/* 承認ステータス */}
          {approvals.length > 0 && (
            <div className="bg-white shadow rounded-lg p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">承認状況</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {approvals.map((approval) => {
                  const roleLabels: Record<string, string> = {
                    president: '社長',
                    executive_vice_president: '専務',
                    managing_director: '常務',
                    department_manager: '部長',
                  }
                  const roleLabel = roleLabels[approval.approverRole] || approval.approverRole

                  let statusIcon, statusLabel, statusStyle
                  switch (approval.status) {
                    case 'approved':
                      statusIcon = <CheckCircle className="w-5 h-5 text-green-500" />
                      statusLabel = '承認済み'
                      statusStyle = 'bg-green-50 border-green-200 text-green-800'
                      break
                    case 'rejected':
                      statusIcon = <XCircle className="w-5 h-5 text-red-500" />
                      statusLabel = '差戻し'
                      statusStyle = 'bg-red-50 border-red-200 text-red-800'
                      break
                    default:
                      statusIcon = <Clock className="w-5 h-5 text-yellow-500" />
                      statusLabel = '承認待ち'
                      statusStyle = 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }

                  return (
                    <div
                      key={approval.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${statusStyle}`}
                    >
                      <div className="flex items-center space-x-3">
                        {statusIcon}
                        <div>
                          <div className="font-medium">{roleLabel}</div>
                          {approval.approver && (
                            <div className="text-xs opacity-75">
                              {approval.approver.name}
                              {approval.approvedAt && (
                                <span className="ml-2">
                                  ({new Date(approval.approvedAt).toLocaleDateString('ja-JP')})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium">{statusLabel}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* フッター */}
          <div className="bg-white shadow rounded-lg p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/nippo/${reportId}/print`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  印刷 / PDF
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
              <div className="space-x-4">
                <button
                  type="button"
                  onClick={handleBackButton}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '更新中...' : '更新'}
                </button>
                <button
                  type="button"
                  onClick={addVisitRecord}
                  disabled={visitRecords.length >= 16}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg text-base font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  + 訪問記録を追加
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
      </div>
    </>
  )
}
