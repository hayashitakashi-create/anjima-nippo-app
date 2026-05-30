'use client'

import { useState } from 'react'
import { KeyRound, Eye, EyeOff, X } from 'lucide-react'
import { adminApi } from '@/lib/api'

interface Props {
  userId: string
  userName: string
  onClose: () => void
}

// 管理者による他ユーザーのパスワードリセット (田邊様5/28 FB⑨)
export function ResetPasswordModal({ userId, userName, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await adminApi.resetUserPassword({ id: userId, password })
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'パスワードのリセットに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            パスワードリセット
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{userName}</span> さんのパスワードを再設定します。
          </p>
          {done ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
              リセットしました。次回ログイン時に本人へパスワード再設定を求めます。
            </p>
          ) : (
            <>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="新しいパスワード（8文字以上）"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <p className="text-xs text-gray-500">※ パスワードを忘れた社員に新しいパスワードを設定できます。</p>
            </>
          )}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
          {done ? (
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
              閉じる
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                キャンセル
              </button>
              <button onClick={handleReset} disabled={submitting || password.length === 0}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 text-sm font-medium">
                {submitting ? 'リセット中...' : 'リセットする'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
