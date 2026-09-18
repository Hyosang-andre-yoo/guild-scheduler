'use client'

interface GuildWeeklyScheduleProps {
  parties: any[]
}

export default function GuildWeeklySchedule({ parties }: GuildWeeklyScheduleProps) {
  // 만료되거나 취소된 파티 제외하고 유효한 스케줄만 필터링 (최신순 정렬)
  const activeParties = parties.filter(p => p.status !== 'expired')

  return (
    <div className="flex flex-col gap-4">
      
      {/* 🟢 이번 주 스케줄 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-white">진행 예정 스케줄</h3>
        </div>
        
        <div className="space-y-3">
          {activeParties.length > 0 ? (
            activeParties.map((party) => {
              // 파티장 이름 추출
              const leaderName = party.leader_character || party.character_name || party.party_members?.[0]?.character_name || '파티장';
              const members = party.party_members || [];

              // ⭐ 상태별 텍스트 및 뱃지 색상 지정
              let statusText = '';
              let statusClass = '';
              if (party.status === 'completed') {
                statusText = '🏆 토벌 완료';
                statusClass = 'text-emerald-400 bg-emerald-950/50 border border-emerald-900/50';
              } else if (party.status === 'closed') {
                statusText = '🔒 모집 마감';
                statusClass = 'text-slate-300 bg-slate-800 border border-slate-700';
              } else {
                statusText = `📢 모집 중 (${members.length || 1}/${party.max_members || party.max_member || 4}명)`;
                statusClass = 'text-indigo-400 bg-indigo-950/50 border border-indigo-900/50';
              }

              return (
                <div key={party.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col gap-3">
                  {/* 상단: 보스 정보 및 상태 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-xs font-bold bg-purple-900 text-purple-200 px-2 py-0.5 rounded mr-2">
                        {party.difficulty || 'Extreme'}
                      </span>
                      <span className="font-bold text-white mr-2">{party.boss_name}</span>
                      <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">
                        {party.party_date || party.period || '일시 미정'}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* 하단: 참여 파티원 명단 */}
                  <div className="bg-slate-900/80 rounded-md p-2 flex flex-wrap gap-x-4 gap-y-2 text-sm border border-slate-800/50">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      👑 {leaderName}
                    </span>
                    {/* 파티장을 제외한 나머지 파티원 렌더링 */}
                    {members
                      .filter((m: any) => m.character_name !== leaderName)
                      .map((member: any) => (
                        <span key={member.id} className="text-slate-300 flex items-center gap-1">
                          ⚔️ {member.character_name}
                        </span>
                      ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-slate-500 py-6 text-sm bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
              예정된 길드 스케줄이 없습니다.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}