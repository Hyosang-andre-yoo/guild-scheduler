'use client'

import { useState, useMemo } from 'react'

interface GuildCalendarProps {
  parties: any[]
}

export default function GuildCalendar({ parties }: GuildCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0 ~ 11

  // 달력 계산 (해당 월의 첫 날 요일과 마지막 날짜)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0(일) ~ 6(토)
    const totalDays = lastDayOfMonth.getDate()

    const days = []

    // 이전 달의 빈 칸 채우기
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dateStr: null, isCurrentMonth: false })
    }

    // 현재 달의 날짜 채우기
    for (let d = 1; d <= totalDays; d++) {
      const formattedMonth = String(month + 1).padStart(2, '0')
      const formattedDay = String(d).padStart(2, '0')
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`
      days.push({ dateStr, dayNumber: d, isCurrentMonth: true })
    }

    return days
  }, [year, month])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
      {/* 캘린더 헤더 (년/월 이동) */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-indigo-300">📅 길드 전체 파티 캘린더</h2>
        <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
          <button 
            onClick={prevMonth}
            className="text-gray-400 hover:text-white font-bold px-2 py-1 rounded transition-colors"
          >
            ◀ 이전
          </button>
          <span className="font-bold text-white text-base">
            {year}년 {month + 1}월
          </span>
          <button 
            onClick={nextMonth}
            className="text-gray-400 hover:text-white font-bold px-2 py-1 rounded transition-colors"
          >
            다음 ▶
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-gray-400 pb-2 border-b border-gray-700">
        <span className="text-red-400">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span className="text-blue-400">토</span>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day.isCurrentMonth) {
            return <div key={index} className="min-h-[100px] bg-gray-900/30 rounded-lg border border-gray-800/40" />
          }

          // 해당 날짜에 매칭되는 파티 필터링 (파티 날짜 문자열에 일자나 월/주가 포함된 경우 매칭 또는 고정팟 처리)
          const dayParties = parties.filter((p) => {
            if (p.is_fixed) return false // 고정팟은 별도 섹션이나 전체 상시로 처리 가능
            // party_date 형태가 'M월 주차 (일자 ~ 일자)' 형태일 수 있으므로 날짜 매칭 확인
            // 또는 간단히 문자열 포함 여부나 날짜 포맷 검증
            return p.party_date && p.party_date.includes(`${month + 1}월`) && p.party_date.includes(`${day.dayNumber}일`)
          })

          return (
            <div 
              key={index} 
              className="min-h-[110px] bg-gray-900 p-2 rounded-lg border border-gray-700/80 flex flex-col gap-1.5 overflow-y-auto max-h-[150px]"
            >
              <div className="text-xs font-bold text-gray-300 flex justify-between items-center">
                <span>{day.dayNumber}</span>
                {dayParties.length > 0 && (
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 rounded border border-indigo-800">
                    {dayParties.length}개
                  </span>
                )}
              </div>

              {/* 해당 날짜 파티 리스트 */}
              <div className="space-y-1">
                {dayParties.map((party) => {
                  const status = party.status || 'recruiting'
                  return (
                    <div 
                      key={party.id}
                      className={`text-[10px] p-1.5 rounded border truncate ${
                        status === 'cleared'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 line-through'
                          : status === 'closed'
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-indigo-950/80 border-indigo-800 text-indigo-200'
                      }`}
                      title={`${party.boss_name} (${party.difficulty})`}
                    >
                      <span className="font-bold">⚔️ {party.boss_name}</span> ({party.difficulty})
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}