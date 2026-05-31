'use client'

import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { leaveUnitLabel, formatDisplayDate } from '../utils'

interface Props {
  show: boolean
  onClose: () => void
  formApplicantName: string
  formDate: string
  formLeaveType: string
  formLeaveUnit: string
  formStartTime: string
  formEndTime: string
  isCareLeaveType: boolean
  formFamilyName: string
  formFamilyBirthdate: string
  formFamilyRelationship: string
  formAdoptionDate: string
  formSpecialAdoptionDate: string
  formCareReason: string
  formReason: string
}

export function PreviewModal({
  show,
  onClose,
  formApplicantName,
  formDate,
  formLeaveType,
  formLeaveUnit,
  formStartTime,
  formEndTime,
  isCareLeaveType,
  formFamilyName,
  formFamilyBirthdate,
  formFamilyRelationship,
  formAdoptionDate,
  formSpecialAdoptionDate,
  formCareReason,
  formReason,
}: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-2xl my-8 relative"
            style={{ width: '210mm', maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors z-10"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="px-[15mm] py-[12mm] font-sans text-gray-900">
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold tracking-widest border-b-2 border-gray-900 inline-block pb-1 px-6">
                  休 暇 届
                </h1>
              </div>
              <div className="text-right mb-3 text-xs">
                申請日: {new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日
              </div>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm">安島工業株式会社 御中</p>
                <div className="text-right">
                  <p className="text-[11px] text-gray-700">申請者</p>
                  <p className="text-base font-bold leading-tight">
                    {formApplicantName || <span className="text-gray-400">(未入力)</span>}
                  </p>
                </div>
              </div>
              <table className="w-full border-collapse text-xs mb-3">
                <tbody>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium w-1/4">休暇日</th>
                    <td className="border border-gray-400 px-3 py-1.5">
                      {formDate ? formatDisplayDate(formDate) : <span className="text-gray-400">(未入力)</span>}
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">休暇種別</th>
                    <td className="border border-gray-400 px-3 py-1.5">{formLeaveType}</td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">休暇単位</th>
                    <td className="border border-gray-400 px-3 py-1.5">
                      {leaveUnitLabel(formLeaveUnit)}
                      {formLeaveUnit === 'hourly' && formStartTime && formEndTime && (
                        <span className="ml-2">（{formStartTime} 〜 {formEndTime}）</span>
                      )}
                    </td>
                  </tr>
                  {isCareLeaveType && (
                    <tr>
                      <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top">対象家族</th>
                      <td className="border border-gray-400 px-3 py-1.5">
                        <div className="space-y-0.5">
                          {formFamilyName && <div>氏名：{formFamilyName}</div>}
                          {formFamilyBirthdate && <div>生年月日：{formFamilyBirthdate}</div>}
                          {formFamilyRelationship && <div>続柄：{formFamilyRelationship}</div>}
                          {formLeaveType === '看護' && formAdoptionDate && <div>縁組成立年月日：{formAdoptionDate}</div>}
                          {formLeaveType === '看護' && formSpecialAdoptionDate && <div>手続完了年月日：{formSpecialAdoptionDate}</div>}
                          {!formFamilyName && !formFamilyBirthdate && !formFamilyRelationship && !formAdoptionDate && !formSpecialAdoptionDate && (
                            <span className="text-gray-400">（未入力）</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isCareLeaveType && (
                    <tr>
                      <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top">申出理由</th>
                      <td className="border border-gray-400 px-3 py-1.5 h-16 whitespace-pre-wrap align-top">{formCareReason}</td>
                    </tr>
                  )}
                  {!isCareLeaveType && (
                    <tr>
                      <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top">理由</th>
                      <td className="border border-gray-400 px-3 py-1.5 h-20 whitespace-pre-wrap align-top">{formReason}</td>
                    </tr>
                  )}
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">承認状況</th>
                    <td className="border border-gray-400 px-3 py-1.5 text-gray-500">未申請（プレビュー）</td>
                  </tr>
                </tbody>
              </table>
              {isCareLeaveType && (
                <div className="text-[10px] text-gray-700 leading-relaxed space-y-1 mb-3">
                  <p>（注１）当日、電話などで申し出た場合は、出勤後すみやかに提出してください。取得する日については、複数の日を一括して申し出る場合には、申し出る日をすべて記入してください。</p>
                  <p>（注２）子の看護等休暇の場合、取得できる日数は、小学校第３学年修了までの子が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
                  <p className="pl-[3.5em] -indent-[3.5em]">介護休暇の場合、取得できる日数は、対象となる家族が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
                </div>
              )}
              <div className="mt-6">
                <table className="ml-auto border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 bg-gray-100 px-6 py-1.5 text-[10px] font-medium">承認者</th>
                      <th className="border border-gray-400 bg-gray-100 px-6 py-1.5 text-[10px] font-medium">申請者</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 w-24 h-16"></td>
                      <td className="border border-gray-400 w-24 h-16"></td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-3 text-center text-[10px] text-gray-700">安島工業株式会社</div>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-gray-50 rounded-b-lg">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
