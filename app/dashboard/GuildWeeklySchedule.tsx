'use client'

import { useState, useMemo } from 'react'

interface GuildWeeklyScheduleProps {
  parties: any[]
}

export default function GuildWeeklySchedule({ parties }: GuildWeeklyScheduleProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  // 메이플스토리 주간 초기화 기준 (목요일 ~ 수요일) 주간 범위 계산
  const currentWeekRange = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0(일) ~ 6(토)
    
    // 이번 주 목요일 계산 (목=4 기준)
    const diffToThursday = (dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3)
    
    const thursday = new Date(now)
    thursday.setDate(now.getDate() - diffToThursday + (weekOffset * 7))
    thursday.setHours(0, 0, 0, 0)

    const wednesday = new Date(thursday)
    wednesday.setDate(thursday.getDate() + 6)
    wednesday.setHours(23, 59, 59, 999)

    const formatDate = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
    
    return {
      start: thursday,
      end: wednesday,
      label: `${formatDate(thursday)} ~ ${formatDate(wednesday)}`
    }
  }, [weekOffset])

  // 현재 선택된 주간 범위와 일치하는 파티만 정밀 필터링
  const weeklyParties = useMemo(() => {
    return parties.filter((p) => {
      if (!p.party_date) return false

      // 1. 매주 고정팟인 경우: 항상 이번 주간에 포함시킴
      if (p.is_fixed || p.party_date === '매주 고정팟') {
        return true
      }

      // 2. 월간 보스인 경우: 해당 월에만 노출
      if (p.party_date.includes('월간 보스') || p.party_date.includes('매월 고정팟')) {
        const monthMatch = p.party_date.match(/(\d+)월/)
        if (monthMatch) {
          const partyMonth = Number(monthMatch[1]) - 1
          return currentWeekRange.start.getMonth() === partyMonth || currentWeekRange.end.getMonth() === partyMonth
        }
        return true
      }

      // 3. 일반 주간보스 날짜 파싱 (예: "9월 셋째 주 (17일 ~ 23일)" 또는 "9월 5일 ~ 9월 11일" 등)
      const match = p.party_date.match(/\((\d+)일\s*~\s*(\d+)일\)/)
      if (match) {
        const startDay = Number(match[1])
        const endDay = Number(match[2])
        
        const monthMatch = p.party_date.match(/(\d+)월/)
        const partyMonth = monthMatch ? Number(monthMatch[1]) - 1 : currentWeekRange.start.getMonth()

        const year = currentWeekRange.start.getFullYear()
        const partyStartDate = new Date(year, partyMonth, startDay)
        const partyEndDate = new Date(year, partyMonth, endDay)
        partyEndDate.setHours(23, 59, 59, 999)

        // 주간 범위(목~수)와 파티 날짜 범위가 실제로 겹치는지 엄격하게 교차 검증
        return partyStartDate <= currentWeekRange.end && partyEndDate >= currentWeekRange.start
      }

      return false
    })
  }, [parties, currentWeekRange])

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-indigo-300">📅 길드 주간 보스 스케줄</h2>
          <p className="text-xs text-gray-400 mt-0.5">메이플 주간 초기화 기준 (목요일 ~ 수요일)</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
          <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="text-gray-400 hover:text-white font-bold px-2 py-1 rounded transition-colors text-xs"
          >
            ◀ 이전 주
          </button>
          <span className="font-bold text-white text-sm">
            {currentWeekRange.label}
          </span>
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="text-gray-400 hover:text-white font-bold px-2 py-1 rounded transition-colors text-xs"
          >
            다음 주 ▶
          </button>
        </div>
      </div>

      {weeklyParties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeklyParties.map((party) => {
            const status = party.status || 'recruiting'
            const acceptedCount = party.party_members?.filter((m: any) => m.status === 'accepted').length || 0

            return (
              <div 
                key={party.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  status === 'cleared'
                    ? 'bg-gray-950/60 border-emerald-900/65 opacity-75'
                    : status === 'closed'
                    ? 'bg-gray-900/60 border-gray-800'
                    : 'bg-gray-900 border-gray-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-0.5 rounded font-semibold">
                        {party.difficulty}
                      </span>
                      <span className="font-bold text-white text-base">{party.boss_name}</span>
                    </div>
                    {status === 'cleared' ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold">
                        토벌 완료 🏆
                      </span>
                    ) : status === 'closed' ? (
                      <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                        모집 마감 🔒
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                        모집 중 📢
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{party.party_date}</p>
                </div>

                <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">
                    참여 인원: <span className="text-indigo-300 font-bold">{acceptedCount} / {party.max_members}명</span>
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    파티원 {party.party_members?.length || 0}명 신청됨
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center text-gray-400 text-sm">
          해당 주간에 예정된 보스 파티가 없습니다.
        </div>
      )}
    </div>
  )
}