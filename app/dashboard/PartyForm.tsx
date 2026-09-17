'use client'

import { useState } from 'react'
import { createParty } from './actions'

interface Character {
  character_name: string
}

interface PartyFormProps {
  characters: Character[]
}

const BOSS_LIST = [
  { name: '이지/노멀 루시드', type: 'weekly', maxMembers: 6 },
  { name: '하드 루시드', type: 'weekly', maxMembers: 6 },
  { name: '하드 스우', type: 'weekly', maxMembers: 6 },
  { name: '하드 데미안', type: 'weekly', maxMembers: 6 },
  { name: '하드 가렌', type: 'weekly', maxMembers: 6 },
  { name: '노멀 진힐라', type: 'weekly', maxMembers: 6 },
  { name: '하드 진힐라', type: 'weekly', maxMembers: 6 },
  { name: '노멀 더스크', type: 'weekly', maxMembers: 6 },
  { name: '하드 더스크', type: 'weekly', maxMembers: 6 },
  { name: '하드 듄켈', type: 'weekly', maxMembers: 6 },
  { name: '노멀 듄켈', type: 'weekly', maxMembers: 6 },
  { name: '하드 윌', type: 'weekly', maxMembers: 6 },
  { name: '익스트림 스우', type: 'weekly', maxMembers: 6 },
  { name: '검은 마법사', type: 'monthly', maxMembers: 6 },
  { name: '세렌', type: 'weekly', maxMembers: 6 },
  { name: '칼로스', type: 'weekly', maxMembers: 6 },
  { name: '카링', type: 'weekly', maxMembers: 6 },
  { name: '림보', type: 'weekly', maxMembers: 6 },
]

export default function PartyForm({ characters }: PartyFormProps) {
  const [selectedBoss, setSelectedBoss] = useState(BOSS_LIST[0])
  const [isFixed, setIsFixed] = useState(false)
  const [partyType, setPartyType] = useState<'weekly' | 'monthly'>('weekly')
  const [selectedWeek, setSelectedWeek] = useState('1주차')
  const [selectedMonth, setSelectedMonth] = useState('이번 달')
  const [isLoading, setIsLoading] = useState(false)

  const handleBossChange = (bossName: string) => {
    const boss = BOSS_LIST.find((b) => b.name === bossName)
    if (boss) {
      setSelectedBoss(boss)
      setPartyType(boss.type as 'weekly' | 'monthly')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      setIsLoading(true)
      await createParty(formData)
    } catch (error: any) {
      if (error.message === 'NEXT_REDIRECT') {
        throw error
      }
      alert(error.message || '파티 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 주차별 날짜 라벨 배열 계산 수정 (타입 명시)
  const weeks: string[] = ['1주차', '2주차', '3주차', '4주차', '5주차']
  const lastIndex: number = weeks.length - 1
  const label: string = `${weeks[0]} ~ ${weeks[lastIndex]}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">보스 선택</label>
          <select
            name="bossName"
            value={selectedBoss.name}
            onChange={(e) => handleBossChange(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            {BOSS_LIST.map((boss) => (
              <option key={boss.name} value={boss.name}>
                {boss.name} ({boss.type === 'monthly' ? '월간' : '주간'})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">내 대표 캐릭터</label>
          <select
            name="characterName"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            required
          >
            {characters.map((char) => (
              <option key={char.character_name} value={char.character_name}>
                {char.character_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">파티 유형</label>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="isFixed"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-900 border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-bold text-indigo-300">고정팟 여부</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">난이도</label>
          <select
            name="difficulty"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="Normal">Normal</option>
            <option value="Hard">Hard</option>
            <option value="Chaos">Chaos</option>
            <option value="Extreme">Extreme</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">최대 인원</label>
          <input
            type="number"
            name="maxMembers"
            defaultValue={selectedBoss.maxMembers}
            min="2"
            max="6"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">주차 / 기간 선택</label>
          {isFixed ? (
            <input
              type="text"
              name="partyDate"
              value={partyType === 'monthly' ? '매월 고정팟' : '매주 고정팟'}
              readOnly
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-indigo-300 font-bold"
            />
          ) : partyType === 'monthly' ? (
            <select
              name="partyDate"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="이번 달">이번 달 월간 보스</option>
              <option value="다음 달">다음 달 월간 보스</option>
            </select>
          ) : (
            <select
              name="partyDate"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="1주차">목요일 ~ 수요일 (1주차)</option>
              <option value="2주차">목요일 ~ 수요일 (2주차)</option>
              <option value="3주차">목요일 ~ 수요일 (3주차)</option>
              <option value="4주차">목요일 ~ 수요일 (4주차)</option>
              <option value="5주차">목요일 ~ 수요일 (5주차)</option>
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300">파티장 공지 및 메모</label>
          <input
            type="text"
            name="description"
            placeholder="예: 스펙 컷 자유, 무언 팟"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold py-2.5 rounded-lg transition-colors shadow-lg text-sm"
      >
        {isLoading ? '파티 등록 중...' : '보스 파티 생성하기 🚀'}
      </button>
    </form>
  )
}