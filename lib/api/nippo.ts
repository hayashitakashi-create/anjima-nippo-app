import { apiGet, apiPost, apiPut, apiDelete } from './client'

export function fetchNippoList(params?: string) {
  const url = params ? `/api/nippo/list?${params}` : '/api/nippo/list'
  return apiGet(url)
}

export function fetchNippo(id: string) {
  return apiGet(`/api/nippo/${id}`)
}

export function createNippo(data: Record<string, unknown>) {
  return apiPost('/api/nippo', data)
}

export function updateNippo(id: string, data: Record<string, unknown>) {
  return apiPut(`/api/nippo/${id}`, data)
}

export function deleteNippo(id: string) {
  return apiDelete(`/api/nippo/${id}`)
}
