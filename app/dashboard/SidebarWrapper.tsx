'use client'

import { useState } from 'react'

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  // 기본값을 true(열림)로 두되, 버튼을 누르면 false(닫힘)로 바뀝니다.
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-4 rounded-l-xl shadow-2xl z-50 transition-all font-bold text-sm flex flex-col items-center gap-2"
      >
        <span>◀</span>
        <span style={{ writingMode: 'vertical-rl' }}>캐릭터 관리</span>
      </button>
    )
  }

  return (
    <aside className="w-full lg:w-[22rem] shrink-0 relative transition-all">
      <div className="sticky top-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
        >
          숨기기 ✖
        </button>
        <h2 className="text-lg font-bold mb-4 pr-16 text-indigo-400">내 메이플 캐릭터 관리</h2>
        {children}
      </div>
    </aside>
  )
}