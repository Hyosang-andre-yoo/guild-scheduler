'use client'

interface Character {
  id: string
  character_name: string
  world_name: string
  class_name: string
  character_level: number
  character_image?: string
}

interface MyScheduleProps {
  parties: any[]
  myCharacters: Character[]
  currentUserId: string
}

export default function MySchedule({ parties, myCharacters, currentUserId }: MyScheduleProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-indigo-500/50 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-indigo-300">📅 캐릭터별 파티 스케줄 모아보기</h2>
        <span className="text-xs bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-800 font-semibold">
          내 등록 캐릭터: {myCharacters.length}개
        </span>
      </div>

      {myCharacters.length > 0 ? (
        <div className="space-y-6">
          {myCharacters.map((char) => {
            // 1. 이 캐릭터가 파티장으로 만든 파티 찾기
            const ledParties = parties.filter((p) => {
              if (p.leader_id !== currentUserId) return false
              const leaderMember = p.party_members?.find(
                (m: any) => m.user_id === currentUserId && m.status === 'accepted' && m.memo === '파티장'
              )
              return leaderMember?.character_name === char.character_name
            })

            // 2. 이 캐릭터가 일반 파티원으로 신청/참여 중인 파티 찾기
            const joinedParties = parties.filter((p) => {
              return p.party_members?.some(
                (m: any) => m.user_id === currentUserId && m.character_name === char.character_name
              )
            })

            const allCharParties = Array.from(
              new Map([...ledParties, ...joinedParties].map((p) => [p.id, p])).values()
            )

            return (
              <div key={char.id} className="bg-gray-900 p-4 rounded-xl border border-gray-700 space-y-3">
                {/* 캐릭터 헤더 */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                  {char.character_image ? (
                    <img src={char.character_image} alt={char.character_name} className="w-12 h-12 object-contain bg-gray-800 rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-lg">⚔️</div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-white">{char.character_name}</h3>
                    <p className="text-xs text-gray-400">{char.world_name} | {char.class_name} | Lv.{char.character_level}</p>
                  </div>
                </div>

                {/* 해당 캐릭터의 파티 스케줄 카드들 */}
                {allCharParties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allCharParties.map((party) => {
                      const isLeader = party.leader_id === currentUserId
                      const myMemberInfo = party.party_members?.find(
                        (m: any) => m.user_id === currentUserId && m.character_name === char.character_name
                      )
                      const partyStatus = party.status || 'recruiting'

                      return (
                        <div key={party.id} className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                          partyStatus === 'cleared'
                            ? 'bg-emerald-950/20 border-emerald-900/60'
                            : 'bg-gray-950 border-gray-800'
                        }`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {partyStatus === 'cleared' && (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  토벌 완료 🏆
                                </span>
                              )}
                              <span className="bg-indigo-900 text-indigo-200 text-[10px] px-2 py-0.5 rounded font-semibold">
                                {party.difficulty}
                              </span>
                              <span className="font-bold text-white text-sm">{party.boss_name} 파티</span>
                              {isLeader && (
                                <span className="bg-amber-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-800">
                                  파티장
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400">일시: {party.party_date}</p>
                          </div>

                          <div className="pt-2 border-t border-gray-900 flex justify-between items-center text-[11px]">
                            <span className="text-gray-300">
                              상태:{' '}
                              <span className={myMemberInfo?.status === 'accepted' ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>
                                {myMemberInfo?.status === 'accepted' ? '승인됨 ✓' : '대기중 ⏳'}
                              </span>
                            </span>
                            {partyStatus === 'closed' && (
                              <span className="text-gray-500 text-[10px]">모집마감</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic py-1">이 캐릭터로 참여 중인 파티 스케줄이 없습니다.</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-400 text-sm italic">등록된 캐릭터가 없습니다. 아래에서 캐릭터를 먼저 등록해 주세요!</p>
      )}
    </div>
  )
}