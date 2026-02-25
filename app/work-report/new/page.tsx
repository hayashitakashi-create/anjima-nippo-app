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
import {
  FileText,
  Save,
  X,
  LogOut,
  Home,
  Settings,
  Shield,
} from 'lucide-react'
import { useDraftSave, formatDraftTime } from '@/lib/useDraftSave'

// Types
import { User, WorkerRecord, MaterialRecord, SubcontractorRecord, calculateManHoursFromTime } from './types'
import { DEFAULT_PROJECT_TYPES, DEFAULT_VOLUME_UNITS, DEFAULT_SUBCONTRACTORS } from './constants'

// Components
import {
  BasicInfoCard,
  WorkerRecordsCard,
  MaterialRecordsCard,
  SubcontractorCard,
  RemoteTrafficCard,
  ContactNotesCard,
  SuccessDialog,
  DraftBanner,
} from './components'

// Custom Hook
import { useWorkReportForm } from './hooks/useWorkReportForm'

function WorkReportNewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectRefId = searchParams.get('projectId')

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [projectLoaded, setProjectLoaded] = useState(false)

  // マスタデータ
  const [materialMasterList, setMaterialMasterList] = useState<string[]>([])
  const [projectTypesList, setProjectTypesList] = useState<string[]>(DEFAULT_PROJECT_TYPES)
  const [subcontractorMasterList, setSubcontractorMasterList] = useState<string[]>(DEFAULT_SUBCONTRACTORS)
  const [unitMasterList, setUnitMasterList] = useState<string[]>(DEFAULT_VOLUME_UNITS)

  // 前日コピー
  const [copyLoading, setCopyLoading] = useState('')

  // 下書き復元バナー
  const [showDraftBanner, setShowDraftBanner] = useState(false)

  // フォーム状態（カスタムフック）
  const form = useWorkReportForm()

  // 下書き自動保存
  const draftKey = projectRefId ? `work_report_${projectRefId}` : 'work_report_new'
  const {
    hasDraft,
    draftData,
    lastSavedAt,
    clearDraft,
    dismissDraft,
  } = useDraftSave(draftKey, form.getFormData, !!currentUser)

  // 下書き復元バナー表示
  useEffect(() => {
    if (hasDraft && draftData) {
      setShowDraftBanner(true)
    }
  }, [hasDraft, draftData])

  // 下書きを復元
  const handleRestoreDraft = () => {
    if (!draftData) return
    const draft = draftData as any
    if (draft.date) form.setDate(draft.date)
    if (draft.projectName && !projectLoaded) form.setProjectName(draft.projectName)
    if (draft.projectType && !projectLoaded) form.setProjectType(draft.projectType)
    if (draft.projectId && !projectLoaded) form.setProjectId(draft.projectId)
    if (draft.weather) form.setWeather(draft.weather)
    if (draft.workerRecords?.length > 0) form.setWorkerRecords(draft.workerRecords)
    if (draft.materialRecords?.length > 0) form.setMaterialRecords(draft.materialRecords)
    if (draft.subcontractorRecords?.length > 0) form.setSubcontractorRecords(draft.subcontractorRecords)
    if (draft.remoteDepartureTime) form.setRemoteDepartureTime(draft.remoteDepartureTime)
    if (draft.remoteArrivalTime) form.setRemoteArrivalTime(draft.remoteArrivalTime)
    if (draft.remoteDepartureTime2) form.setRemoteDepartureTime2(draft.remoteDepartureTime2)
    if (draft.remoteArrivalTime2) form.setRemoteArrivalTime2(draft.remoteArrivalTime2)
    if (draft.trafficGuardCount) form.setTrafficGuardCount(draft.trafficGuardCount)
    if (draft.trafficGuardStart) form.setTrafficGuardStart(draft.trafficGuardStart)
    if (draft.trafficGuardEnd) form.setTrafficGuardEnd(draft.trafficGuardEnd)
    if (draft.contactNotes) form.setContactNotes(draft.contactNotes)
    setShowDraftBanner(false)
    dismissDraft()
  }

  // 下書きを破棄
  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftBanner(false)
  }

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
        }
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // マスタデータ取得
    Promise.all([
      fetch('/api/admin/materials', { credentials: 'include' }),
      fetch('/api/admin/project-types', { credentials: 'include' }),
      fetch('/api/admin/subcontractors', { credentials: 'include' }),
      fetch('/api/admin/units', { credentials: 'include' }),
    ]).then(async ([materialsRes, projectTypesRes, subcontractorsRes, unitsRes]) => {
      if (materialsRes.ok) {
        const data = await materialsRes.json()
        if (data?.materials) {
          setMaterialMasterList(data.materials.filter((m: any) => m.isActive).map((m: any) => m.name))
        }
      }
      if (projectTypesRes.ok) {
        const data = await projectTypesRes.json()
        if (data?.projectTypes) {
          const activeTypes = data.projectTypes.filter((pt: any) => pt.isActive).map((pt: any) => pt.name)
          if (activeTypes.length > 0) setProjectTypesList(activeTypes)
        }
      }
      if (subcontractorsRes.ok) {
        const data = await subcontractorsRes.json()
        if (data?.subcontractors) {
          const activeNames = data.subcontractors.filter((s: any) => s.isActive).map((s: any) => s.name)
          if (activeNames.length > 0) setSubcontractorMasterList(activeNames)
        }
      }
      if (unitsRes.ok) {
        const data = await unitsRes.json()
        if (data?.units) {
          const activeUnits = data.units.filter((u: any) => u.isActive).map((u: any) => u.name)
          if (activeUnits.length > 0) setUnitMasterList(activeUnits)
        }
      }
    }).catch(err => console.error('マスタデータ取得エラー:', err))

    // 今日の日付をデフォルトに設定
    const today = new Date()
    const formatted = today.toISOString().split('T')[0]
    form.setDate(formatted)

    // 物件IDがURLパラメータにある場合、物件情報を取得
    if (projectRefId) {
      fetch(`/api/projects/${projectRefId}`)
        .then(res => res.ok ? res.json() : null)
        .then(project => {
          if (project) {
            form.setProjectName(project.name || '')
            form.setProjectType(project.projectType || '')
            form.setProjectId(project.projectCode || '')
            setProjectLoaded(true)
          }
        })
        .catch(error => console.error('物件情報取得エラー:', error))
    }
  }, [router, projectRefId])

  // 前日の日報データを取得
  const fetchPreviousReport = async () => {
    if (!currentUser?.id || !form.date) return null
    try {
      const params = new URLSearchParams({
        userId: currentUser.id,
        date: form.date,
      })
      if (projectRefId) params.set('projectRefId', projectRefId)
      const res = await fetch(`/api/work-report/previous?${params}`)
      if (!res.ok) return null
      return await res.json()
    } catch (error) {
      console.error('前日日報取得エラー:', error)
      return null
    }
  }

  // 各セクションの前日コピー関数
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
    form.setWorkerRecords(copied)
    setCopyLoading('')
  }

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
    form.setMaterialRecords(copied)
    setCopyLoading('')
  }

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
    form.setSubcontractorRecords(copied)
    setCopyLoading('')
  }

  const handleCopyRemoteTraffic = async () => {
    setCopyLoading('remote')
    const prev = await fetchPreviousReport()
    if (!prev) {
      alert('前日の日報が見つかりません')
      setCopyLoading('')
      return
    }
    form.setRemoteDepartureTime(prev.remoteDepartureTime || '')
    form.setRemoteArrivalTime(prev.remoteArrivalTime || '')
    form.setRemoteDepartureTime2(prev.remoteDepartureTime2 || '')
    form.setRemoteArrivalTime2(prev.remoteArrivalTime2 || '')
    form.setTrafficGuardCount(prev.trafficGuardCount || 0)
    form.setTrafficGuardStart(prev.trafficGuardStart || '')
    form.setTrafficGuardEnd(prev.trafficGuardEnd || '')
    setCopyLoading('')
  }

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.projectName.trim()) {
      alert('工事名を入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/work-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(form.date),
          userId: currentUser?.id,
          projectRefId: projectRefId || undefined,
          projectName: form.projectName,
          projectType: form.projectType,
          projectId: form.projectId,
          weather: form.weather,
          contactNotes: form.contactNotes,
          remoteDepartureTime: form.remoteDepartureTime,
          remoteArrivalTime: form.remoteArrivalTime,
          remoteDepartureTime2: form.remoteDepartureTime2,
          remoteArrivalTime2: form.remoteArrivalTime2,
          trafficGuardCount: form.trafficGuardCount,
          trafficGuardStart: form.trafficGuardStart,
          trafficGuardEnd: form.trafficGuardEnd,
          workerRecords: form.workerRecords.map((record, index) => ({
            name: record.name,
            startTime: record.startTime,
            endTime: record.endTime,
            workHours: record.manHours || calculateManHoursFromTime(record.startTime, record.endTime),
            workType: record.workType,
            details: record.details,
            dailyHours: record.dailyHours,
            totalHours: record.totalHours,
            order: index
          })),
          materialRecords: form.materialRecords.map((record, index) => ({
            name: record.name,
            volume: record.volume,
            volumeUnit: record.volumeUnit,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            amount: record.quantity * record.unitPrice,
            subcontractor: record.subcontractor,
            order: index
          })),
          subcontractorRecords: form.subcontractorRecords
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

      clearDraft()
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
      await fetch('/api/auth/logout', { method: 'POST' })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Dialog */}
      <SuccessDialog
        show={showSuccessDialog}
        projectRefId={projectRefId}
        onContinue={() => {
          setShowSuccessDialog(false)
          form.resetForm()
        }}
        onGoToProjects={() => {
          setShowSuccessDialog(false)
          router.push('/work-report/projects')
        }}
        onClose={() => {
          setShowSuccessDialog(false)
          router.push('/dashboard')
        }}
      />

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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault()
            }
          }}
          className="space-y-4 sm:space-y-6"
        >
          {/* 下書き復元バナー */}
          <DraftBanner
            show={showDraftBanner}
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />

          {/* 基本情報 */}
          <BasicInfoCard
            date={form.date}
            setDate={form.setDate}
            projectName={form.projectName}
            setProjectName={form.setProjectName}
            projectType={form.projectType}
            setProjectType={form.setProjectType}
            projectId={form.projectId}
            setProjectId={form.setProjectId}
            weather={form.weather}
            setWeather={form.setWeather}
            currentUser={currentUser}
            projectLoaded={projectLoaded}
            projectTypesList={projectTypesList}
          />

          {/* 作業者記録 */}
          <WorkerRecordsCard
            workerRecords={form.workerRecords}
            setWorkerRecords={form.setWorkerRecords}
            onAdd={form.handleAddWorkerRecord}
            onDelete={form.handleDeleteWorkerRecord}
            onCopyPrevious={handleCopyWorkerRecords}
            copyLoading={copyLoading}
            projectTypesList={projectTypesList}
          />

          {/* 使用材料 */}
          <MaterialRecordsCard
            materialRecords={form.materialRecords}
            setMaterialRecords={form.setMaterialRecords}
            onAdd={form.handleAddMaterialRecord}
            onDelete={form.handleDeleteMaterialRecord}
            onCopyPrevious={handleCopyMaterialRecords}
            copyLoading={copyLoading}
            materialMasterList={materialMasterList}
            unitMasterList={unitMasterList}
            totalAmount={form.totalAmount}
          />

          {/* 外注先 */}
          <SubcontractorCard
            subcontractorRecords={form.subcontractorRecords}
            setSubcontractorRecords={form.setSubcontractorRecords}
            onAdd={form.handleAddSubcontractorRecord}
            onDelete={form.handleDeleteSubcontractorRecord}
            onCopyPrevious={handleCopySubcontractorRecords}
            copyLoading={copyLoading}
            subcontractorMasterList={subcontractorMasterList}
          />

          {/* 遠隔地・交通誘導警備員 */}
          <RemoteTrafficCard
            remoteDepartureTime={form.remoteDepartureTime}
            setRemoteDepartureTime={form.setRemoteDepartureTime}
            remoteArrivalTime={form.remoteArrivalTime}
            setRemoteArrivalTime={form.setRemoteArrivalTime}
            remoteDepartureTime2={form.remoteDepartureTime2}
            setRemoteDepartureTime2={form.setRemoteDepartureTime2}
            remoteArrivalTime2={form.remoteArrivalTime2}
            setRemoteArrivalTime2={form.setRemoteArrivalTime2}
            trafficGuardCount={form.trafficGuardCount}
            setTrafficGuardCount={form.setTrafficGuardCount}
            trafficGuardStart={form.trafficGuardStart}
            setTrafficGuardStart={form.setTrafficGuardStart}
            trafficGuardEnd={form.trafficGuardEnd}
            setTrafficGuardEnd={form.setTrafficGuardEnd}
            onCopyPrevious={handleCopyRemoteTraffic}
            copyLoading={copyLoading}
          />

          {/* 連絡事項 */}
          <ContactNotesCard
            contactNotes={form.contactNotes}
            setContactNotes={form.setContactNotes}
          />

          {/* フッター */}
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            {lastSavedAt && (
              <p className="text-xs text-gray-400 text-center mb-3">
                自動保存: {formatDraftTime(lastSavedAt)}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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
