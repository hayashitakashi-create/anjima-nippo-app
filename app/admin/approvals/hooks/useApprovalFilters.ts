'use client'

import { useState } from 'react'

export function useApprovalFilters() {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedReportType, setSelectedReportType] = useState<'' | 'sales' | 'work'>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const clearFilters = () => {
    setSelectedUserId('')
    setSelectedRole('')
    setSelectedReportType('')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = !!(selectedUserId || selectedRole || startDate || endDate || selectedReportType)

  return {
    selectedUserId, setSelectedUserId,
    selectedRole, setSelectedRole,
    selectedReportType, setSelectedReportType,
    startDate, setStartDate,
    endDate, setEndDate,
    showFilters, setShowFilters,
    clearFilters,
    hasActiveFilters,
  }
}
