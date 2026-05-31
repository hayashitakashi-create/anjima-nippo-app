import Link from 'next/link'
import { Home, Palmtree } from 'lucide-react'

export function PageHeader() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0E3091] flex items-center justify-center">
              <Palmtree className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">休暇届</h1>
              <p className="text-xs text-gray-500 hidden sm:block">休暇の申請・管理</p>
            </div>
          </Link>
          <Link href="/dashboard" className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors" title="TOP画面">
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
