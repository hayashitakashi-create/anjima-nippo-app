import { apiGet, apiPost, apiPut, apiDelete } from './client'

export function fetchWorkReport(id: string) {
  return apiGet(`/api/work-report/${id}`)
}

export function createWorkReport(data: Record<string, unknown>) {
  return apiPost('/api/work-report', data)
}

export function updateWorkReport(id: string, data: Record<string, unknown>) {
  return apiPut(`/api/work-report/${id}`, data)
}

export function deleteWorkReport(id: string) {
  return apiDelete(`/api/work-report/${id}`)
}

export function fetchPreviousWorkReport(params: string) {
  return apiGet(`/api/work-report/previous?${params}`)
}

export function bulkCreateWorkReports(data: Record<string, unknown>) {
  return apiPost('/api/work-reports/bulk', data)
}
