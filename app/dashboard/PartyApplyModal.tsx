'use client'

import { useState } from 'react'

interface Character {
  id: string
  character_name: string
  world_name: string
  class_name: string
  character_level: number
  character_image?: string
}

interface PartyApplyModalProps {
  partyId: string
  bossName: string
  difficulty: string
  characters: Character[]
  onApplyAction: (partyId: string, characterName: string, memo: string) => Promise<void>
}

export default function PartyApplyModal({
  partyId,
  bossName,
  difficulty,
  characters,
  onApplyAction,
}: PartyApplyModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]?.character_name || '')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharacter) {
      alert('참여할 캐릭터를 선택해 주세요.')
      return
    }

    try {
      setIsLoading(true)
      // 서버 액션 호출 (중복 참여 등 에러 발생 시 catch로 진입)
      await onApplyAction(partyId, selectedCharacter, memo)
      setIsOpen(false)
      setMemo('')
    } catch (error: any) {
      // 서버 액션에서 throw 된 에러 메시지를 사용자에게 알림(alert)으로 안내
      alert(error.message || '파티 신청 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shadow-md"
      >
        파티 신청 ⚔️
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-300">파티 참가 신청</h3>
                <p className="text-xs text-gray-400 mt-0.5">{bossName} ({difficulty})</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 캐릭터 선택 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">참여할 내 캐릭터 선택</label>
                {characters.length > 0 ? (
                  <select
                    value={selectedCharacter}
                    onChange={(e) => setSelectedCharacter(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {characters.map((char) => (
                      <option key={char.id} value={char.character_name}>
                        [{char.world_name}] {char.character_name} ({char.class_name} / Lv.{char.character_level})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-red-400">등록된 캐릭터가 없습니다. 먼저 대시보드 하단에서 캐릭터를 등록해 주세요!</p>
                )}
              </div>

              {/* 메모 입력 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">참가 메모 (선택사항)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 부캐 딜러, 주말 저녁 선호 등"
                  maxLength={50}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading || characters.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-md"
                >
                  {isLoading ? '신청 중...' : '신청 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}