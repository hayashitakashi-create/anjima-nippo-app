'use client'

import { MessageSquare } from 'lucide-react'

interface Props {
  contactNotes: string
  setContactNotes: (v: string) => void
  isEditing: boolean
}

export function ContactNotesCard({ contactNotes, setContactNotes, isEditing }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0E3091]/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#0E3091]" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">連絡事項</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {isEditing ? (
          <>
            <textarea
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] resize-none transition-all"
              placeholder="その他の連絡事項・特記事項などを入力してください"
            />
            <div className="text-xs sm:text-sm text-gray-500 mt-2 text-right">
              {contactNotes.length} / 500文字
            </div>
          </>
        ) : (
          <p className="text-base text-gray-900 whitespace-pre-wrap">
            {contactNotes || '連絡事項はありません'}
          </p>
        )}
      </div>
    </div>
  )
}
