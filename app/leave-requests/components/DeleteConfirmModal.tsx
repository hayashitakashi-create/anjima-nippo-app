'use client'

import { motion, AnimatePresence } from 'motion/react'
import { LeaveRequest } from '../types'
import { formatDisplayDate } from '../utils'

interface Props {
  target: LeaveRequest | null
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ target, deleting, onCancel, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
          >
            <div className="px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">休暇届の削除</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {formatDisplayDate(target.date)}
                </span>
                の{target.leaveType}を削除しますか？
              </p>
              <p className="text-xs text-red-600 mt-2">この操作は取り消せません</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
