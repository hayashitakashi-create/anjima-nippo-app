'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  Plus,
  LayoutDashboard,
  FileText,
  Building2,
  BookTemplate,
  Bell,
  BarChart3,
  UserCog,
  Shield,
  LogOut,
  X,
  Sparkles,
  CheckSquare,
  FolderKanban,
  Hammer,
  Package,
  Truck,
  Ruler,
  Settings,
  ScrollText,
  Printer,
  Clock,
  HardHat,
  Info,
  Command as CommandIcon,
} from 'lucide-react'

interface CommandDef {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  tags?: string[]
  action: () => void
}

interface UserInfo {
  role: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const listRef = useRef<HTMLDivElement>(null)

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
        if (user) setOpen((prev) => !prev)
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

  // コマンド定義
  const commands: CommandDef[] = [
    // クイック作成
    { id: 'create-sales', name: '営業日報を作成', description: '新しい営業日報を作成します', icon: <Plus className="h-5 w-5" />, category: 'クイック作成', tags: ['新規', '営業', '日報'], action: () => runCommand(() => router.push('/nippo-improved')) },
    { id: 'create-work', name: '作業日報を作成', description: '物件を選択して作業日報を作成', icon: <Plus className="h-5 w-5" />, category: 'クイック作成', tags: ['新規', '作業', '日報'], action: () => runCommand(() => router.push('/work-report/projects')) },
    { id: 'create-bulk', name: '一括日報作成', description: '複数の作業日報をまとめて作成', icon: <Plus className="h-5 w-5" />, category: 'クイック作成', tags: ['新規', '一括', '日報'], action: () => runCommand(() => router.push('/work-report/bulk')) },
    // ナビゲーション
    { id: 'nav-dashboard', name: 'ダッシュボード', description: 'TOP画面に移動', icon: <LayoutDashboard className="h-5 w-5" />, category: 'ナビゲーション', tags: ['トップ', 'ホーム'], action: () => runCommand(() => router.push('/dashboard')) },
    { id: 'nav-nippo', name: '営業日報一覧', description: '過去の営業日報を閲覧・編集', icon: <FileText className="h-5 w-5" />, category: 'ナビゲーション', tags: ['営業', '日報', '一覧'], action: () => runCommand(() => router.push('/nippo')) },
    { id: 'nav-projects', name: '物件一覧', description: '作業日報の物件を一覧表示', icon: <Building2 className="h-5 w-5" />, category: 'ナビゲーション', tags: ['物件', '作業', '一覧'], action: () => runCommand(() => router.push('/work-report/projects')) },
    { id: 'nav-templates', name: 'テンプレート管理', description: '日報テンプレートの作成・編集', icon: <BookTemplate className="h-5 w-5" />, category: 'ナビゲーション', tags: ['テンプレート'], action: () => runCommand(() => router.push('/templates')) },
    { id: 'nav-notifications', name: '通知', description: '未読通知を確認', icon: <Bell className="h-5 w-5" />, category: 'ナビゲーション', tags: ['通知', 'お知らせ'], action: () => runCommand(() => router.push('/notifications')) },
    { id: 'nav-reports', name: 'レポート・分析', description: '月次レポートや分析データを表示', icon: <BarChart3 className="h-5 w-5" />, category: 'ナビゲーション', tags: ['レポート', '分析', '集計'], action: () => runCommand(() => router.push('/reports')) },
    { id: 'nav-settings', name: 'アカウント設定', description: 'プロフィールやパスワードを変更', icon: <UserCog className="h-5 w-5" />, category: 'ナビゲーション', tags: ['設定', 'アカウント', 'プロフィール'], action: () => runCommand(() => router.push('/settings')) },
    // 管理者
    ...(isAdmin ? [
      { id: 'admin-top', name: '管理画面', description: '管理者ダッシュボード', icon: <Shield className="h-5 w-5" />, category: '管理者', tags: ['管理', 'admin'], action: () => runCommand(() => router.push('/admin')) },
      { id: 'admin-approvals', name: '承認管理', description: '日報の承認・差し戻し', icon: <CheckSquare className="h-5 w-5" />, category: '管理者', tags: ['承認'], action: () => runCommand(() => router.push('/admin/approvals')) },
      { id: 'admin-projects', name: '案件管理', description: '案件の追加・編集・削除', icon: <FolderKanban className="h-5 w-5" />, category: '管理者', tags: ['案件', '物件'], action: () => runCommand(() => router.push('/admin/projects')) },
      { id: 'admin-project-types', name: '工事種別', description: '工事種別マスタの管理', icon: <Hammer className="h-5 w-5" />, category: '管理者', tags: ['工事', '種別'], action: () => runCommand(() => router.push('/admin/project-types')) },
      { id: 'admin-materials', name: '使用材料', description: '材料マスタの管理', icon: <Package className="h-5 w-5" />, category: '管理者', tags: ['材料', '資材'], action: () => runCommand(() => router.push('/admin/materials')) },
      { id: 'admin-subcontractors', name: '外注先', description: '外注先マスタの管理', icon: <Truck className="h-5 w-5" />, category: '管理者', tags: ['外注', '業者'], action: () => runCommand(() => router.push('/admin/subcontractors')) },
      { id: 'admin-units', name: '単位設定', description: '単位マスタの管理', icon: <Ruler className="h-5 w-5" />, category: '管理者', tags: ['単位'], action: () => runCommand(() => router.push('/admin/units')) },
      { id: 'admin-system', name: 'システム設定', description: 'システム全体の設定', icon: <Settings className="h-5 w-5" />, category: '管理者', tags: ['システム', '設定'], action: () => runCommand(() => router.push('/admin/system-settings')) },
      { id: 'admin-audit', name: '操作ログ', description: 'ユーザーの操作履歴を確認', icon: <ScrollText className="h-5 w-5" />, category: '管理者', tags: ['ログ', '履歴', '監査'], action: () => runCommand(() => router.push('/admin/audit-log')) },
      { id: 'admin-print', name: '一括印刷', description: '日報をまとめて印刷', icon: <Printer className="h-5 w-5" />, category: '管理者', tags: ['印刷', 'PDF'], action: () => runCommand(() => router.push('/admin/bulk-print')) },
      { id: 'admin-aggregation', name: '労働時間集計', description: '全社員の労働時間を集計', icon: <Clock className="h-5 w-5" />, category: '管理者', tags: ['労働', '時間', '集計'], action: () => runCommand(() => router.push('/admin/aggregation')) },
      { id: 'admin-by-project', name: '現場別集計', description: '現場（物件）ごとの集計', icon: <HardHat className="h-5 w-5" />, category: '管理者', tags: ['現場', '集計'], action: () => runCommand(() => router.push('/admin/aggregation/by-project')) },
    ] : []),
    // アクション
    { id: 'logout', name: 'ログアウト', description: 'アカウントからログアウト', icon: <LogOut className="h-5 w-5" />, category: 'アクション', tags: ['ログアウト'], action: handleLogout },
  ]

