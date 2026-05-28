import { LEAVE_UNITS, DAY_NAMES } from './types'

export function leaveUnitLabel(unit: string): string {
  return LEAVE_UNITS.find(u => u.value === unit)?.label || '全日'
}

export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日(${DAY_NAMES[date.getDay()]})`
}
