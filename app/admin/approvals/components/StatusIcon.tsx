'use client'

import { CheckCircle, XCircle, Clock } from 'lucide-react'

export function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4" />
    case 'rejected': return <XCircle className="w-4 h-4" />
    case 'partial': return <Clock className="w-4 h-4" />
    case 'pending': return <Clock className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}
