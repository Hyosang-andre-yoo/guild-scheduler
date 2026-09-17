'use client'

import { useState, useMemo } from 'react'
import { createParty } from './actions'

interface Character {
  id: string
  character_name: string
  world_name: string
  class_name: string
  character_level: number
}

interface PartyFormProps {
  characters: Character[]
}

const BOSS_LIST = [
  { name: '스우', icon: '⚡', type: 'weekly' },
  { name: '찬란한 흉성', icon: '☄️', type: 'weekly' },
  { name: '세렌', icon: '✨', type: 'weekly' },
  { name: '칼로스', icon: '🛡️', type: 'weekly' },
  { name: '대적자', icon: '🗡️', type: 'weekly' },
  { name: '카링', icon: '🌀', type: 'weekly' },
  { name: '벨로나', icon: '💫', type: 'weekly' },
  { name: '림보', icon: '👑', type: 'weekly' },
  { name: '발드릭스', icon: '🐉', type: 'weekly' },
  { name: '유피테르', icon: '🪐', type: 'weekly' },
  { name: '검은 마법사', icon: '🌌', type: 'monthly' },
]

export default function PartyForm({ characters }: PartyFormProps) {
  const [selectedBossName, setSelectedBossName] = useState(BOSS_LIST[0].name)
  const [isFixed, setIsFixed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return String(new Date().getMonth() + 1)
  })

  const [selectedWeekIndex, setSelectedWeekIndex] = useState('0')

  const currentBoss = BOSS_LIST.find((b) => b.name === selectedBossName) || BOSS_LIST[0]
  const isMonthly = currentBoss.type === 'monthly'

  const calculatedWeeks = useMemo(() => {
    const year = new Date().getFullYear()
    const month = Number(selectedMonth)
    
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const lastDayOfMonth = new Date(year, month, 0)

    const firstDayWeekday = firstDayOfMonth.getDay()
    const diffToThursday = (4 - firstDayWeekday + 7) % 7
    const firstThursday = new Date(year, month - 1, 1 + diffToThursday)

    const weeksLabel = ['첫째 주', '둘째 주', '셋째 주', '넷째 주', '다섯째 주']
    const options = []

    let currentThursday = new Date(firstThursday)
    let index = 0

    while (currentThursday <= lastDayOfMonth && index < 5) {
      const start = new Date(currentThursday)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)

      const label = `${month}월 ${weeksLabel[index]} (${start.getDate()}일 ~ ${end.getDate()}일)`
      options.push({ label, index: String(index) })
      
      currentThursday.setDate(currentThursday.getDate() + 7)
      index++
    }

    while (options.length < 5 && options.length > 0) {
      const lastIndex = options.length
      const start = new Date(currentThursday)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      
      const label = `${month}월 ${weeksLabel[lastIndex]} (${start.getDate()}일 ~ ${end.getDate()}일)`
      options.push({ label, index: String(lastIndex) })
      currentThursday.setDate(currentThursday.getDate() + 7)
    }

    return options.length > 0 ? options : [{ label: `${month}월 첫째 주`, index: '0' }]
  }, [selectedMonth])

  const monthOptions = useMemo(() => {
    const options = []
    for (let m = 1; m <= 12; m++) {
      options.push({ label: `${m}월`, value: String(m) })
    }
    return options
  }, [])

  const finalPartyDate = useMemo(() => {
    if (isMonthly) {
      const found = monthOptions.find(m => m.value === selectedMonth)
      return found ? `${found.label} (월간 보스)` : `${selectedMonth}월`
    } else {
      const foundWeek = calculatedWeeks.find(w => w.index === selectedWeekIndex)
      return foundWeek ? foundWeek.label : (calculatedWeeks[0]?.label || '')
    }
  }, [isMonthly, selectedMonth, selectedWeekIndex, monthOptions, calculatedWeeks])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (characters.length === 0) {
      alert('먼저 내 캐릭터를 등록해 주세요!')
      return
    }

    if (!confirm(`[${selectedBossName}] 파티를 개설하시겠습니까?`)) {
      return
    }

    const formData = new FormData(e.currentTarget)
    
    try {
      setIsLoading(true)
      await createParty(formData)
    } catch (error: any) {
      // 핵심: Next.js의 정상적인 리다이렉트 요청은 알림창을 띄우지 않고 그대로 통과시킵니다.
      if (error.message === 'NEXT_REDIRECT') {
        throw error
      }
      // 그 외의 진짜 에러(중복 생성 방지 에러 등)만 alert으로 띄웁니다.
      alert(error.message || '파티 개설 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="partyDate" value={isFixed ? (isMonthly ? '매월 고정팟' : '매주 고정팟') : finalPartyDate} />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">참여할 내 캐릭터 (파티장)</label>
        <select
          name="leaderCharacter"
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white font-semibold"
          required
        >
          {characters.length > 0 ? (
            characters.map((char) => (
              <option key={char.id} value={char.character_name}>
                {char.character_name} ({char.world_name} | {char.class_name} | Lv.{char.character_level})
              </option>
            ))
          ) : (
            <option value="">등록된 캐릭터가 없습니다</option>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">보스 선택</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 bg-gray-950 rounded-xl border border-gray-800">
          {BOSS_LIST.map((boss) => (
            <label key={boss.name} className="cursor-pointer">
              <input 
                type="radio" 
                name="bossName" 
                value={boss.name} 
                required 
                className="peer sr-only"
                checked={selectedBossName === boss.name}
                onChange={() => setSelectedBossName(boss.name)}
              />
              <div className="p-3 bg-gray-900 border border-gray-700 rounded-xl text-center transition-all peer-checked:border-indigo-500 peer-checked:bg-indigo-950 peer-checked:text-white hover:bg-gray-700 flex flex-col items-center justify-center min-h-[76px] text-white">
                <span className="text-xl mb-1">{boss.icon}</span>
                <span className="font-bold text-xs sm:text-sm w-full text-white break-keep">{boss.name}</span>
                <span className="text-[10px] text-gray-300 mt-0.5">
                  {boss.type === 'monthly' ? '월간보스' : '주간보스'}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          name="difficulty"
          className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white font-semibold"
          required
        >
          <option value="" className="text-gray-400 bg-gray-900">난이도 선택</option>
          <option value="Easy" className="text-white bg-gray-900">Easy (이지)</option>
          <option value="Normal" className="text-blue-400 bg-gray-900">Normal (노말)</option>
          <option value="Hard" className="text-red-400 bg-gray-900">Hard (하드)</option>
          <option value="Chaos" className="text-red-500 bg-gray-900">Chaos (카오스)</option>
          <option value="Extreme" className="text-gray-900 bg-gray-200 font-bold">Extreme (익스트림)</option>
        </select>

        {!isFixed ? (
          <div className="flex gap-2 md:col-span-1">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                setSelectedWeekIndex('0')
              }}
              className="w-1/3 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white font-medium text-sm"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {!isMonthly ? (
              <select
                value={selectedWeekIndex}
                onChange={(e) => setSelectedWeekIndex(e.target.value)}
                className="w-2/3 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white font-medium text-sm"
              >
                {calculatedWeeks.map((week) => (
                  <option key={week.index} value={week.index}>
                    {week.label.replace(/^\d+월\s*/, '')}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-2/3 flex items-center justify-center bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-indigo-300 text-sm font-medium">
                월간 단위 선택됨
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-purple-300 font-semibold text-sm md:col-span-1">
            {isMonthly ? '고정팟 일정으로 진행' : '매주 고정 일정으로 진행'}
          </div>
        )}

        <input
          type="number"
          name="maxMembers"
          placeholder="최대 인원수 (예: 6)"
          min="2"
          max="6"
          className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="text"
          name="description"
          placeholder="파티 메모 또는 특이사항 (선택)"
          className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
        />
        
        <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-4 py-2 rounded-lg border border-gray-600">
          <input 
            type="checkbox" 
            name="isFixed" 
            checked={isFixed}
            onChange={(e) => setIsFixed(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <span className="text-sm font-medium text-gray-200">
            {isMonthly ? '고정팟' : '매주 고정팟'}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || characters.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? '개설 중...' : '파티 개설하기'}
      </button>
    </form>
  )
}