  const selectedCommand = commands.find((c) => c.id === selectedId) ?? null

  // カテゴリ順
  const categories = ['クイック作成', 'ナビゲーション', ...(isAdmin ? ['管理者'] : []), 'アクション']

  return (
    <>
      {/* 常時表示の固定検索バー */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60]">
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
        <button
          onClick={() => setOpen(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white border border-gray-200 shadow-sm hover:shadow rounded-full transition-all backdrop-blur-sm"
          title="検索 (⌘K)"
        >
          <Search className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* コマンドパレット モーダル */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* モーダル本体 */}
          <div className="fixed inset-0 flex items-start justify-center pt-[12vh] pointer-events-none px-4">
            <Command
              label="ヘルプ・コマンド"
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden pointer-events-auto flex flex-col"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
              }}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-base font-bold">ヘルプ・コマンド</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 検索入力 */}
              <div className="px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <Command.Input
                    placeholder="コマンドを検索...（例: 新規、CSV、ダッシュボード）"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                  <span className="text-xs text-gray-400 shrink-0">esc で閉じる</span>
                </div>
              </div>

              {/* メインコンテンツ: リスト + 詳細 */}
              <div className="flex min-h-0 flex-1">
                {/* 左: コマンドリスト */}
                <Command.List
                  ref={listRef}
                  className="flex-1 max-h-[400px] overflow-y-auto py-2 border-r border-gray-100"
                >
                  <Command.Empty className="py-8 text-center text-sm text-gray-500">
                    該当するコマンドがありません
                  </Command.Empty>

                  {categories.map((cat) => (
                    <Command.Group key={cat} heading={cat}>
                      {commands
                        .filter((c) => c.category === cat)
                        .map((cmd) => (
                          <Command.Item
                            key={cmd.id}
                            value={`${cmd.name} ${cmd.description} ${(cmd.tags ?? []).join(' ')}`}
                            onSelect={cmd.action}
                            className="flex items-center gap-3 px-5 py-3 cursor-pointer data-[selected=true]:bg-blue-50 transition-colors group"
                            onMouseEnter={() => setSelectedId(cmd.id)}
                            onFocus={() => setSelectedId(cmd.id)}
                          >
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 group-data-[selected=true]:bg-blue-100 group-data-[selected=true]:text-blue-600 shrink-0 transition-colors">
                              {cmd.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 group-data-[selected=true]:text-blue-700 truncate">
                                {cmd.name}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {cmd.description}
                              </div>
                            </div>
                          </Command.Item>
                        ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* 右: 詳細パネル */}
                <div className="hidden md:flex w-64 flex-col p-5 max-h-[400px] overflow-y-auto">
                  {selectedCommand ? (
                    <>
                      <div className="flex items-center gap-2 text-blue-600 mb-3">
                        <Info className="h-4 w-4" />
                        <span className="text-xs font-semibold">詳細</span>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                        {selectedCommand.icon}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {selectedCommand.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        {selectedCommand.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded">
                          {selectedCommand.category}
                        </span>
                        {(selectedCommand.tags ?? []).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-gray-300">
                      コマンドを選択すると詳細が表示されます
                    </div>
                  )}
                </div>
              </div>

              {/* フッター */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-200 bg-gray-50/80 text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 font-mono">↓</kbd>
                    選択
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-gray-500 font-mono">↵</kbd>
                    実行
                  </span>
                </div>
                <span>⌘K でいつでも呼び出し可能</span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  )
}
