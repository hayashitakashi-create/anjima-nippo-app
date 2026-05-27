'use client'

interface Props {
  open: boolean
  rejectComment: string
  setRejectComment: (v: string) => void
  processing: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function RejectModal({ open, rejectComment, setRejectComment, processing, onSubmit, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">差戻しコメント</h3>
        <p className="text-sm text-gray-600 mb-3">差戻しの理由を入力してください。提出者に通知されます。</p>
        <textarea
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          placeholder="例：使用材料の容量が誤っています。"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold"
          >
            {processing ? '送信中...' : '差戻しする'}
          </button>
        </div>
      </div>
    </div>
  )
}
