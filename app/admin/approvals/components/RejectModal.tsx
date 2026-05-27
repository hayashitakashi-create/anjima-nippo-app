'use client'

import { Undo2 } from 'lucide-react'

type RejectModalState =
  | null
  | { kind: 'individual'; approvalId: string; reportId: string }
  | { kind: 'all'; reportId: string }
  | { kind: 'bulk'; reportIds: string[] }

interface Props {
  modal: RejectModalState
  comment: string
  setComment: (v: string) => void
  processing: string | null
  onSubmit: () => void
  onClose: () => void
}

export function RejectModal({ modal, comment, setComment, processing, onSubmit, onClose }: Props) {
  if (!modal) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-red-600" />
            {modal.kind === 'individual' ? '差戻し（個別）' : modal.kind === 'all' ? '差戻し（この日報の全段階）' : `差戻し（${modal.reportIds.length}件まとめて）`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">差戻しの理由を入力してください（提出者へ通知されます）</p>
        </div>
        <div className="px-6 py-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例：訪問記録の記載が不足しています。詳細を追記してください。"
            maxLength={500}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            キャンセル
          </button>
          <button
            onClick={onSubmit}
            disabled={!comment.trim() || processing !== null}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg inline-flex items-center gap-1.5"
          >
            <Undo2 className="w-4 h-4" />
            差戻し
          </button>
        </div>
      </div>
    </div>
  )
}
