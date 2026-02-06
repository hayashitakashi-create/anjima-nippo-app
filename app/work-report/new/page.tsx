'use client'

/**
 * 作業日報入力画面
 *
 * 構造:
 * 1. 上部固定情報（日付・氏名・工事情報）
 * 2. 作業者記録ブロック（最大11件）
 * 3. 使用材料・消耗品ブロック（最大5件）
 * 4. 外注先ブロック（最大10件）
 * 5. 遠隔地・交通誘導警備員情報
 * 6. 連絡事項
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Trash2,
  Users,
  Package,
  Briefcase,
  Copy
} from 'lucide-react'

interface User {
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
  manHours: number    // 工数
  workType: string
  details: string
  dailyHours: number  // 工数 当日
  totalHours: number  // 工数 累計
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

// 30分刻みの時刻リストを生成（00:00-23:30）
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

function WorkReportNewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectRefId = searchParams.get('projectId') // URLパラメータから物件IDを取得
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [projectLoaded, setProjectLoaded] = useState(false)

  // 基本情報
  const [date, setDate] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectId, setProjectId] = useState('')
  const [weather, setWeather] = useState('')

  // 作業者記録
  const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([
    {
      id: '1',
      name: '',
      startTime: '08:00',
      endTime: '17:00',
      manHours: 0,
      workType: '',
      details: '',
      dailyHours: 0,
      totalHours: 0
    }
  ])

  // 使用材料記録
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([
    {
      id: '1',
      name: '',
      volume: '',
      volumeUnit: 'ℓ',
      quantity: 0,
      unitPrice: 0,
      subcontractor: ''
    }
  ])

  // 外注先記録
  const [subcontractorRecords, setSubcontractorRecords] = useState<SubcontractorRecord[]>([
    {
      id: '1',
      name: '',
      workerCount: 0,
      workContent: ''
    }
  ])

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

  // 前日コピー用
  const [copyLoading, setCopyLoading] = useState('')

  // 初期化
  useEffect(() => {
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

    // 今日の日付をデフォルトに設定
    const today = new Date()
    const formatted = today.toISOString().split('T')[0]
    setDate(formatted)

    // 物件IDがURLパラメータにある場合、物件情報を取得して自動入力
    if (projectRefId) {
      fetch(`/api/projects/${projectRefId}`)
        .then(res => {
          if (res.ok) return res.json()
          return null
        })
        .then(project => {
          if (project) {
            setProjectName(project.name || '')
            setProjectType(project.projectType || '')
            setProjectId(project.projectCode || '')
            setProjectLoaded(true)
          }
        })
        .catch(error => {
          console.error('物件情報取得エラー:', error)
        })
    }
  }, [router, projectRefId])

  // 作業者記録の追加
  const handleAddWorkerRecord = () => {
    if (workerRecords.length >= 11) {
      alert('作業者記録は最大11件までです')
      return
    }
    const newId = (Math.max(...workerRecords.map(r => parseInt(r.id))) + 1).toString()
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
        totalHours: 0
      }
    ])
  }

  // 作業者記録の削除
  const handleDeleteWorkerRecord = (id: string) => {
    if (workerRecords.length === 1) {
      alert('作業者記録は最低1件必要です')
      return
    }
    setWorkerRecords(prev => prev.filter(record => record.id !== id))
  }

  // 使用材料記録の追加
  const handleAddMaterialRecord = () => {
    if (materialRecords.length >= 5) {
      alert('使用材料記録は最大5件までです')
      return
    }
    const newId = (Math.max(...materialRecords.map(r => parseInt(r.id))) + 1).toString()
    setMaterialRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        volume: '',
        volumeUnit: 'ℓ',
        quantity: 0,
        unitPrice: 0,
        subcontractor: ''
      }
    ])
  }

  // 使用材料記録の削除
  const handleDeleteMaterialRecord = (id: string) => {
    setMaterialRecords(prev => prev.filter(record => record.id !== id))
  }

  // 外注先記録の追加
  const handleAddSubcontractorRecord = () => {
    if (subcontractorRecords.length >= 10) {
      alert('外注先記録は最大10件までです')
      return
    }
    const newId = (Math.max(...subcontractorRecords.map(r => parseInt(r.id))) + 1).toString()
    setSubcontractorRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        workerCount: 0,
        workContent: ''
      }
    ])
  }

  // 外注先記録の削除
  const handleDeleteSubcontractorRecord = (id: string) => {
    setSubcontractorRecords(prev => prev.filter(record => record.id !== id))
  }

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      alert('工事名を入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/work-report', {
        method: 'POST',
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
            manHours: record.manHours,
            workType: record.workType,
            details: record.details,
            dailyHours: record.dailyHours,
            totalHours: record.totalHours,
            order: index
          })),
          materialRecords: materialRecords.map((record, index) => ({
            name: record.name,
            volume: record.volume,
            volumeUnit: record.volumeUnit,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            amount: record.quantity * record.unitPrice,
            subcontractor: record.subcontractor,
            order: index
          })),
          subcontractorRecords: subcontractorRecords
            .filter(record => record.name.trim() !== '')
            .map((record, index) => ({
              name: record.name,
              workerCount: record.workerCount,
              workContent: record.workContent,
              order: index
            }))
        }),
      })

      if (!response.ok) {
        throw new Error('作業日報の作成に失敗しました')
      }

      setShowSuccessDialog(true)
    } catch (error) {
      console.error('送信エラー:', error)
      alert('作業日報の作成に失敗しました')
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
    if (projectRefId) {
      router.push('/work-report/projects')
    } else {
      router.push('/dashboard')
    }
  }

  // 前日の日報データを取得
  const fetchPreviousReport = async () => {
    if (!currentUser?.id || !date) return null
    try {
      const params = new URLSearchParams({
        userId: currentUser.id,
        date: date,
      })
      if (projectRefId) {
        params.set('projectRefId', projectRefId)
      }
      const res = await fetch(`/api/work-report/previous?${params}`)
      if (!res.ok) return null
      const data = await res.json()
      return data
    } catch (error) {
      console.error('前日日報取得エラー:', error)
      return null
    }
  }

  // 作業者記録の前日コピー
  const handleCopyWorkerRecords = async () => {
    setCopyLoading('worker')
    const prev = await fetchPreviousReport()
    if (!prev || !prev.workerRecords || prev.workerRecords.length === 0) {
      alert('前日の作業者記録が見つかりません')
      setCopyLoading('')
      return
    }
    const copied: WorkerRecord[] = prev.workerRecords.map((r: any, i: number) => ({
      id: (i + 1).toString(),
      name: r.name || '',
      startTime: r.startTime || '08:00',
      endTime: r.endTime || '17:00',
      manHours: r.workHours || 0,
      workType: r.workType || '',
      details: r.details || '',
      dailyHours: r.dailyHours || 0,
      totalHours: r.totalHours || 0,
    }))
    setWorkerRecords(copied)
    setCopyLoading('')
  }

  // 使用材料の前日コピー
  const handleCopyMaterialRecords = async () => {
    setCopyLoading('material')
    const prev = await fetchPreviousReport()
    if (!prev || !prev.materialRecords || prev.materialRecords.length === 0) {
      alert('前日の使用材料記録が見つかりません')
      setCopyLoading('')
      return
    }
    const copied: MaterialRecord[] = prev.materialRecords.map((r: any, i: number) => ({
      id: (i + 1).toString(),
      name: r.name || '',
      volume: r.volume || '',
      volumeUnit: r.volumeUnit || 'ℓ',
      quantity: r.quantity || 0,
      unitPrice: r.unitPrice || 0,
      subcontractor: r.subcontractor || '',
    }))
    setMaterialRecords(copied)
    setCopyLoading('')
  }

  // 外注先の前日コピー
  const handleCopySubcontractorRecords = async () => {
    setCopyLoading('subcontractor')
    const prev = await fetchPreviousReport()
    if (!prev || !prev.subcontractorRecords || prev.subcontractorRecords.length === 0) {
      alert('前日の外注先記録が見つかりません')
      setCopyLoading('')
      return
    }
    const copied: SubcontractorRecord[] = prev.subcontractorRecords.map((r: any, i: number) => ({
      id: (i + 1).toString(),
      name: r.name || '',
      workerCount: r.workerCount || 0,
      workContent: r.workContent || '',
    }))
    setSubcontractorRecords(copied)
    setCopyLoading('')
  }

  // 遠隔地・交通誘導警備員の前日コピー
  const handleCopyRemoteTraffic = async () => {
    setCopyLoading('remote')
    const prev = await fetchPreviousReport()
    if (!prev) {
      alert('前日の日報が見つかりません')
      setCopyLoading('')
      return
    }
    setRemoteDepartureTime(prev.remoteDepartureTime || '')
    setRemoteArrivalTime(prev.remoteArrivalTime || '')
    setRemoteDepartureTime2(prev.remoteDepartureTime2 || '')
    setRemoteArrivalTime2(prev.remoteArrivalTime2 || '')
    setTrafficGuardCount(prev.trafficGuardCount || 0)
    setTrafficGuardStart(prev.trafficGuardStart || '')
    setTrafficGuardEnd(prev.trafficGuardEnd || '')
    setCopyLoading('')
  }

  // 金額合計を計算
  const totalAmount = materialRecords.reduce((sum, record) => sum + (record.quantity * record.unitPrice), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Dialog */}
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
                <p className="text-sm text-white font-bold text-center">作業日報が正常に保存されました</p>
              </div>
              {projectRefId ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSuccessDialog(false)
                      router.push(`/work-report/new?projectId=${projectRefId}`)
                      // フォームをリセット
                      setWorkerRecords([{ id: '1', name: '', startTime: '08:00', endTime: '17:00', manHours: 0, workType: '', details: '', dailyHours: 0, totalHours: 0 }])
                      setMaterialRecords([{ id: '1', name: '', volume: '', volumeUnit: 'ℓ', quantity: 0, unitPrice: 0, subcontractor: '' }])
                      setSubcontractorRecords([{ id: '1', name: '', workerCount: 0, workContent: '' }])
                      setWeather('')
                      setContactNotes('')
                      setRemoteDepartureTime('')
                      setRemoteArrivalTime('')
                      setRemoteDepartureTime2('')
                      setRemoteArrivalTime2('')
                      setTrafficGuardCount(0)
                      setTrafficGuardStart('')
                      setTrafficGuardEnd('')
                    }}
                    className="w-full px-8 py-3 bg-[#0E3091] text-white text-base rounded-xl hover:bg-[#0a2470] font-bold transition-colors shadow-lg"
                  >
                    同じ物件で続けて作成
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessDialog(false)
                      router.push('/work-report/projects')
                    }}
                    className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
                  >
                    物件一覧に戻る
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowSuccessDialog(false)
                    router.push('/dashboard')
                  }}
                  className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
                >
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">作業日報</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">TOP画面</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* 基本情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-[#0E3091]" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">基本情報</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">作業日報の基本情報を入力してください</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* 工事名 */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>工事名</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {projectLoaded ? (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectName}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                      placeholder="工事名を入力してください"
                      required
                    />
                  )}
                </div>

                {/* 工事種別 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>工事種別</span>
                  </label>
                  {projectLoaded ? (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectType || '未設定'}
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* 工事番号 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>工事番号</span>
                  </label>
                  {projectLoaded ? (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectId || '未設定'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                      placeholder="工事番号を入力"
                    />
                  )}
                </div>

                {/* 氏名 */}
                <div className="lg:col-span-2">
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
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                    required
                  />
                </div>

                {/* 天候 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <span>天候</span>
                  </label>
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
                    <span className="text-xs sm:text-sm text-gray-500">({workerRecords.length}/11件)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">作業者の情報を入力してください</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWorkerRecords}
                    disabled={copyLoading === 'worker'}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">{copyLoading === 'worker' ? '取得中...' : '前日コピー'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddWorkerRecord}
                    disabled={workerRecords.length >= 11}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {workerRecords.map((record, index) => (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">作業者 {index + 1}</span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkerRecord(record.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* 上段: 氏名 | 作業時間(開始〜終了) | 工数 | 工種 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4">
                    {/* 氏名 */}
                    <div className="col-span-2 sm:col-span-1 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">氏名</label>
                      <select
                        value={record.name}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          newRecords[index].name = e.target.value
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      >
                        <option value="">選択してください</option>
                        {WORKER_NAMES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 作業時間（開始〜終了） */}
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
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
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
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        >
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 工数 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="0"
                        step="0.5"
                        min="0"
                      />
                    </div>

                    {/* 工種 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="工種"
                      />
                    </div>
                  </div>

                  {/* 下段: 工数当日 | 工数累計 | 内容 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4 mt-3">
                    {/* 工数 当日 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="0"
                        step="0.5"
                        min="0"
                      />
                    </div>

                    {/* 工数 累計 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="0"
                        step="0.5"
                        min="0"
                      />
                    </div>

                    {/* 作業内容・内訳 */}
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
                        className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] resize-none"
                        placeholder="作業内容の詳細を入力"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                    <span className="text-xs sm:text-sm text-gray-500">({materialRecords.length}/5件)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">使用した材料や消耗品を入力してください</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMaterialRecords}
                    disabled={copyLoading === 'material'}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">{copyLoading === 'material' ? '取得中...' : '前日コピー'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMaterialRecord}
                    disabled={materialRecords.length >= 5}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {materialRecords.map((record, index) => (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">材料 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterialRecord(record.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* 上段: 材料名 | 容量 | 単位 | 数量 | 単価 */}
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4">
                    {/* 材料名 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="材料名"
                      />
                    </div>

                    {/* 容量 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="容量"
                      />
                    </div>

                    {/* 単位 */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">単位</label>
                      <select
                        value={record.volumeUnit}
                        onChange={(e) => {
                          const newRecords = [...materialRecords]
                          newRecords[index].volumeUnit = e.target.value
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      >
                        {VOLUME_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    {/* 数量 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="0"
                        step="0.1"
                      />
                    </div>

                    {/* 単価 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* 下段: 外注先 | 金額 */}
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 mt-3">
                    {/* 外注先 */}
                    <div className="col-span-2 sm:col-span-4">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先</label>
                      <select
                        value={record.subcontractor}
                        onChange={(e) => {
                          const newRecords = [...materialRecords]
                          newRecords[index].subcontractor = e.target.value
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      >
                        <option value="">選択してください</option>
                        {SUBCONTRACTORS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* 金額（自動計算） */}
                    <div className="col-span-2 sm:col-span-8 flex items-end pb-1">
                      <div className="text-sm text-gray-700">
                        金額: <span className="font-bold text-lg text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

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
                    <span className="text-xs sm:text-sm text-gray-500">({subcontractorRecords.length}/10件)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">外注先の情報を入力してください</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySubcontractorRecords}
                    disabled={copyLoading === 'subcontractor'}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">{copyLoading === 'subcontractor' ? '取得中...' : '前日コピー'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSubcontractorRecord}
                    disabled={subcontractorRecords.length >= 10}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {subcontractorRecords.map((record, index) => (
                <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">外注先 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubcontractorRecord(record.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* 外注先名 */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先名</label>
                      <select
                        value={record.name}
                        onChange={(e) => {
                          const newRecords = [...subcontractorRecords]
                          newRecords[index].name = e.target.value
                          setSubcontractorRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      >
                        <option value="">選択してください</option>
                        {SUBCONTRACTORS.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* 人数 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="人数"
                        min="0"
                      />
                    </div>

                    {/* 作業内容 */}
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
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="作業内容を入力"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 遠隔地・交通誘導警備員カード */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-[#0E3091]" />
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">遠隔地・交通誘導警備員</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">遠隔地の移動時間や交通誘導警備員の情報を入力してください</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRemoteTraffic}
                  disabled={copyLoading === 'remote'}
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">{copyLoading === 'remote' ? '取得中...' : '前日コピー'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* 遠隔地情報 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">遠隔地移動時間</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">出発時刻</label>
                      <select
                        value={remoteDepartureTime}
                        onChange={(e) => setRemoteDepartureTime(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場着</label>
                      <select
                        value={remoteArrivalTime}
                        onChange={(e) => setRemoteArrivalTime(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場発</label>
                      <select
                        value={remoteDepartureTime2}
                        onChange={(e) => setRemoteDepartureTime2(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">会社着</label>
                      <select
                        value={remoteArrivalTime2}
                        onChange={(e) => setRemoteArrivalTime2(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 交通誘導警備員情報 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">交通誘導警備員</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">人数</label>
                      <input
                        type="number"
                        value={trafficGuardCount || ''}
                        onChange={(e) => setTrafficGuardCount(parseInt(e.target.value) || 0)}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                        placeholder="人数"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">開始時刻</label>
                      <select
                        value={trafficGuardStart}
                        onChange={(e) => setTrafficGuardStart(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-gray-600 mb-1 block">終了時刻</label>
                      <select
                        value={trafficGuardEnd}
                        onChange={(e) => setTrafficGuardEnd(e.target.value)}
                        className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                      >
                        <option value="">--:--</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
              <textarea
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] resize-none transition-all"
                placeholder="その他の連絡事項・特記事項などを入力してください"
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-2 text-right">
                {contactNotes.length} / 500文字
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-xl hover:from-[#0a2470] hover:to-[#0E3091] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? '保存中...' : '保存'}</span>
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-base sm:text-lg font-bold transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
                <span>キャンセル</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function WorkReportNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">読み込み中...</p>
      </div>
    }>
      <WorkReportNewPageContent />
    </Suspense>
  )
}
