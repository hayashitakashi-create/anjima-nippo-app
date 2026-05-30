'use client'

import { UNREGISTERED_APPLICANT } from '../types'

interface Props {
  allUsers: { id: string; name: string }[]
  formTargetUserId: string
  setFormTargetUserId: (id: string) => void
  formApplicantName: string
  setFormApplicantName: (name: string) => void
  formProxyWriterName: string
  setFormProxyWriterName: (name: string) => void
  userId?: string
  userName?: string
}

export function ApplicantField({
  allUsers,
  formTargetUserId,
  setFormTargetUserId,
  formApplicantName,
  setFormApplicantName,
  formProxyWriterName,
  setFormProxyWriterName,
  userId,
  userName,
}: Props) {
  const isUnregistered = formTargetUserId === UNREGISTERED_APPLICANT
  const isProxyRegistered = !!formTargetUserId && !isUnregistered && formTargetUserId !== userId
  const isProxy = isUnregistered || isProxyRegistered

  const handleSelect = (id: string) => {
    setFormTargetUserId(id)
    if (id === UNREGISTERED_APPLICANT) {
      setFormApplicantName('')
      return
    }
    const u = allUsers.find(x => x.id === id)
    if (u) setFormApplicantName(u.name)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        申請者 <span className="text-red-500">*</span>
      </label>
      <select
        value={formTargetUserId}
        onChange={(e) => handleSelect(e.target.value)}
        required
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
      >
        <option value="">選択してください</option>
        {allUsers.map(u => (
          <option key={u.id} value={u.id}>
            {u.name}{u.id === userId ? '（本人）' : ''}
          </option>
        ))}
        <option value={UNREGISTERED_APPLICANT}>＋ アカウント未登録者（名前を直接入力）</option>
      </select>

      {isUnregistered && (
        <div className="mt-2">
          <input
            type="text"
            value={formApplicantName}
            onChange={(e) => setFormApplicantName(e.target.value)}
            required
            placeholder="申請者の氏名を入力（例: 実習生 〇〇）"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
          />
          <p className="mt-1 text-xs text-amber-700">
            アカウント未登録者の代理申請です。
          </p>
        </div>
      )}

      {isProxyRegistered && (
        <p className="mt-1 text-xs text-amber-700">
          {allUsers.find(u => u.id === formTargetUserId)?.name} さんの休暇届を代理で申請します
        </p>
      )}

      {isProxy && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            代理記入者 <span className="text-gray-400 text-xs">(実際に記入した方)</span>
          </label>
          <input
            type="text"
            value={formProxyWriterName}
            onChange={(e) => setFormProxyWriterName(e.target.value)}
            placeholder={userName ? `例: ${userName}` : '記入した方の氏名'}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            共有アカウントの場合は、実際に記入した方の氏名を入力してください（未入力時はログイン名「{userName}」で記録）
          </p>
        </div>
      )}
    </div>
  )
}
