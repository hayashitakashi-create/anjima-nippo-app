export interface VisitRecordInput {
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
  order: number
}

export interface DailyReportInput {
  date: Date | string
  userId: string
  specialNotes?: string
  visitRecords: VisitRecordInput[]
}

export interface DailyReportWithRelations {
  id: string
  date: Date
  userId: string
  user: {
    id: string
    name: string
    position?: string
  }
  specialNotes?: string
  visitRecords: {
    id: string
    destination: string
    contactPerson?: string
    startTime?: string
    endTime?: string
    content?: string
    expense?: number
    order: number
  }[]
  approvals: {
    id: string
    approverRole: string
    approverUserId?: string
    approver?: {
      id: string
      name: string
      position?: string
    }
    approvedAt?: Date
    status: string
  }[]
  createdAt: Date
  updatedAt: Date
}
