'use client'

import Link from 'next/link'
import { BookMarked, ChevronDown } from 'lucide-react'
import { Template } from '../types'

interface TemplateMenuProps {
  templates: Template[]
  showMenu: boolean
  setShowMenu: (show: boolean) => void
  onSelectTemplate: (template: Template) => void
}

export function TemplateMenu({
  templates,
  showMenu,
  setShowMenu,
  onSelectTemplate,
}: TemplateMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-1 px-2 sm:px-3 py-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium"
        title="テンプレート"
      >
        <BookMarked className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">テンプレート</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-medium px-2">テンプレートを選択</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">テンプレートがありません</p>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onSelectTemplate(template)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-amber-50 text-sm text-gray-700 flex items-center justify-between"
                >
                  <span className="truncate">{template.name}</span>
                  {template.isShared && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">共有</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100">
            <Link
              href="/templates"
              className="block text-center text-xs text-amber-600 hover:text-amber-700 py-1"
              onClick={() => setShowMenu(false)}
            >
              テンプレート管理
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
