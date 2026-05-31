'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { LeaveRequest } from './types'
import { useLeaveRequests } from './hooks/useLeaveRequests'
import { useLeaveRequestForm } from './hooks/useLeaveRequestForm'
import { PageHeader } from './components/PageHeader'
import { MessageBanner } from './components/MessageBanner'
import { LeaveRequestForm } from './components/LeaveRequestForm'
import { LeaveCalendar } from './components/LeaveCalendar'
import { LeaveRequestList } from './components/LeaveRequestList'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { PreviewModal } from './components/PreviewModal'

export default function LeaveRequestsPage() {
  const { user } = useAuth({ required: true })
  const list = useLeaveRequests('mine')
  const form = useLeaveRequestForm({
    userId: user?.id,
    userName: user?.name,
    currentMonth: list.currentMonth,
    onSubmitted: list.fetchLeaveRequests,
  })

  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const isAdmin = user?.role === 'admin'

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const ok = await list.deleteRequest(deleteTarget.id)
    if (ok) {
      form.setMessage('休暇届を削除しました')
      setDeleteTarget(null)
    }
    setDeleting(false)
  }

  if (list.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-600">
          読み込み中...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader />

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        <MessageBanner
          message={form.message}
          error={form.error || list.error}
          onCloseMessage={() => form.setMessage('')}
          onCloseError={() => {
            form.setError('')
            list.setError('')
          }}
        />

        <LeaveRequestForm
          form={form}
          userId={user?.id}
          userName={user?.name}
          onPreview={() => setShowPreview(true)}
        />

        <LeaveCalendar
          calendarDate={list.calendarDate}
          leaveRequests={list.leaveRequests}
          onPrevMonth={list.prevMonth}
          onNextMonth={list.nextMonth}
        />

        <LeaveRequestList
          month={list.calendarDate.getMonth() + 1}
          leaveRequests={list.leaveRequests}
          isAdmin={isAdmin}
          scope={list.scope}
          setScope={list.setScope}
          onDeleteClick={setDeleteTarget}
        />
      </main>

      <DeleteConfirmModal
        target={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <PreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        formApplicantName={form.formApplicantName}
        formDate={form.formDate}
        formLeaveType={form.formLeaveType}
        formLeaveUnit={form.formLeaveUnit}
        formStartTime={form.formStartTime}
        formEndTime={form.formEndTime}
        isCareLeaveType={form.isCareLeaveType}
        formFamilyName={form.formFamilyName}
        formFamilyBirthdate={form.formFamilyBirthdate}
        formFamilyRelationship={form.formFamilyRelationship}
        formAdoptionDate={form.formAdoptionDate}
        formSpecialAdoptionDate={form.formSpecialAdoptionDate}
        formCareReason={form.formCareReason}
        formReason={form.formReason}
      />
    </div>
  )
}
