import { apiGet, apiPost, apiPut } from './client'

// --- Auth ---
export function login(data: { username: string; password: string }) {
  return apiPost('/api/auth/login', data)
}

export function logout() {
  return apiPost('/api/auth/logout')
}

export function fetchCurrentUser() {
  return apiGet<{ user: any }>('/api/auth/me')
}

// --- Notifications ---
export function fetchNotifications(params?: string) {
  const url = params ? `/api/notifications?${params}` : '/api/notifications'
  return apiGet(url)
}

export function markNotificationRead(data: { id: string }) {
  return apiPost('/api/notifications', data)
}

export function markAllNotificationsRead() {
  return apiPut('/api/notifications')
}

export function fetchUnsubmittedNotifications() {
  return apiGet('/api/notifications/unsubmitted')
}

// --- Leave Requests ---
export function fetchLeaveRequests(params?: string) {
  const url = params ? `/api/leave-requests?${params}` : '/api/leave-requests'
  return apiGet(url)
}

export function createLeaveRequest(data: Record<string, unknown>) {
  return apiPost('/api/leave-requests', data)
}

// --- Templates ---
export function fetchTemplates() {
  return apiGet('/api/templates')
}

// --- User Settings ---
export function updateUserProfile(data: Record<string, unknown>) {
  return apiPost('/api/user/update', data)
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return apiPost('/api/user/change-password', data)
}
