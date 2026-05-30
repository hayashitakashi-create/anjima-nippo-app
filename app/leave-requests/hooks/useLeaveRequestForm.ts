'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, apiPost, ApiError } from '@/lib/api'
import { toDateString, formatYearMonth } from '../utils'
import { UNREGISTERED_APPLICANT } from '../types'

interface UseLeaveRequestFormParams {
  userId?: string
  userName?: string
  currentMonth: string
  onSubmitted: () => void
}

export function useLeaveRequestForm({ userId, userName, currentMonth, onSubmitted }: UseLeaveRequestFormParams) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formApplicantName, setFormApplicantName] = useState('')
  const [formDate, setFormDate] = useState(toDateString(new Date()))
  const [formLeaveType, setFormLeaveType] = useState('有給')
  const [formLeaveUnit, setFormLeaveUnit] = useState('full')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formFamilyName, setFormFamilyName] = useState('')
  const [formFamilyBirthdate, setFormFamilyBirthdate] = useState('')
  const [formFamilyRelationship, setFormFamilyRelationship] = useState('')
  const [formAdoptionDate, setFormAdoptionDate] = useState('')
  const [formSpecialAdoptionDate, setFormSpecialAdoptionDate] = useState('')
  const [formCareReason, setFormCareReason] = useState('')
  const [formReason, setFormReason] = useState('')

  const [workerNames, setWorkerNames] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([])
  const [formTargetUserId, setFormTargetUserId] = useState('')

  const isCareLeaveType = formLeaveType === '看護' || formLeaveType === '介護'

  useEffect(() => {
    adminApi.fetchWorkers()
      .then(data => {
        if (data?.workers) {
          const names = data.workers.filter((w: any) => w.isActive).map((w: any) => w.name)
          setWorkerNames(names)
          if (userName && names.includes(userName)) {
            setFormApplicantName(userName)
          }
        }
      })
      .catch(() => {})
    adminApi.fetchUsers()
      .then(data => {
        if (data?.users) {
          const list = (data.users as any[])
            .filter(u => u.isActive !== false)
            .map(u => ({ id: u.id, name: u.name }))
          setAllUsers(list)
          if (userId) setFormTargetUserId(userId)
        }
      })
      .catch(() => {})
  }, [userId, userName])

  const resetForm = () => {
    setFormTargetUserId(userId || '')
    setFormApplicantName(userName && workerNames.includes(userName) ? userName : '')
    setFormDate(toDateString(new Date()))
    setFormLeaveType('有給')
    setFormLeaveUnit('full')
    setFormStartTime('')
    setFormEndTime('')
    setFormFamilyName('')
    setFormFamilyBirthdate('')
    setFormFamilyRelationship('')
    setFormAdoptionDate('')
    setFormSpecialAdoptionDate('')
    setFormCareReason('')
    setFormReason('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const isUnregistered = formTargetUserId === UNREGISTERED_APPLICANT
      const selectedTargetUser = allUsers.find(u => u.id === formTargetUserId)
      const targetUserIdForPost = !isUnregistered && formTargetUserId && formTargetUserId !== userId ? formTargetUserId : undefined
      const applicantNameForPost = isUnregistered ? (formApplicantName || undefined) : (formApplicantName || selectedTargetUser?.name || undefined)
      await apiPost('/api/leave-requests', {
        targetUserId: targetUserIdForPost,
        applicantName: applicantNameForPost,
        proxyForUnregistered: isUnregistered,
        date: formDate,
        leaveType: formLeaveType,
        leaveUnit: formLeaveUnit,
        startTime: formLeaveUnit === 'hourly' ? formStartTime : undefined,
        endTime: formLeaveUnit === 'hourly' ? formEndTime : undefined,
        familyName: isCareLeaveType ? (formFamilyName || undefined) : undefined,
        familyBirthdate: isCareLeaveType ? (formFamilyBirthdate || undefined) : undefined,
        familyRelationship: isCareLeaveType ? (formFamilyRelationship || undefined) : undefined,
        adoptionDate: isCareLeaveType ? (formAdoptionDate || undefined) : undefined,
        specialAdoptionDate: isCareLeaveType ? (formSpecialAdoptionDate || undefined) : undefined,
        careReason: isCareLeaveType ? (formCareReason || undefined) : undefined,
        reason: !isCareLeaveType ? (formReason || undefined) : undefined,
      })

      setMessage('休暇届を申請しました（承認待ち）')
      const submittedDate = new Date(formDate)
      resetForm()
      if (formatYearMonth(submittedDate) === currentMonth) {
        onSubmitted()
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
      } else {
        setError(err instanceof Error ? err.message : '登録に失敗しました')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    submitting,
    message,
    setMessage,
    error,
    setError,
    isCareLeaveType,
    allUsers,
    formTargetUserId,
    setFormTargetUserId,
    formApplicantName,
    setFormApplicantName,
    formDate,
    setFormDate,
    formLeaveType,
    setFormLeaveType,
    formLeaveUnit,
    setFormLeaveUnit,
    formStartTime,
    setFormStartTime,
    formEndTime,
    setFormEndTime,
    formFamilyName,
    setFormFamilyName,
    formFamilyBirthdate,
    setFormFamilyBirthdate,
    formFamilyRelationship,
    setFormFamilyRelationship,
    formAdoptionDate,
    setFormAdoptionDate,
    formSpecialAdoptionDate,
    setFormSpecialAdoptionDate,
    formCareReason,
    setFormCareReason,
    formReason,
    setFormReason,
    handleSubmit,
  }
}
