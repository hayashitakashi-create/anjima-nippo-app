'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

const DRAFT_PREFIX = 'anjima_draft_'
const AUTO_SAVE_INTERVAL = 15000 // 15秒ごとに自動保存

export interface DraftMeta {
  savedAt: string
  version: number
}

export interface DraftData<T> {
  data: T
  meta: DraftMeta
}

/**
 * 自動下書き保存カスタムフック
 *
 * @param key - localStorage のキー (例: 'nippo_new', 'work_report_new')
 * @param getData - 現在のフォームデータを取得する関数
 * @param enabled - 保存を有効にするか (フォーム準備完了後にtrue)
 * @returns { hasDraft, draftData, restoreDraft, clearDraft, lastSavedAt }
 */
export function useDraftSave<T>(
  key: string,
  getData: () => T,
  enabled: boolean = true
) {
  const storageKey = `${DRAFT_PREFIX}${key}`
  const getDataRef = useRef(getData)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftData, setDraftData] = useState<T | null>(null)
  const initialCheckDone = useRef(false)

  // getData の参照を常に最新に
  useEffect(() => {
    getDataRef.current = getData
  }, [getData])

  // 初回: 既存の下書きがあるか確認
  useEffect(() => {
    if (initialCheckDone.current) return
    initialCheckDone.current = true

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed: DraftData<T> = JSON.parse(stored)
        // 24時間以上前の下書きは無視
        const savedTime = new Date(parsed.meta.savedAt).getTime()
        const now = Date.now()
        if (now - savedTime < 24 * 60 * 60 * 1000) {
          setHasDraft(true)
          setDraftData(parsed.data)
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  // 下書きを保存
  const saveDraft = useCallback(() => {
    try {
      const data = getDataRef.current()
      const draft: DraftData<T> = {
        data,
        meta: {
          savedAt: new Date().toISOString(),
          version: 1,
        },
      }
      localStorage.setItem(storageKey, JSON.stringify(draft))
      setLastSavedAt(draft.meta.savedAt)
    } catch (error) {
      console.error('下書き保存エラー:', error)
    }
  }, [storageKey])

  // 下書きをクリア
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHasDraft(false)
    setDraftData(null)
    setLastSavedAt(null)
  }, [storageKey])

  // 下書き復元完了後のフラグクリア
  const dismissDraft = useCallback(() => {
    setHasDraft(false)
    setDraftData(null)
  }, [])

  // 自動保存タイマー
  useEffect(() => {
    if (!enabled) return

    const timer = setInterval(() => {
      saveDraft()
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(timer)
  }, [enabled, saveDraft])

  // ページ離脱時に保存
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      saveDraft()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, saveDraft])

  return {
    hasDraft,
    draftData,
    lastSavedAt,
    saveDraft,
    clearDraft,
    dismissDraft,
  }
}

/**
 * 下書き保存の時刻を「○分前」形式でフォーマット
 */
export function formatDraftTime(isoString: string): string {
  const saved = new Date(isoString)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - saved.getTime()) / 1000)

  if (diffSec < 10) return 'たった今'
  if (diffSec < 60) return `${diffSec}秒前`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`
  return `${saved.getMonth() + 1}/${saved.getDate()} ${saved.getHours().toString().padStart(2, '0')}:${saved.getMinutes().toString().padStart(2, '0')}`
}
