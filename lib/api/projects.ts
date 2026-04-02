import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export function fetchProjects(status?: string) {
  const url = status ? `/api/projects?status=${status}` : '/api/projects'
  return apiGet(url)
}

export function fetchProject(id: string) {
  return apiGet(`/api/projects/${id}`)
}

export function createProject(data: Record<string, unknown>) {
  return apiPost('/api/projects', data)
}

export function updateProject(id: string, data: Record<string, unknown>) {
  return apiPut(`/api/projects/${id}`, data)
}

export function updateProjectStatus(id: string, data: { status: string }) {
  return apiPatch(`/api/projects/${id}`, data)
}

export function deleteProject(id: string) {
  return apiDelete(`/api/projects/${id}`)
}
