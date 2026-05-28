'use client'

import { motion } from 'motion/react'
import { Plus, Send, Eye } from 'lucide-react'
import { LEAVE_TYPES, LEAVE_UNITS, TIME_OPTIONS } from '../types'
import { useLeaveRequestForm } from '../hooks/useLeaveRequestForm'
import { FamilyInfoSection } from './FamilyInfoSection'

type FormApi = ReturnType<typeof useLeaveRequestForm>

interface Props {
  form: FormApi
  userId?: string
  userName?: string
  onPreview: () => void
}

export function LeaveRequestForm({ form, userId, userName, onPreview }: Props) {
  const {
    submitting,
    isCareLeaveType,
    allUsers,
    formTargetUserId,
    setFormTargetUserId,
    setFormApplicantName,
    formDate,
    setFormDate,
    formLeaveType,
    setFormLeaveType,
    formLeaveUnit,
    setFormLeaveUnit,
    formStartTime,
    setFormStartTime,
    formEndTime,
    setFormEndTime,
    formFamilyName,
    setFormFamilyName,
    formFamilyBirthdate,
    setFormFamilyBirthdate,
    formFamilyRelationship,
    setFormFamilyRelationship,
    formAdoptionDate,
    setFormAdoptionDate,
    formSpecialAdoptionDate,
    setFormSpecialAdoptionDate,
    formCareReason,
    setFormCareReason,
    formReason,
    setFormReason,
    handleSubmit,
  } = form

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8]">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          新規休暇届
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            対象社員 <span className="text-red-500">*</span>
          </label>
          <select
            value={formTargetUserId}
            onChange={(e) => {
              const id = e.target.value
              setFormTargetUserId(id)
              const u = allUsers.find(x => x.id === id)
              if (u) setFormApplicantName(u.name)
            }}
            required
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">選択してください</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}{u.id === userId ? '（本人）' : ''}
              </option>
            ))}
          </select>
          {formTargetUserId && formTargetUserId !== userId && (
            <p className="mt-1 text-xs text-amber-700">
              代理入力モード: あなた（{userName}）が {allUsers.find(u => u.id === formTargetUserId)?.name} さんの休暇届を申請します
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              休暇日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              休暇種別 <span className="text-red-500">*</span>
            </label>
            <select
              value={formLeaveType}
              onChange={(e) => setFormLeaveType(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
            >
              {LEAVE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            休暇単位 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {LEAVE_UNITS.map(unit => (
              <button
                key={unit.value}
                type="button"
                onClick={() => setFormLeaveUnit(unit.value)}
                className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                  formLeaveUnit === unit.value
                    ? 'bg-[#0E3091] text-white border-[#0E3091]'
                    : 'bg-white text-gray-700 border-slate-300 hover:border-[#0E3091] hover:text-[#0E3091]'
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>

        {formLeaveUnit === 'hourly' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始時刻 <span className="text-red-500">*</span>
              </label>
              <select
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">選択</option>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了時刻 <span className="text-red-500">*</span>
              </label>
              <select
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">選択</option>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {isCareLeaveType && (
          <FamilyInfoSection
            leaveType={formLeaveType}
            formFamilyName={formFamilyName}
            setFormFamilyName={setFormFamilyName}
            formFamilyBirthdate={formFamilyBirthdate}
            setFormFamilyBirthdate={setFormFamilyBirthdate}
            formFamilyRelationship={formFamilyRelationship}
            setFormFamilyRelationship={setFormFamilyRelationship}
            formAdoptionDate={formAdoptionDate}
            setFormAdoptionDate={setFormAdoptionDate}
            formSpecialAdoptionDate={formSpecialAdoptionDate}
            setFormSpecialAdoptionDate={setFormSpecialAdoptionDate}
            formCareReason={formCareReason}
            setFormCareReason={setFormCareReason}
          />
        )}

        {!isCareLeaveType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              理由 <span className="text-gray-400 text-xs">(任意)</span>
            </label>
            <textarea
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              rows={2}
              placeholder="休暇の理由を入力（任意）"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 resize-none"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center px-5 py-2.5 bg-white text-[#0E3091] font-medium rounded-lg border border-[#0E3091] hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            プレビュー
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2.5 bg-[#0E3091] text-white font-medium rounded-lg hover:bg-[#0a2470] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? '申請中...' : '休暇届を申請'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
