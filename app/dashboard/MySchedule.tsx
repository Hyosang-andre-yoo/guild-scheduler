'use client'

import { useState } from 'react'
import { updatePartyDepartureTime, toggleTimeConfirmation } from './actions'

interface MyScheduleProps {
  myCharacters: any[]
  parties: any[]
  currentUserId?: string
}

export default function MySchedule({ myCharacters, parties, currentUserId }: MyScheduleProps) {
  // 파티장 시간 설정 모달을 열기 위한 상태 관리 (어떤 파티의 시간을 설정 중인지 저장)
  const [settingParty, setSettingParty] = useState<any>(null)

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
            // 이 캐릭터가 참여 중이거나 파티장인 파티들 필터링
            const charParties = parties.filter((party) => {
              if (party.status === 'expired') return false
              const isMember = party.party_members?.some((m: any) => m.character_name === char.character_name)
              const leaderName = party.leader_character || party.character_name || party.party_members?.[0]?.character_name
              const isLeader = leaderName === char.character_name
              return isMember || isLeader
            })

            return (
              <div key={char.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-inner">
                {/* 캐릭터 프로필 헤더 */}
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

                {/* 해당 캐릭터의 파티 카드 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {charParties.length > 0 ? (
                    charParties.map((party) => {
                      const firstMemberName = party.party_members?.[0]?.character_name
                      const leaderName = party.leader_character || party.character_name || firstMemberName
                      const isLeader = leaderName === char.character_name

                      // 현재 캐릭터의 파티 멤버 정보 찾기
                      const myMembership = party.party_members?.find((m: any) => m.character_name === char.character_name)

                      // 출발 시간 포맷팅 (YYYY-MM-DDTHH:mm -> MM월 DD일 HH:mm)
                      const formattedTime = party.departure_time 
                        ? party.departure_time.replace('T', ' ') 
                        : null

                      return (
                        <div key={party.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden">
                          {/* 왼쪽 포인트 바 */}
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

                          {/* ⏰ 출발 시간 및 파티장 설정 버튼 영역 */}
                          <div className="bg-slate-950/80 rounded-md p-2.5 border border-slate-800/60 pl-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <div className="text-xs">
                                <span className="text-slate-400">확정 출발시간: </span>
                                <span className={formattedTime ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                                  {formattedTime ? `⏰ ${formattedTime}` : '⚠️ 시간 미정 (미설정)'}
                                </span>
                              </div>

                              {/* 파티장인 경우에만 시간 설정 버튼 노출 */}
                              {isLeader && (
                                <button 
                                  onClick={() => setSettingParty(party)}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded font-medium transition"
                                >
                                  {party.departure_time ? '시간 수정' : '시간 정하기 ⏱️'}
                                </button>
                              )}
                            </div>

                            {/* 파티원들의 시간 확인 체크 상태 표시 */}
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

                            {/* 일반 파티원인 경우 '시간 확인 체크' 버튼 제공 */}
                            {myMembership && !isLeader && formattedTime && (
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

      {/* ⏰ 파티장 전용 [출발 시간 설정] 팝업 모달 */}
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
              await updatePartyDepartureTime(formData)
              setSettingParty(null)
            }} className="space-y-4">
              <input type="hidden" name="partyId" value={settingParty.id} />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">상세 출발 일시 선택</label>
                <input 
                  type="datetime-local" 
                  name="departureTime" 
                  defaultValue={settingParty.departure_time ? settingParty.departure_time.slice(0, 16) : ''} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" 
                  required 
                />
                <p className="text-xs text-slate-400 mt-2">
                  * 이 시간이 설정되면 당일 자정 디스코드 브리핑 대상에 포함되며, 1시간 전 알림 등의 자동화와 연동됩니다.
                </p>
              </div>

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