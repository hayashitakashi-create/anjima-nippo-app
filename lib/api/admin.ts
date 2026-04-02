import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

// --- Users ---
export function fetchUsers() {
  return apiGet<{ users: any[] }>('/api/admin/users')
}

export function createUser(data: Record<string, unknown>) {
  return apiPost('/api/admin/users', data)
}

export function updateUser(data: Record<string, unknown>) {
  return apiPut('/api/admin/users', data)
}

export function deleteUser(data: { id: string }) {
  return apiDelete(`/api/admin/users?userId=${data.id}`)
}

export function resetUserPassword(data: { id: string; password: string }) {
  return apiPatch('/api/admin/users', data)
}

// --- Materials ---
export function fetchMaterials() {
  return apiGet<{ materials: any[] }>('/api/admin/materials')
}

export function loadDefaultMaterials() {
  return apiPost('/api/admin/materials/load-defaults')
}

export function createMaterial(data: Record<string, unknown>) {
  return apiPost('/api/admin/materials', data)
}

export function updateMaterial(data: Record<string, unknown>) {
  return apiPut('/api/admin/materials', data)
}

export function deleteMaterial(data: { id: string }) {
  return apiDelete(`/api/admin/materials?id=${data.id}`)
}

export function toggleMaterialActive(data: { id: string; isActive: boolean }) {
  return apiPatch('/api/admin/materials', data)
}

// --- Project Types ---
export function fetchProjectTypes() {
  return apiGet<{ projectTypes: any[] }>('/api/admin/project-types')
}

export function createProjectType(data: Record<string, unknown>) {
  return apiPost('/api/admin/project-types', data)
}

export function updateProjectType(data: Record<string, unknown>) {
  return apiPut('/api/admin/project-types', data)
}

export function deleteProjectType(data: { id: string }) {
  return apiDelete(`/api/admin/project-types?id=${data.id}`)
}

// --- Subcontractors ---
export function fetchSubcontractors() {
  return apiGet<{ subcontractors: any[] }>('/api/admin/subcontractors')
}

export function loadDefaultSubcontractors() {
  return apiPost('/api/admin/subcontractors/load-defaults')
}

export function createSubcontractor(data: Record<string, unknown>) {
  return apiPost('/api/admin/subcontractors', data)
}

export function updateSubcontractor(data: Record<string, unknown>) {
  return apiPut('/api/admin/subcontractors', data)
}

export function deleteSubcontractor(data: { id: string }) {
  return apiDelete(`/api/admin/subcontractors?id=${data.id}`)
}

export function toggleSubcontractorActive(data: { id: string; isActive: boolean }) {
  return apiPatch('/api/admin/subcontractors', data)
}

export function mergeSubcontractors(data: { sourceId: string; targetId: string }) {
  return apiPost('/api/admin/subcontractors', { action: 'merge', ...data })
}

// --- Units ---
export function fetchUnits() {
  return apiGet<{ units: any[] }>('/api/admin/units')
}

export function loadDefaultUnits() {
  return apiPost('/api/admin/units/load-defaults')
}

export function createUnit(data: Record<string, unknown>) {
  return apiPost('/api/admin/units', data)
}

export function updateUnit(data: Record<string, unknown>) {
  return apiPut('/api/admin/units', data)
}

export function deleteUnit(data: { id: string }) {
  return apiDelete(`/api/admin/units?id=${data.id}`)
}

// --- Workers ---
export function fetchWorkers() {
  return apiGet<{ workers: any[] }>('/api/admin/workers')
}

export function loadDefaultWorkers() {
  return apiPost('/api/admin/workers', { loadDefaults: true })
}

export function createWorker(data: Record<string, unknown>) {
  return apiPost('/api/admin/workers', data)
}

export function updateWorker(data: Record<string, unknown>) {
  return apiPut('/api/admin/workers', data)
}

export function deleteWorker(data: { id: string }) {
  return apiDelete(`/api/admin/workers?id=${data.id}`)
}

export function mergeWorkers(data: { sourceId: string; targetId: string }) {
  return apiPost('/api/admin/workers', { action: 'merge', ...data })
}

// --- Approvals ---
export function fetchApprovals(params?: string) {
  const url = params ? `/api/admin/approvals?${params}` : '/api/admin/approvals'
  return apiGet(url)
}

export function approveReport(data: Record<string, unknown>) {
  return apiPost('/api/admin/approvals', data)
}

export function rejectReport(data: Record<string, unknown>) {
  return apiPut('/api/admin/approvals', data)
}

export function remandReport(data: Record<string, unknown>) {
  return apiPatch('/api/admin/approvals', data)
}

export function deleteApproval(data: Record<string, unknown>) {
  return apiDelete('/api/admin/approvals', data)
}

// --- Leave Approvals ---
export function fetchLeaveApprovals(params?: string) {
  const url = params ? `/api/admin/leave-approvals?${params}` : '/api/admin/leave-approvals'
  return apiGet(url)
}

export function updateLeaveApproval(data: Record<string, unknown>) {
  return apiPut('/api/admin/leave-approvals', data)
}

// --- System Settings ---
export function fetchSystemSettings() {
  return apiGet('/api/admin/system-settings')
}

export function fetchSystemSetting(key: string) {
  return apiGet(`/api/admin/system-settings?key=${key}`)
}

export function updateSystemSettings(data: Record<string, unknown>) {
  return apiPut('/api/admin/system-settings', data)
}

export function saveSystemSetting(key: string, value: unknown) {
  return apiPut('/api/admin/system-settings', { key, value })
}

// --- Approval Routes ---
export function fetchApprovalRoutes() {
  return apiGet('/api/admin/approval-routes')
}

export function createApprovalRoute(data: Record<string, unknown>) {
  return apiPost('/api/admin/approval-routes', data)
}

export function updateApprovalRoute(data: Record<string, unknown>) {
  return apiPut('/api/admin/approval-routes', data)
}

export function deleteApprovalRoute(id: string) {
  return apiDelete(`/api/admin/approval-routes?id=${id}`)
}
