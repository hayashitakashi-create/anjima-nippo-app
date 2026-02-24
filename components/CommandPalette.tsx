'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  Plus,
  ArrowRight,
  Shield,
  LogOut,
  Command as CommandIcon,
} from 'lucide-react'

interface UserInfo {
  role: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // ログインユーザー取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [pathname])

  // ⌘K / Ctrl+K でトグル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (user) {
          setOpen((prev) => !prev)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [user])

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false)
      command()
    },
    []
  )

  const handleLogout = useCallback(async () => {
    setOpen(false)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }, [router])

  // 未ログイン or ログイン画面では非表示
  if (loading || !user) return null
  if (pathname === '/login' || pathname === '/register') return null

  const isAdmin = user.role === 'admin'

  return (
    <>
      {/* 常時表示の固定検索バー */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60]">
        {/* PC表示 */}
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white border border-gray-200 shadow-sm hover:shadow rounded-lg transition-all text-gray-400 text-sm min-w-[320px] lg:min-w-[400px] backdrop-blur-sm"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">コマンドを検索...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-400 border border-gray-200 font-mono">
            <CommandIcon className="h-3 w-3" />K
          </kbd>
        </button>
        {/* モバイル表示 */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white border border-gray-200 shadow-sm hover:shadow rounded-full transition-all backdrop-blur-sm"
          title="検索 (⌘K)"
        >
          <Search className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* コマンドパレット（モーダル） */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="コマンドパレット"
        className="fixed inset-0 z-[100]"
      >
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* パレットボックス */}
        <div className="fixed inset-0 flex items-start justify-center pt-[20vh] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden pointer-events-auto mx-4">
            {/* 検索入力 */}
            <div className="flex items-center gap-2 px-4 border-b border-gray-200">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <Command.Input
                placeholder="コマンドを検索..."
                className="w-full py-3 text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            {/* コマンドリスト */}
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                該当するコマンドがありません
              </Command.Empty>

              {/* クイック作成 */}
              <Command.Group heading="クイック作成">
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/nippo-improved'))}
                >
                  営業日報を作成
                </CommandItem>
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/work-report/projects'))}
                >
                  作業日報を作成
                </CommandItem>
                <CommandItem
                  icon={<Plus className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/work-report/bulk'))}
                >
                  一括日報作成
                </CommandItem>
              </Command.Group>

              {/* ページ移動 */}
              <Command.Group heading="ページ移動">
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/dashboard'))}
                >
                  TOP画面
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/nippo'))}
                >
                  営業日報一覧
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/work-report/projects'))}
                >
                  物件一覧
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/templates'))}
                >
                  テンプレート管理
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/notifications'))}
                >
                  通知
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/reports'))}
                >
                  レポート・分析
                </CommandItem>
                <CommandItem
                  icon={<ArrowRight className="h-4 w-4" />}
                  onSelect={() => runCommand(() => router.push('/settings'))}
                >
                  アカウント設定
                </CommandItem>
              </Command.Group>

              {/* 管理者専用 */}
              {isAdmin && (
                <Command.Group heading="管理者">
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin'))}
                  >
                    管理画面
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/approvals'))}
                  >
                    承認管理
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/projects'))}
                  >
                    案件管理
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/project-types'))}
                  >
                    工事種別
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/materials'))}
                  >
                    使用材料
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/subcontractors'))}
                  >
                    外注先
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/units'))}
                  >
                    単位設定
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/system-settings'))}
                  >
                    システム設定
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/audit-log'))}
                  >
                    操作ログ
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/bulk-print'))}
                  >
                    一括印刷
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/aggregation'))}
                  >
                    労働時間集計
                  </CommandItem>
                  <CommandItem
                    icon={<Shield className="h-4 w-4" />}
                    onSelect={() => runCommand(() => router.push('/admin/aggregation/by-project'))}
                  >
                    現場別集計
                  </CommandItem>
                </Command.Group>
              )}

              {/* アクション */}
              <Command.Group heading="アクション">
                <CommandItem
                  icon={<LogOut className="h-4 w-4" />}
                  onSelect={handleLogout}
                >
                  ログアウト
                </CommandItem>
              </Command.Group>
            </Command.List>

            {/* フッター キーヒント */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200 text-xs text-gray-400">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">⌘K</kbd>{' '}
                で開く
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">↑↓</kbd>{' '}
                移動
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Enter</kbd>{' '}
                実行
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Esc</kbd>{' '}
                閉じる
              </span>
            </div>
          </div>
        </div>
      </Command.Dialog>
    </>
  )
}

function CommandItem({
  children,
  icon,
  onSelect,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg cursor-pointer data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700"
    >
      <span className="text-gray-400 data-[selected=true]:text-blue-500">{icon}</span>
      {children}
    </Command.Item>
  )
}
