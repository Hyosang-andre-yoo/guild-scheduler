'use client'

import { useState } from 'react'
import { updatePartyDepartureTime, toggleTimeConfirmation } from './actions'

interface MyScheduleProps {
  myCharacters: any[]
  parties: any[]
  currentUserId?: string
}

export default function MySchedule({ myCharacters, parties, currentUserId }: MyScheduleProps) {
  const [settingParty, setSettingParty] = useState<any>(null)

  // 요일 및 시간 선택용 상태
  const [selectedDayOffset, setSelectedDayOffset] = useState<string>('0') // 오늘 기준 며칠 뒤인지
  const [selectedHour, setSelectedHour] = useState<string>('21') // 기본 밤 9시
  const [selectedMinute, setSelectedMinute] = useState<string>('00')

  // 요일 옵션 계산 (오늘부터 7일간)
  const getDayOptions = () => {
    const options = []
    const days = ['일', '월', '화', '수', '목', '금', '토']
    const today = new Date()

    // 한국 시간 기준 또는 로컬 기준으로 이번 주 날짜 생성
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const dayName = i === 0 ? '오늘' : i === 1 ? '내일' : `${days[d.getDay()]}요일`
      options.push({ label: `${month}/${day} (${dayName})`, value: dateStr })
    }
    return options
  }

  const dayOptions = getDayOptions()

  // 모달을 열 때 기존 설정된 시간이 있다면 맞추어 초기화
  const handleOpenModal = (party: any) => {
    setSettingParty(party)
    if (party.departure_time) {
      // "YYYY-MM-DDTHH:mm" 형태 분리
      const [datePart, timePart] = party.departure_time.split('T')
      if (datePart) setSelectedDayOffset(datePart)
      if (timePart) {
        const [h, m] = timePart.split(':')
        if (h) setSelectedHour(h)
        if (m) setSelectedMinute(m)
      }
    } else {
      setSelectedDayOffset(dayOptions[0].value)
      setSelectedHour('21')
      setSelectedMinute('00')
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-indigo-300">📅 캐릭터별 파티 스케줄 모아보기</h2>
          <p className="text-xs text-slate-400 mt-1">내가 속한 파티들의 상세 출발 시간을 조율하고 일정을 관리하세요.</p>
        </div>
        <span className="text-xs bg-indigo-950 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-800 font-semibold">
          내 등록 캐릭터: {myCharacters.length}개
        </span>
      </div>

      <div className="space-y-6">
        {myCharacters && myCharacters.length > 0 ? (
          myCharacters.map((char) => {
            const charParties = parties.filter((party) => {
              if (party.status === 'expired') return false
              const isMember = party.party_members?.some((m: any) => m.character_name === char.character_name)
              const leaderName = party.leader_character || party.character_name || party.party_members?.[0]?.character_name
              const isLeader = leaderName === char.character_name
              return isMember || isLeader
            })

            return (
              <div key={char.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-inner">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-900">
                  {char.character_image ? (
                    <img src={char.character_image} alt={char.character_name} className="w-12 h-12 rounded-lg bg-slate-900 object-contain border border-slate-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-xs text-slate-500">No Img</div>
                  )}
                  <div>
                    <div className="font-bold text-base text-white flex items-center gap-2">
                      {char.character_name}
                      <span className="text-[11px] font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {char.world_name} | {char.class_name} | Lv.{char.character_level}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-400 mt-0.5">
                      참여 중인 파티: <span className="font-bold text-white">{charParties.length}개</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charParties.length > 0 ? (
                    charParties.map((party) => {
                      const firstMemberName = party.party_members?.[0]?.character_name
                      const leaderName = party.leader_character || party.character_name || firstMemberName
                      const isLeader = leaderName === char.character_name
                      const myMembership = party.party_members?.find((m: any) => m.character_name === char.character_name)
                      const formattedTime = party.departure_time ? party.departure_time.replace('T', ' ') : null

                      return (
                        <div key={party.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${party.departure_time ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded">
                                  {party.difficulty || 'Extreme'}
                                </span>
                                <span className="font-bold text-white text-base">{party.boss_name} 파티</span>
                                {isLeader && (
                                  <span className="text-[10px] font-bold bg-orange-950 text-orange-400 border border-orange-800 px-1.5 py-0.5 rounded">
                                    파티장
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                기본 일정: <span className="text-slate-200">{party.party_date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-950/80 rounded-md p-2.5 border border-slate-800/60 pl-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="text-xs">
                                <span className="text-slate-400">확정 출발시간: </span>
                                <span className={formattedTime ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                                  {formattedTime ? `⏰ ${formattedTime}` : '⚠️ 시간 미정 (미설정)'}
                                </span>
                              </div>

                              {isLeader && (
                                <button 
                                  onClick={() => handleOpenModal(party)}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded font-medium transition"
                                >
                                  {party.departure_time ? '시간 수정' : '시간 정하기 ⏱️'}
                                </button>
                              )}
                            </div>

                            {party.party_members && party.party_members.length > 0 && (
                              <div className="border-t border-slate-900 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="text-slate-400 text-[11px]">파티원 확인 현황:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {party.party_members.map((m: any) => (
                                    <span 
                                      key={m.id} 
                                      className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${
                                        m.time_confirmed 
                                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' 
                                          : 'bg-slate-900 text-slate-400 border-slate-800'
                                      }`}
                                    >
                                      {m.character_name} {m.time_confirmed ? '✓ 확인완료' : '· 대기중'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {myMembership && formattedTime && (
                              <button
                                onClick={async () => {
                                  await toggleTimeConfirmation(myMembership.id, myMembership.time_confirmed)
                                }}
                                className={`w-full mt-1 py-1.5 rounded text-xs font-bold transition ${
                                  myMembership.time_confirmed
                                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {myMembership.time_confirmed ? '✅ 출발 시간 확인 완료 (취소하기)' : '☑️ 이 시간으로 출발 확정(체크하기)'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 py-6 text-xs bg-slate-950/40 rounded-lg border border-slate-800 border-dashed">
                      참여 중인 파티 스케줄이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-slate-500 py-10 text-sm bg-slate-950/50 rounded-xl border border-slate-800 border-dashed">
            등록된 캐릭터가 없습니다. 우측 사이드바에서 캐릭터를 먼저 등록해 주세요.
          </div>
        )}
      </div>

      {/* ⏱️ 드롭다운 방식으로 요일/시간을 편하게 고르는 파티장 모달 */}
      {settingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ⏱️ {settingParty.boss_name} 출발 시간 정하기
              </h3>
              <button onClick={() => setSettingParty(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>
            
            <form action={async (formData) => {
              // 숨겨진 input에 "YYYY-MM-DDTHH:mm" 조합된 값을 만들어서 서버로 전송
              const combinedDateTime = `${selectedDayOffset}T${selectedHour}:${selectedMinute}`
              formData.set('departureTime', combinedDateTime)

              await updatePartyDepartureTime(formData)
              setSettingParty(null)
            }} className="space-y-4">
              <input type="hidden" name="partyId" value={settingParty.id} />

              {/* 1. 요일(날짜) 선택 드롭다운 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">출발 요일 선택</label>
                <select 
                  value={selectedDayOffset} 
                  onChange={(e) => setSelectedDayOffset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {dayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. 시간 및 분 선택 드롭다운 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">시간 (시)</label>
                  <select 
                    value={selectedHour} 
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const hourStr = String(i).padStart(2, '0')
                      const displayHour = i === 0 ? '오전 12시 (자정)' : i < 12 ? `오전 ${i}시` : i === 12 ? '오후 12시 (정오)' : `오후 ${i - 12}시`
                      return (
                        <option key={hourStr} value={hourStr}>
                          {displayHour} ({hourStr}시)
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">분</label>
                  <select 
                    value={selectedMinute} 
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {['00', '10', '20', '30', '40', '50'].map((min) => (
                      <option key={min} value={min}>
                        {min}분
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-400 pt-1">
                * 이 시간이 설정되면 당일 자정 디스코드 브리핑 대상에 포함되며, 파티원들이 확인 체크를 할 수 있습니다.
              </p>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setSettingParty(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold transition">취소</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-bold transition">시간 확정하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}