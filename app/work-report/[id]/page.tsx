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

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Calendar,
  User,
  Building2,
  Clock,
  Plus,
  Trash2,
  Users,
  Package,
  Briefcase,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMasterData } from '@/hooks/useMasterData'
import { calculateManHoursFromTime } from '../new/types'
import { toHalfWidth } from '../new/utils'
import { WEATHER_OPTIONS, TIME_OPTIONS } from '../new/constants'
import { formatDate } from './types'
import { useWorkReportDetail } from './hooks/useWorkReportDetail'
import {
  SuccessDialog,
  DeleteConfirmDialog,
  DetailHeader,
  DetailToolbar,
  ContactNotesCard,
  ApprovalSection,
  RejectModal,
  EditFooter,
} from './components'

const calculateManHours = calculateManHoursFromTime

export default function WorkReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isPreviewParam = searchParams.get('preview') === '1'
  const reportId = params.id as string

  const { user: currentUser, logout: handleLogout } = useAuth()
  const { materialMasterList, projectTypesList, subcontractorMasterList, unitMasterList, workerNamesList } = useMasterData()

  const {
    loading, saving, isEditing, setIsEditing,
    showSuccessDialog, setShowSuccessDialog,
    showDeleteConfirm, setShowDeleteConfirm, deleting,
    date, setDate, projectName, setProjectName,
    projectType, setProjectType, projectId, setProjectId,
    weather, setWeather,
    reportOwner, enteredBy,
    workerRecords, setWorkerRecords,
    materialRecords, setMaterialRecords,
    subcontractorRecords, setSubcontractorRecords,
    remoteDepartureTime, setRemoteDepartureTime,
    remoteArrivalTime, setRemoteArrivalTime,
    remoteDepartureTime2, setRemoteDepartureTime2,
    remoteArrivalTime2, setRemoteArrivalTime2,
    trafficGuardCount, setTrafficGuardCount,
    trafficGuardStart, setTrafficGuardStart,
    trafficGuardEnd, setTrafficGuardEnd,
    contactNotes, setContactNotes,
    approvals, approvalProcessing,
    rejectModalApprovalId, setRejectModalApprovalId,
    rejectComment, setRejectComment,
    handleApprove, submitReject,
    handleAddWorkerRecord, handleDeleteWorkerRecord,
    handleAddMaterialRecord, handleDeleteMaterialRecord,
    handleAddSubcontractorRecord, handleDeleteSubcontractorRecord,
    handleSubmit, handleDelete,
  } = useWorkReportDetail(reportId, currentUser as any)

  // 閲覧専用判定: preview=1 OR ログインユーザーが対象社員/代理入力者でない場合
  const isOwnerOrEntrant = !!currentUser && (
    (reportOwner && currentUser.id === reportOwner.id) ||
    (enteredBy && currentUser.id === enteredBy.id)
  )
  const isPreview = isPreviewParam || !currentUser || !reportOwner || !isOwnerOrEntrant

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
      <SuccessDialog
        show={showSuccessDialog}
        onBackToDetail={() => {
          setShowSuccessDialog(false)
          setIsEditing(false)
        }}
        onBackToTop={() => {
          setShowSuccessDialog(false)
          router.push('/dashboard')
        }}
      />

      <DeleteConfirmDialog
        show={showDeleteConfirm}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <DetailHeader
        isEditing={isEditing}
        currentUser={currentUser as any}
        onLogout={handleLogout}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <DetailToolbar
          isEditing={isEditing}
          isPreview={isPreview}
          reportId={reportId}
          onBack={() => router.push(isPreview ? '/admin/approvals' : '/dashboard')}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Enterキーでの送信を防止（textareaは除外）
            if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault()
            }
          }}
          className="space-y-4 sm:space-y-6"
        >
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
                      {projectTypesList.map(type => (
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
                      value={projectId || ''}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                    />
                  ) : (
                    <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                      {projectId || '-'}
                    </div>
                  )}
                </div>

                {/* 氏名（対象社員） */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>氏名（対象社員）</span>
                  </label>
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50">
                    {reportOwner ? (
                      <span className="text-gray-900">
                        {reportOwner.name}{reportOwner.position ? ` (${reportOwner.position})` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">読み込み中...</span>
                    )}
                  </div>
                  {enteredBy && (
                    <p className="mt-1 text-xs text-amber-700">
                      入力者: {enteredBy.name}{enteredBy.position ? `（${enteredBy.position}）` : ''}（代理入力）
                    </p>
                  )}
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
                    disabled={workerRecords.length >= 50}
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
                              {workerNamesList.map(name => (
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
                                  newRecords[index].manHours = calculateManHours(e.target.value, newRecords[index].endTime)
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
                                  newRecords[index].manHours = calculateManHours(newRecords[index].startTime, e.target.value)
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
                              type="text"
                              inputMode="decimal"
                              value={record.manHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                const halfWidth = toHalfWidth(e.target.value)
                                newRecords[index].manHours = parseFloat(halfWidth) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              placeholder="0"
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
                              className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              placeholder="工種を入力"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4 mt-3">
                          <div className="col-span-1 lg:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 当日</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={record.dailyHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                const val = e.target.value
                                newRecords[index].dailyHours = val === '' ? 0 : parseFloat(val) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-1 lg:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 累計</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={record.totalHours || ''}
                              onChange={(e) => {
                                const newRecords = [...workerRecords]
                                const val = e.target.value
                                newRecords[index].totalHours = val === '' ? 0 : parseFloat(val) || 0
                                setWorkerRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
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
                        <div className="grid grid-cols-2 sm:grid-cols-10 gap-3 sm:gap-4">
                          <div className="col-span-2 sm:col-span-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">材料名</label>
                            <select
                              value={record.name}
                              onChange={(e) => {
                                const selectedName = e.target.value
                                const newRecords = [...materialRecords]
                                newRecords[index].name = selectedName
                                const master = materialMasterList.find(m => m.name === selectedName)
                                if (master) {
                                  if (master.unitPrice > 0) {
                                    newRecords[index].unitPrice = master.unitPrice
                                  }
                                  if (master.defaultVolume) {
                                    newRecords[index].volume = master.defaultVolume
                                  }
                                }
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                            >
                              <option value="">選択してください</option>
                              {materialMasterList.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                              ))}
                            </select>
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
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">数量</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={record.quantity || ''}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].quantity = parseFloat(e.target.value) || 0
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                              単価(円)
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={record.unitPrice || ''}
                              onChange={(e) => {
                                const newRecords = [...materialRecords]
                                newRecords[index].unitPrice = parseFloat(e.target.value) || 0
                                setMaterialRecords(newRecords)
                              }}
                              className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-sm text-gray-700">
                            金額 <span className="text-xs text-gray-500">(数量 × 単価)</span>: <span className="font-bold text-lg text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</span>
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
                          <p className="text-sm font-medium text-gray-900">{record.volume || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">数量 / 単価</span>
                          <p className="text-sm font-medium text-gray-900">{record.quantity} / {record.unitPrice.toLocaleString()}円</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">金額</span>
                          <p className="text-sm font-bold text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</p>
                        </div>
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
                          <input
                            type="text"
                            list={`subcontractor-list-${record.id}`}
                            value={record.name}
                            onChange={(e) => {
                              const newRecords = [...subcontractorRecords]
                              newRecords[index].name = e.target.value
                              setSubcontractorRecords(newRecords)
                            }}
                            className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                            placeholder="選択または直接入力"
                          />
                          <datalist id={`subcontractor-list-${record.id}`}>
                            {subcontractorMasterList.map(sub => (
                              <option key={sub} value={sub} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">人数</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={record.workerCount || ''}
                            onChange={(e) => {
                              const newRecords = [...subcontractorRecords]
                              const halfWidth = toHalfWidth(e.target.value)
                              newRecords[index].workerCount = parseInt(halfWidth) || 0
                              setSubcontractorRecords(newRecords)
                            }}
                            className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                            placeholder="人数"
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
                        <input
                          type="text"
                          inputMode="numeric"
                          value={trafficGuardCount || ''}
                          onChange={(e) => {
                            const halfWidth = toHalfWidth(e.target.value)
                            setTrafficGuardCount(parseInt(halfWidth) || 0)
                          }}
                          className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                          placeholder="人数"
                        />
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

          <ContactNotesCard
            contactNotes={contactNotes}
            setContactNotes={setContactNotes}
            isEditing={isEditing}
          />

          <ApprovalSection
            approvals={approvals}
            currentUser={currentUser}
            approvalProcessing={approvalProcessing}
            onApprove={handleApprove}
            onOpenReject={(id) => { setRejectComment(''); setRejectModalApprovalId(id) }}
          />

          <RejectModal
            open={!!rejectModalApprovalId}
            rejectComment={rejectComment}
            setRejectComment={setRejectComment}
            processing={approvalProcessing === rejectModalApprovalId}
            onSubmit={submitReject}
            onCancel={() => { setRejectModalApprovalId(null); setRejectComment('') }}
          />

          <EditFooter
            isEditing={isEditing}
            saving={saving}
            onCancel={() => setIsEditing(false)}
          />
        </form>
      </main>
    </div>
  )
}
