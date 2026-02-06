'use client'

/**
 * 改善版：訪問記録入力画面（モダンデザイン）
 *
 * 構造:
 * 1. 上部固定情報（日付・氏名）
 * 2. 訪問記録ブロック（複数対応可能）
 * 3. 全体バリデーション
 * 4. 将来の拡張性を考慮した設計
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  Calendar,
  User,
  Building2,
  Clock,
  MessageSquare,
  Plus,
  Save,
  X,
  AlertCircle,
  LogOut,
  ArrowLeft
} from 'lucide-react'
import VisitRecordCard, { VisitRecordData } from '@/components/VisitRecordCard'
import { useVisitRecordValidation } from '@/hooks/useVisitRecordValidation'

interface User {
  id: string
  name: string
  position?: string
  role: string
  defaultReportType: string
}

export default function ImprovedNippoPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // フォームデータ
  const [date, setDate] = useState('')
  const [userName, setUserName] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [visitRecords, setVisitRecords] = useState<VisitRecordData[]>([
    {
      id: '1',
      destination: '',
      contactPerson: '',
      startTime: '08:00',
      endTime: '09:00',
      content: '',
      expense: 0
    }
  ])

  // バリデーション
  const { errors, isValid, errorCount } = useVisitRecordValidation({
    date,
    visitRecords
  })

  // 初期化
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
          setUserName(data.user.name)
        }
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // 今日の日付をデフォルトに設定
    const today = new Date()
    const formatted = today.toISOString().split('T')[0]
    setDate(formatted)
  }, [router])

  // 訪問記録の変更
  const handleVisitRecordChange = (id: string, data: Partial<VisitRecordData>) => {
    setVisitRecords(prev => {
      // 変更されたレコードを更新
      const updatedRecords = prev.map(record =>
        record.id === id ? { ...record, ...data } : record
      )

      // 終了時刻が変更された場合、次の訪問記録の開始時刻を自動更新
      if (data.endTime) {
        const currentIndex = updatedRecords.findIndex(r => r.id === id)
        if (currentIndex !== -1 && currentIndex < updatedRecords.length - 1) {
          // 次の訪問記録の開始時刻を現在の終了時刻に設定
          updatedRecords[currentIndex + 1].startTime = data.endTime
        }
      }

      return updatedRecords
    })
  }

  // 訪問記録の削除
  const handleVisitRecordDelete = (id: string) => {
    setVisitRecords(prev => prev.filter(record => record.id !== id))
  }

  // 訪問記録の追加
  const handleAddVisitRecord = () => {
    const newId = (Math.max(...visitRecords.map(r => parseInt(r.id))) + 1).toString()
    // 最後の訪問記録の終了時間を取得
    const lastRecord = visitRecords[visitRecords.length - 1]
    const newStartTime = lastRecord?.endTime || '08:00'
    // 終了時間は開始時間の1時間後（30分刻みなので、1時間後にする）
    const [startHour, startMin] = newStartTime.split(':').map(Number)
    const endMinutes = startHour * 60 + startMin + 60 // 1時間後
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const newEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

    setVisitRecords(prev => [
      ...prev,
      {
        id: newId,
        destination: '',
        contactPerson: '',
        startTime: newStartTime,
        endTime: newEndTime,
        content: '',
        expense: 0
      }
    ])
  }

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      alert(`入力内容にエラーがあります（${errorCount}件）\n各フィールドを確認してください`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/nippo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(date),
          userId: currentUser?.id,
          specialNotes,
          visitRecords: visitRecords.map((record, index) => ({
            destination: record.destination,
            contactPerson: record.contactPerson,
            startTime: record.startTime,
            endTime: record.endTime,
            content: record.content,
            expense: record.expense,
            order: index
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('日報の作成に失敗しました')
      }

      // 成功ダイアログを表示
      setShowSuccessDialog(true)
    } catch (error) {
      console.error('送信エラー:', error)
      alert('日報の作成に失敗しました')
    } finally {
      setLoading(false)
    }
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

  const handleBack = () => {
    router.push('/nippo')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="text-center">
              {/* キャラクター画像エリア - 完全に独立 */}
              <div className="bg-gradient-to-b from-blue-50 to-white px-8 pt-6 pb-8">
                <div className="mx-auto relative w-40 h-40">
                  <Image
                    src="/character.png"
                    alt="保存完了キャラクター"
                    width={160}
                    height={160}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              {/* メッセージとボタンエリア - 完全に下部 */}
              <div className="bg-white px-6 pt-2 pb-6">
                <div className="bg-blue-600 rounded-lg p-2 mb-4">
                  <p className="text-sm text-white font-medium">日報が正常に保存されました</p>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessDialog(false)
                    router.push('/nippo')
                  }}
                  className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">営業日報</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
              >
                <Building2 className="w-4 h-4" />
                <span>TOP画面</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
              <button
                onClick={handleBack}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* エラー表示 */}
          {!isValid && errorCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">入力内容にエラーがあります</h3>
                  <p className="text-sm text-red-700 mt-1">{errorCount}件のエラーを修正してください</p>
                </div>
              </div>
            </div>
          )}

          {/* 基本情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            {/* カードヘッダー */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-lg border-b">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>
              </div>
              <p className="text-sm text-gray-600">日報の基本情報を入力してください</p>
            </div>

            {/* カードボディ */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 日付 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>日付</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                  {errors.date && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* 氏名 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>氏名</span>
                  </label>
                  <div className="w-full px-4 py-3 text-lg border border-gray-200 rounded-lg bg-gray-50">
                    {currentUser ? (
                      <span className="text-gray-900">
                        {currentUser.name} {currentUser.position ? `(${currentUser.position})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">読み込み中...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* 訪問記録リスト */}
            <div className="space-y-4">
              {visitRecords.map((record, index) => (
                <VisitRecordCard
                  key={record.id}
                  index={index}
                  data={record}
                  onChange={handleVisitRecordChange}
                  onDelete={handleVisitRecordDelete}
                  showDelete={index > 0}
                  errors={errors.visitRecords[record.id]}
                />
              ))}
            </div>

          {/* 訪問記録追加ボタン */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleAddVisitRecord}
              disabled={visitRecords.length >= 10}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-md transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>訪問記録を追加</span>
            </button>
          </div>

          {/* 連絡事項・備考カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow">
            {/* カードヘッダー */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 rounded-t-lg border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">連絡事項・備考</h2>
              </div>
            </div>

            {/* カードボディ */}
            <div className="p-6">
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all"
                placeholder="その他の連絡事項・特記事項などを入力してください"
              />
              <div className="text-sm text-gray-500 mt-2 text-right">
                {specialNotes.length} / 500文字
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* 保存ボタン */}
              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full sm:w-auto order-1 sm:order-none inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? '保存中...' : '保存'}</span>
              </button>

              {/* キャンセルボタン */}
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto order-2 sm:order-none inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-lg font-bold transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
                <span>キャンセル</span>
              </button>

              {/* 会社名 */}
              <div className="order-3 sm:order-none">
                <p className="text-sm text-gray-600 font-medium whitespace-nowrap">安島工業株式会社</p>
              </div>
            </div>
          </div>
        </form>
        </main>
    </div>
  )
}
