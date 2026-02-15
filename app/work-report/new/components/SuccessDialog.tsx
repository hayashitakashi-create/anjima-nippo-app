'use client'

import Image from 'next/image'

interface SuccessDialogProps {
  show: boolean
  projectRefId: string | null
  onContinue: () => void
  onGoToProjects: () => void
  onClose: () => void
}

export function SuccessDialog({
  show,
  projectRefId,
  onContinue,
  onGoToProjects,
  onClose,
}: SuccessDialogProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4">
        <div className="bg-white pt-8 pb-2 px-8 rounded-t-2xl">
          <div className="mx-auto w-36 h-36 mb-4">
            <Image
              src="/character.png"
              alt="保存完了キャラクター"
              width={144}
              height={144}
              className="object-contain object-top"
              priority
            />
          </div>
        </div>
        <div className="h-8 bg-white"></div>
        <div className="bg-white px-6 pb-6 rounded-b-2xl">
          <div className="bg-[#0E3091] rounded-lg py-3 px-4 mb-4">
            <p className="text-sm text-white font-bold text-center">作業日報が正常に保存されました</p>
          </div>
          {projectRefId ? (
            <div className="space-y-3">
              <button
                onClick={onContinue}
                className="w-full px-8 py-3 bg-[#0E3091] text-white text-base rounded-xl hover:bg-[#0a2470] font-bold transition-colors shadow-lg"
              >
                同じ物件で続けて作成
              </button>
              <button
                onClick={onGoToProjects}
                className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
              >
                物件一覧に戻る
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
