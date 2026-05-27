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
import { useAuth } from '@/hooks/useAuth'
import { useMasterData } from '@/hooks/useMasterData'
import { useWorkReportDetail } from './hooks/useWorkReportDetail'
import {
  SuccessDialog,
  DeleteConfirmDialog,
  DetailHeader,
  DetailToolbar,
  BasicInfoCard,
  WorkerRecordsCard,
  MaterialRecordsCard,
  SubcontractorCard,
  RemoteTrafficCard,
  ContactNotesCard,
  ApprovalSection,
  RejectModal,
  EditFooter,
} from './components'

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
          <BasicInfoCard
            isEditing={isEditing}
            projectName={projectName}
            setProjectName={setProjectName}
            projectType={projectType}
            setProjectType={setProjectType}
            projectId={projectId}
            setProjectId={setProjectId}
            date={date}
            setDate={setDate}
            weather={weather}
            setWeather={setWeather}
            projectTypesList={projectTypesList}
            reportOwner={reportOwner}
            enteredBy={enteredBy}
          />

          <WorkerRecordsCard
            workerRecords={workerRecords}
            setWorkerRecords={setWorkerRecords}
            isEditing={isEditing}
            onAdd={handleAddWorkerRecord}
            onDelete={handleDeleteWorkerRecord}
            workerNamesList={workerNamesList}
          />

          <MaterialRecordsCard
            materialRecords={materialRecords}
            setMaterialRecords={setMaterialRecords}
            isEditing={isEditing}
            onAdd={handleAddMaterialRecord}
            onDelete={handleDeleteMaterialRecord}
            materialMasterList={materialMasterList}
            totalAmount={totalAmount}
          />

          <SubcontractorCard
            subcontractorRecords={subcontractorRecords}
            setSubcontractorRecords={setSubcontractorRecords}
            isEditing={isEditing}
            onAdd={handleAddSubcontractorRecord}
            onDelete={handleDeleteSubcontractorRecord}
            subcontractorMasterList={subcontractorMasterList}
          />

          <RemoteTrafficCard
            isEditing={isEditing}
            remoteDepartureTime={remoteDepartureTime}
            setRemoteDepartureTime={setRemoteDepartureTime}
            remoteArrivalTime={remoteArrivalTime}
            setRemoteArrivalTime={setRemoteArrivalTime}
            remoteDepartureTime2={remoteDepartureTime2}
            setRemoteDepartureTime2={setRemoteDepartureTime2}
            remoteArrivalTime2={remoteArrivalTime2}
            setRemoteArrivalTime2={setRemoteArrivalTime2}
            trafficGuardCount={trafficGuardCount}
            setTrafficGuardCount={setTrafficGuardCount}
            trafficGuardStart={trafficGuardStart}
            setTrafficGuardStart={setTrafficGuardStart}
            trafficGuardEnd={trafficGuardEnd}
            setTrafficGuardEnd={setTrafficGuardEnd}
          />

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
