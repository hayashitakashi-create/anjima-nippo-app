'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { WorkerRecord } from '../types'

interface Props {
  reportId: string
  projectName?: string
  workerRecords?: WorkerRecord[]
}

// 承認管理で作業日報の作業記録をその場でプレビュー表示 (田邊様5/28 FB③)
export function WorkerRecordsPreview({ reportId, projectName, workerRecords }: Props) {
  return (
    <>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        作業記録 ({workerRecords?.length ?? 0}件)
        {projectName && (
          <span className="text-xs font-normal text-gray-500 ml-2">{projectName}</span>
        )}
      </h4>
      <div className="space-y-2 mb-6">
        {workerRecords && workerRecords.length > 0 ? (
          workerRecords.map((w) => (
            <Link
              key={w.id}
              href={`/work-report/${reportId}?preview=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-50 rounded-lg p-3 text-sm hover:bg-purple-50 hover:ring-1 hover:ring-purple-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">
                  {w.name || '(氏名未記入)'}
                  {w.workType && <span className="ml-2 text-xs font-normal text-gray-500">{w.workType}</span>}
                </span>
                {(w.startTime || w.endTime) && (
                  <span className="text-xs text-gray-500">
                    {w.startTime || ''}{(w.startTime || w.endTime) ? ' 〜 ' : ''}{w.endTime || ''}
                  </span>
                )}
              </div>
              {w.details && (
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{w.details}</p>
              )}
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-400">作業記録がありません</p>
        )}
      </div>
    </>
  )
}
