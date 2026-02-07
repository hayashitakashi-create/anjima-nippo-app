'use client'

/**
 * 作業日報 詳細・編集画面
 *
 * 構造:
 * 1. 上部固定情報（日付・氏名・工事情報）
 * 2. 作業者記録ブロック（最大11件）
 * 3. 使用材料・消耗品ブロック（最大5件）
 * 4. 外注先ブロック（最大10件）
 * 5. 遠隔地・交通誘導警備員情報
 * 6. 連絡事項
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  LogOut,
  Trash2,
  Users,
  Package,
  Briefcase,
  Home,
  Settings,
  Shield,
  Edit3,
  ArrowLeft,
  Printer
} from 'lucide-react'

interface CurrentUser {
  id: string
  name: string
  position?: string
  role: string
}

interface WorkerRecord {
  id: string
  name: string
  startTime: string
  endTime: string
  manHours: number
  workType: string
  details: string
  dailyHours: number
  totalHours: number
}

interface MaterialRecord {
  id: string
  name: string
  volume: string
  volumeUnit: string
  quantity: number
  unitPrice: number
  subcontractor: string
}

interface SubcontractorRecord {
  id: string
  name: string
  workerCount: number
  workContent: string
}

// マスタデータ
const PROJECT_TYPES = [
  '建築塗装工事',
  '鋼橋塗装工事',
  '防水工事',
  '建築工事',
  '区画線工事',
  'とび土工工事'
]

const WORKER_NAMES = [
  '古藤　英紀', '矢野　誠', '山内　正和', '大塚　崇', '中原　稔', '三嶋　晶',
  '伊藤　勝', '古曳　正樹', '松本　太', '佐野　弘和', '満田　純一', '齊藤　慰丈',
  '井原　晃', '松本　誠', '加藤　光', '堀内　光雄', '梶谷　純', '金藤　恵子',
  '安島　圭介', '山﨑　伸一', '足立　憲吉', '福田　誠', '安島　隆', '金山　昭徳',
  '安島　篤志', '松本　倫典', '田邊　沙帆', '古川　一彦', '内田　邦男', '藤原　秀夫',
  '田中　剛士', '小林　敬博', '福代　司', '池野　大樹', '中谷　凜大', '安部　倫太朗'
]

const VOLUME_UNITS = ['ℓ', 'mℓ', 'm', '㎝']

const SUBCONTRACTORS = [
  'キョウワビルト工業', '広野組', '又川工業', '景山工業',
  '森下塗装', '鳥島工業', '岩佐塗装', '恒松塗装'
]

const WEATHER_OPTIONS = ['晴れ', '曇り', '晴れ後曇り', '曇り後晴れ', '雨', '雪']

// 30分刻みの時刻リストを生成
const generateTimeOptions = (): string[] => {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      options.push(timeStr)
    }
  }
  return options
}
const TIME_OPTIONS = generateTimeOptions()

export default function WorkReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 基本情報
  const [date, setDate] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projectRefId, setProjectRefId] = useState<string | null>(null)
  const [weather, setWeather] = useState('')
  const [createdUserName, setCreatedUserName] = useState('')

  // 作業者記録
  const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([])

  // 使用材料記録
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([])

  // 外注先記録
  const [subcontractorRecords, setSubcontractorRecords] = useState<SubcontractorRecord[]>([])

  // 遠隔地・交通誘導警備員情報
  const [remoteDepartureTime, setRemoteDepartureTime] = useState('')
  const [remoteArrivalTime, setRemoteArrivalTime] = useState('')
  const [remoteDepartureTime2, setRemoteDepartureTime2] = useState('')
  const [remoteArrivalTime2, setRemoteArrivalTime2] = useState('')
  const [trafficGuardCount, setTrafficGuardCount] = useState(0)
  const [trafficGuardStart, setTrafficGuardStart] = useState('')
  const [trafficGuardEnd, setTrafficGuardEnd] = useState('')

  // 連絡事項
  const [contactNotes, setContactNotes] = useState('')

  // 初期データ読み込み
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
        }
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // 作業日報データ取得
    fetch(`/api/work-report/${reportId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('作業日報の取得に失敗しました')
        }
        return res.json()
      })
      .then(data => {
        const dateObj = new Date(data.date)
        setDate(dateObj.toISOString().split('T')[0])
        setProjectName(data.projectName || '')
        setProjectType(data.projectType || '')
        setProjectId(data.projectId || '')
        setProjectRefId(data.projectRefId || null)
        setWeather(data.weather || '')
        setContactNotes(data.contactNotes || '')
        setRemoteDepartureTime(data.remoteDepartureTime || '')
        setRemoteArrivalTime(data.remoteArrivalTime || '')
        setRemoteDepartureTime2(data.remoteDepartureTime2 || '')
        setRemoteArrivalTime2(data.remoteArrivalTime2 || '')
        setTrafficGuardCount(data.trafficGuardCount || 0)
        setTrafficGuardStart(data.trafficGuardStart || '')
        setTrafficGuardEnd(data.trafficGuardEnd || '')

        // 作業者記録
        if (data.workerRecords && data.workerRecords.length > 0) {
          setWorkerRecords(data.workerRecords.map((r: any, i: number) => ({
            id: r.id || (i + 1).toString(),
            name: r.name || '',
            startTime: r.startTime || '08:00',
            endTime: r.endTime || '17:00',
            manHours: r.workHours || 0,
            workType: r.workType || '',
            details: r.details || '',
            dailyHours: r.dailyHours || 0,
            totalHours: r.totalHours || 0,
          })))
        }

        // 使用材料記録
        if (data.materialRecords && data.materialRecords.length > 0) {
          setMaterialRecords(data.materialRecords.map((r: any, i: number) => ({
            id: r.id || (i + 1).toString(),
            name: r.name || '',
            volume: r.volume || '',
            volumeUnit: r.volumeUnit || 'ℓ',
            quantity: r.quantity || 0,
            unitPrice: r.unitPrice || 0,
            subcontractor: r.subcontractor || '',
          })))
        }

        // 外注先記録
        if (data.subcontractorRecords && data.subcontractorRecords.length > 0) {
          setSubcontractorRecords(data.subcontractorRecords.map((r: any, i: number) => ({
            id: r.id || (i + 1).toString(),
            name: r.name || '',
            workerCount: r.workerCount || 0,
            workContent: r.workContent || '',
          })))
        }

        setLoading(false)
      })
      .catch(error => {
        console.error('作業日報取得エラー:', error)
        alert('作業日報の取得に失敗しました')
        router.push('/dashboard')
      })
  }, [router, reportId])

  // 作業者記録の追加
  const handleAddWorkerRecord = () => {
    if (workerRecords.length >= 11) {
      alert('作業者記録は最大11件までです')
      return
    }
    const newId = Date.now().toString()
    setWorkerRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        manHours: 0,
        workType: '',
        details: '',
        dailyHours: 0,
        totalHours: 0,
      }
    ])
  }

  const handleDeleteWorkerRecord = (id: string) => {
    if (workerRecords.length === 1) {
      alert('作業者記録は最低1件必要です')
      return
    }
    setWorkerRecords(prev => prev.filter(r => r.id !== id))
  }

  // 使用材料記録の追加
  const handleAddMaterialRecord = () => {
    if (materialRecords.length >= 5) {
      alert('使用材料記録は最大5件までです')
      return
    }
    const newId = Date.now().toString()
    setMaterialRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        volume: '',
        volumeUnit: 'ℓ',
        quantity: 0,
        unitPrice: 0,
        subcontractor: '',
      }
    ])
  }

  const handleDeleteMaterialRecord = (id: string) => {
    setMaterialRecords(prev => prev.filter(r => r.id !== id))
  }

  // 外注先記録の追加
  const handleAddSubcontractorRecord = () => {
    if (subcontractorRecords.length >= 10) {
      alert('外注先記録は最大10件までです')
      return
    }
    const newId = Date.now().toString()
    setSubcontractorRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        workerCount: 0,
        workContent: '',
      }
    ])
  }

  const handleDeleteSubcontractorRecord = (id: string) => {
    setSubcontractorRecords(prev => prev.filter(r => r.id !== id))
  }

  // 更新送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      alert('工事名を入力してください')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/work-report/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(date),
          userId: currentUser?.id,
          projectRefId: projectRefId || undefined,
          projectName,
          projectType,
          projectId,
          weather,
          contactNotes,
          remoteDepartureTime,
          remoteArrivalTime,
          remoteDepartureTime2,
          remoteArrivalTime2,
          trafficGuardCount,
          trafficGuardStart,
          trafficGuardEnd,
          workerRecords: workerRecords.map((record, index) => ({
            name: record.name,
            startTime: record.startTime,
            endTime: record.endTime,
            workHours: record.manHours,
            workType: record.workType,
            details: record.details,
            dailyHours: record.dailyHours,
            totalHours: record.totalHours,
            order: index,
          })),
          materialRecords: materialRecords.map((record, index) => ({
            name: record.name,
            volume: record.volume,
            volumeUnit: record.volumeUnit,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            amount: record.quantity * record.unitPrice,
            subcontractor: record.subcontractor,
            order: index,
          })),
          subcontractorRecords: subcontractorRecords
            .filter(record => record.name.trim() !== '')
            .map((record, index) => ({
              name: record.name,
              workerCount: record.workerCount,
              workContent: record.workContent,
              order: index,
            })),
        }),
      })

      if (!response.ok) {
        throw new Error('作業日報の更新に失敗しました')
      }

      setShowSuccessDialog(true)
    } catch (error) {
      console.error('更新エラー:', error)
      alert('作業日報の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/work-report/${reportId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }
      router.push('/dashboard')
    } catch (error: any) {
      console.error('削除エラー:', error)
      alert(error.message || '作業日報の削除に失敗しました')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`
  }

  // 金額合計を計算
  const totalAmount = materialRecords.reduce((sum, r) => sum + (r.quantity * r.unitPrice), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 更新成功ダイアログ */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4">
            <div className="bg-white pt-8 pb-2 px-8 rounded-t-2xl">
              <div className="mx-auto w-36 h-36 mb-4">
                <Image
                  src="/character.png"
                  alt="保存完了キャラクター"
                  width={144}
                  height={144}
                  className="object-contain object-top"
                  priority
                />
              </div>
            </div>
            <div className="h-8 bg-white"></div>
            <div className="bg-white px-6 pb-6 rounded-b-2xl">
              <div className="bg-[#0E3091] rounded-lg py-3 px-4 mb-4">
                <p className="text-sm text-white font-bold text-center">作業日報が正常に更新されました</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSuccessDialog(false)
                    setIsEditing(false)
                  }}
                  className="w-full px-8 py-3 bg-[#0E3091] text-white text-base rounded-xl hover:bg-[#0a2470] font-bold transition-colors shadow-lg"
                >
                  詳細に戻る
                </button>
                <button
                  onClick={() => {
                    setShowSuccessDialog(false)
                    router.push('/dashboard')
                  }}
                  className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
                >
                  TOP画面に戻る
                </button>
              </div>
            </div>
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
              作業日報を削除しますか？
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              この操作は取り消せません。作業者記録・材料記録なども全て削除されます。
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
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
                {isEditing ? '作業日報 編集' : '作業日報 詳細'}
              </h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors"
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

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* 戻るボタン + 削除 + 編集ボタン */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </button>
            <Link
              href={`/work-report/${reportId}/print`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0E3091] bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              印刷 / PDF
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </button>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] hover:from-[#0a2470] hover:to-[#0E3091] rounded-lg shadow-md transition-all"
            >
              <Edit3 className="h-4 w-4" />
              編集する
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* 基本情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-[#0E3091]" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">基本情報</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* 工事名 */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>工事名</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                      required
                    />
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectName || '-'}
                    </div>
                  )}
                </div>

                {/* 工事種別 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>工事種別</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                    >
                      <option value="">選択してください</option>
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectType || '-'}
                    </div>
                  )}
                </div>

                {/* 工事番号 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>工事番号</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                    />
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectId || '-'}
                    </div>
                  )}
                </div>

                {/* 氏名 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>氏名</span>
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50">
                    {currentUser ? (
                      <span className="text-gray-900">
                        {currentUser.name} {currentUser.position ? `(${currentUser.position})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">読み込み中...</span>
                    )}
                  </div>
                </div>

                {/* 日付 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>日付</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                      required
                    />
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {formatDate(date)}
                    </div>
                  )}
                </div>

                {/* 天候 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>天候</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                    >
                      <option value="">選択してください</option>
                      {WEATHER_OPTIONS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {weather || '-'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 作業者記録カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-[#0E3091]" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">作業者記録</h2>
                    <span className="text-xs sm:text-sm text-gray-500">({workerRecords.length}件)</span>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddWorkerRecord}
                    disabled={workerRecords.length >= 11}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {workerRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">作業者記録はありません</p>
              ) : (
                workerRecords.map((record, index) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">作業者 {index + 1}</span>
                      {isEditing && index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkerRecord(record.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4">
                          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">氏名</label>
                            <select
                              value={record.name}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].name = e.target.value
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            >
                              <option value="">選択してください</option>
                              {WORKER_NAMES.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 sm:col-span-1 lg:col-span-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業時間</label>
                            <div className="flex items-center gap-1">
                              <select
                                value={record.startTime}
                                onChange={(e) => {
                                  const newRecords = [...workerRecords]
                                  newRecords[index].startTime = e.target.value
                                  setWorkerRecords(newRecords)
                                }}
                                className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              >
                                <option value="">--:--</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              <span className="text-gray-500 text-sm flex-shrink-0">〜</span>
                              <select
                                value={record.endTime}
                                onChange={(e) => {
                                  const newRecords = [...workerRecords]
                                  newRecords[index].endTime = e.target.value
                                  setWorkerRecords(newRecords)
                                }}
                                className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              >
                                <option value="">--:--</option>
                                {TIME_OPTIONS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="col-span-1 lg:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数</label>
                            <input
                              type="number"
                              value={record.manHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].manHours = parseFloat(e.target.value) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <div className="col-span-1 lg:col-span-3">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工種</label>
                            <input
                              type="text"
                              value={record.workType}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].workType = e.target.value
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4 mt-3">
                          <div className="col-span-1 lg:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 当日</label>
                            <input
                              type="number"
                              value={record.dailyHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].dailyHours = parseFloat(e.target.value) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <div className="col-span-1 lg:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 累計</label>
                            <input
                              type="number"
                              value={record.totalHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].totalHours = parseFloat(e.target.value) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              step="0.5"
                              min="0"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-2 lg:col-span-8">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">内容</label>
                            <textarea
                              value={record.details}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                newRecords[index].details = e.target.value
                                setWorkerRecords(newRecords)
                              }}
                              rows={2}
                              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] resize-none"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">氏名</span>
                            <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">作業時間</span>
                            <p className="text-sm font-medium text-gray-900">{record.startTime || '-'} 〜 {record.endTime || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">工数</span>
                            <p className="text-sm font-medium text-gray-900">{record.manHours || 0}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">工種</span>
                            <p className="text-sm font-medium text-gray-900">{record.workType || '-'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">工数 当日</span>
                            <p className="text-sm font-medium text-gray-900">{record.dailyHours || 0}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">工数 累計</span>
                            <p className="text-sm font-medium text-gray-900">{record.totalHours || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-gray-500">内容</span>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{record.details || '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 使用材料・消耗品カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-5 h-5 text-[#0E3091]" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">使用材料・消耗品</h2>
                    <span className="text-xs sm:text-sm text-gray-500">({materialRecords.length}件)</span>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddMaterialRecord}
                    disabled={materialRecords.length >= 5}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {materialRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">使用材料記録はありません</p>
              ) : (
                materialRecords.map((record, index) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">材料 {index + 1}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterialRecord(record.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4">
                          <div className="col-span-2 sm:col-span-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">材料名</label>
                            <input
                              type="text"
                              value={record.name}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].name = e.target.value
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">容量</label>
                            <input
                              type="text"
                              value={record.volume}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].volume = e.target.value
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">単位</label>
                            <select
                              value={record.volumeUnit}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].volumeUnit = e.target.value
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            >
                              {VOLUME_UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">数量</label>
                            <input
                              type="number"
                              value={record.quantity || ''}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].quantity = parseFloat(e.target.value) || 0
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              step="0.1"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">単価(円)</label>
                            <input
                              type="number"
                              value={record.unitPrice || ''}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].unitPrice = parseFloat(e.target.value) || 0
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 mt-3">
                          <div className="col-span-2 sm:col-span-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先</label>
                            <select
                              value={record.subcontractor}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].subcontractor = e.target.value
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            >
                              <option value="">選択してください</option>
                              {SUBCONTRACTORS.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 sm:col-span-8 flex items-end pb-1">
                            <div className="text-sm text-gray-700">
                              金額: <span className="font-bold text-lg text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">材料名</span>
                          <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">容量</span>
                          <p className="text-sm font-medium text-gray-900">{record.volume || '-'} {record.volumeUnit}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">数量 / 単価</span>
                          <p className="text-sm font-medium text-gray-900">{record.quantity} / {record.unitPrice.toLocaleString()}円</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">金額</span>
                          <p className="text-sm font-bold text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</p>
                        </div>
                        {record.subcontractor && (
                          <div className="col-span-2">
                            <span className="text-xs text-gray-500">外注先</span>
                            <p className="text-sm font-medium text-gray-900">{record.subcontractor}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* 合計金額 */}
              {materialRecords.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">合計金額</span>
                    <span className="text-xl font-bold text-[#0E3091]">{totalAmount.toLocaleString()}円</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 外注先カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-5 h-5 text-[#0E3091]" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">外注先</h2>
                    <span className="text-xs sm:text-sm text-gray-500">({subcontractorRecords.length}件)</span>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddSubcontractorRecord}
                    disabled={subcontractorRecords.length >= 10}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {subcontractorRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">外注先記録はありません</p>
              ) : (
                subcontractorRecords.map((record, index) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">外注先 {index + 1}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcontractorRecord(record.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先名</label>
                          <select
                            value={record.name}
                            onChange={(e) => {
                              const newRecords = [...subcontractorRecords]
                              newRecords[index].name = e.target.value
                              setSubcontractorRecords(newRecords)
                            }}
                            className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                          >
                            <option value="">選択してください</option>
                            {SUBCONTRACTORS.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">人数</label>
                          <input
                            type="number"
                            value={record.workerCount || ''}
                            onChange={(e) => {
                              const newRecords = [...subcontractorRecords]
                              newRecords[index].workerCount = parseInt(e.target.value) || 0
                              setSubcontractorRecords(newRecords)
                            }}
                            className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業内容</label>
                          <input
                            type="text"
                            value={record.workContent}
                            onChange={(e) => {
                              const newRecords = [...subcontractorRecords]
                              newRecords[index].workContent = e.target.value
                              setSubcontractorRecords(newRecords)
                            }}
                            className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">外注先名</span>
                          <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">人数</span>
                          <p className="text-sm font-medium text-gray-900">{record.workerCount || 0}人</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">作業内容</span>
                          <p className="text-sm font-medium text-gray-900">{record.workContent || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 遠隔地・交通誘導警備員カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-[#0E3091]" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">遠隔地・交通誘導警備員</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 遠隔地情報 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">遠隔地移動時間</h3>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">出発時刻</label>
                        <select value={remoteDepartureTime} onChange={(e) => setRemoteDepartureTime(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場着</label>
                        <select value={remoteArrivalTime} onChange={(e) => setRemoteArrivalTime(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場発</label>
                        <select value={remoteDepartureTime2} onChange={(e) => setRemoteDepartureTime2(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">会社着</label>
                        <select value={remoteArrivalTime2} onChange={(e) => setRemoteArrivalTime2(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">出発時刻</span>
                        <p className="text-sm font-medium text-gray-900">{remoteDepartureTime || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">現場着</span>
                        <p className="text-sm font-medium text-gray-900">{remoteArrivalTime || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">現場発</span>
                        <p className="text-sm font-medium text-gray-900">{remoteDepartureTime2 || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">会社着</span>
                        <p className="text-sm font-medium text-gray-900">{remoteArrivalTime2 || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 交通誘導警備員情報 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">交通誘導警備員</h3>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">人数</label>
                        <input type="number" value={trafficGuardCount || ''} onChange={(e) => setTrafficGuardCount(parseInt(e.target.value) || 0)}
                          className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]" />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">開始時刻</label>
                        <select value={trafficGuardStart} onChange={(e) => setTrafficGuardStart(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm text-gray-600 mb-1 block">終了時刻</label>
                        <select value={trafficGuardEnd} onChange={(e) => setTrafficGuardEnd(e.target.value)}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500">人数</span>
                        <p className="text-sm font-medium text-gray-900">{trafficGuardCount || 0}人</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">開始時刻</span>
                        <p className="text-sm font-medium text-gray-900">{trafficGuardStart || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">終了時刻</span>
                        <p className="text-sm font-medium text-gray-900">{trafficGuardEnd || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 連絡事項カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0E3091]/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#0E3091]" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">連絡事項</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {isEditing ? (
                <>
                  <textarea
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] resize-none transition-all"
                    placeholder="その他の連絡事項・特記事項などを入力してください"
                  />
                  <div className="text-xs sm:text-sm text-gray-500 mt-2 text-right">
                    {contactNotes.length} / 500文字
                  </div>
                </>
              ) : (
                <p className="text-base text-gray-900 whitespace-pre-wrap">
                  {contactNotes || '連絡事項はありません'}
                </p>
              )}
            </div>
          </div>

          {/* フッター */}
          {isEditing && (
            <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-xl hover:from-[#0a2470] hover:to-[#0E3091] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? '更新中...' : '更新'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-base sm:text-lg font-bold transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                  <span>キャンセル</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
