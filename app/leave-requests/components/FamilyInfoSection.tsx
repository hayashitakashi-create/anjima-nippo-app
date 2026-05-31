'use client'

interface Props {
  leaveType: string
  formFamilyName: string
  setFormFamilyName: (v: string) => void
  formFamilyBirthdate: string
  setFormFamilyBirthdate: (v: string) => void
  formFamilyRelationship: string
  setFormFamilyRelationship: (v: string) => void
  formAdoptionDate: string
  setFormAdoptionDate: (v: string) => void
  formSpecialAdoptionDate: string
  setFormSpecialAdoptionDate: (v: string) => void
  formCareReason: string
  setFormCareReason: (v: string) => void
}

export function FamilyInfoSection({
  leaveType,
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
}: Props) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-900">
          対象家族の情報（{leaveType === '看護' ? '子の看護等休暇' : '介護休暇'}）
        </h3>
        <span className="text-[10px] text-amber-700">様式7</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">(1) 氏名</label>
          <input
            type="text"
            value={formFamilyName}
            onChange={(e) => setFormFamilyName(e.target.value)}
            placeholder="対象家族の氏名"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">(2) 生年月日</label>
          <input
            type="text"
            value={formFamilyBirthdate}
            onChange={(e) => setFormFamilyBirthdate(e.target.value)}
            placeholder="例: 昭和60年4月1日 / 1985/4/1"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">(3) 本人との続柄</label>
          <input
            type="text"
            value={formFamilyRelationship}
            onChange={(e) => setFormFamilyRelationship(e.target.value)}
            placeholder="例: 子、父、母"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900"
          />
        </div>
        {leaveType === '看護' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                (4) 縁組成立の年月日 <span className="text-gray-400">(養子の場合)</span>
              </label>
              <input
                type="text"
                value={formAdoptionDate}
                onChange={(e) => setFormAdoptionDate(e.target.value)}
                placeholder="例: 2020/4/1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                (5) 手続完了の年月日 <span className="text-gray-400">(特別養子縁組監護中・里親委託の場合)</span>
              </label>
              <input
                type="text"
                value={formSpecialAdoptionDate}
                onChange={(e) => setFormSpecialAdoptionDate(e.target.value)}
                placeholder="例: 2020/4/1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900"
              />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            (6) {leaveType === '看護' ? '看護' : '介護'}を必要とする理由
          </label>
          <textarea
            value={formCareReason}
            onChange={(e) => setFormCareReason(e.target.value)}
            rows={2}
            placeholder={`${leaveType === '看護' ? '看護' : '介護'}を必要とする理由`}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-sm text-gray-900 resize-none"
          />
        </div>
      </div>
      <div className="text-[11px] text-gray-600 leading-relaxed pt-2 border-t border-amber-200/70 space-y-1.5">
        <p>（注１）当日、電話などで申し出た場合は、出勤後すみやかに提出してください。3については、複数の日を一括して申し出る場合には、申し出る日をすべて記入してください。</p>
        <p>（注２）子の看護等休暇の場合、取得できる日数は、小学校第３学年修了までの子が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
        <p className="pl-[3.5em] -indent-[3.5em]">介護休暇の場合、取得できる日数は、対象となる家族が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
      </div>
    </div>
  )
}
