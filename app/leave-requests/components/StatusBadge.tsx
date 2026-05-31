import { Clock, CheckCircle2, XCircle } from 'lucide-react'

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          承認待ち
        </span>
      )
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          承認済み
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          差戻し
        </span>
      )
    default:
      return null
  }
}
