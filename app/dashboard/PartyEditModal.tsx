'use client'

import { useState, useEffect } from 'react'
import { updatePartySettings } from './actions'

interface PartyEditModalProps {
  partyId: string
  bossName: string
  currentDifficulty: string
  currentMaxMembers: number
  currentDescription: string
  currentDepartureTime?: string 
}

export default function PartyEditModal({
  partyId,
  bossName,
  currentDifficulty,
  currentMaxMembers,
  currentDescription,
  currentDepartureTime,
}: PartyEditModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 날짜와 시간을 각각 관리할 상태 (분리된 UI용)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  // 모달이 열릴 때 기존 설정된 시간이 있으면 쪼개서 넣고, 없으면 기본 시간(예: 오후 8시) 세팅
  useEffect(() => {
    if (isOpen) {
      if (currentDepartureTime) {
        const [d, t] = currentDepartureTime.split('T')
        setDate(d || '')
        setTime(t || '')
      } else {
        setDate('')
        setTime('20:00') // 기본값: 저녁 8시
      }
    }
  }, [isOpen, currentDepartureTime])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      setIsLoading(true)
      await updatePartySettings(formData)
      setIsOpen(false)
    } catch (error: any) {
      if (error.message === 'NEXT_REDIRECT') {
        throw error
      }
      alert(error.message || '파티 수정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-500 font-bold px-3 py-2 rounded-lg text-xs transition-colors"
        title="파티 설정 수정"
      >
        설정 ⚙️
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-300">파티 설정 수정</h3>
                <p className="text-xs text-gray-400 mt-0.5">{bossName} 파티</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="partyId" value={partyId} />
              
              {/* 분리된 상태를 다시 합쳐서 서버로 보낼 숨겨진 인풋 */}
              <input 
                type="hidden" 
                name="departureTime" 
                value={date && time ? `${date}T${time}` : ''} 
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">정확한 출발 시간 (모집 완료 후 설정)</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">난이도</label>
                  <select
                    name="difficulty"
                    defaultValue={currentDifficulty}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="Easy" className="text-white">Easy</option>
                    <option value="Normal" className="text-blue-400">Normal</option>
                    <option value="Hard" className="text-red-400">Hard</option>
                    <option value="Chaos" className="text-red-500">Chaos</option>
                    <option value="Extreme" className="text-gray-400">Extreme</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">최대 인원수</label>
                  <input
                    type="number"
                    name="maxMembers"
                    defaultValue={currentMaxMembers}
                    min="2" max="6"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">공지사항 및 메모</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={currentDescription || ''}
                  placeholder="예: 늦으면 버리고 갑니다"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-xs font-bold">취소</button>
                <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 rounded-lg text-xs font-bold shadow-md">
                  {isLoading ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}