'use client'

import Image from 'next/image'

interface Props {
  show: boolean
  onBackToDetail: () => void
  onBackToTop: () => void
}

export function SuccessDialog({ show, onBackToDetail, onBackToTop }: Props) {
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
            <p className="text-sm text-white font-bold text-center">作業日報が正常に更新されました</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={onBackToDetail}
              className="w-full px-8 py-3 bg-[#0E3091] text-white text-base rounded-xl hover:bg-[#0a2470] font-bold transition-colors shadow-lg"
            >
              詳細に戻る
            </button>
            <button
              onClick={onBackToTop}
              className="w-full px-8 py-3 bg-gray-800 text-white text-base rounded-xl hover:bg-gray-900 font-bold transition-colors shadow-lg"
            >
              TOP画面に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
