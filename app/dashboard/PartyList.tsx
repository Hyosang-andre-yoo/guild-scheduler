'use client'

import { useState } from 'react'
import { updatePartyStatus, deleteParty, removePartyMember } from './actions'

export default function PartyList({ 
  parties, 
  myCharacters = [], 
  currentTab = 'recruiting',
  selectedChar = 'all' 
}: { 
  parties: any[], 
  myCharacters?: any[], 
  currentTab?: string,
  selectedChar?: string 
}) {
  const [tab, setTab] = useState(currentTab)
  const currentUserId = myCharacters.length > 0 ? myCharacters[0].user_id : null;

  const filteredParties = parties.filter((party) => {
    if (selectedChar !== 'all') {
      const isMember = party.party_members?.some((m: any) => m.character_name === selectedChar)
      const leaderName = party.leader_character || party.character_name || party.party_members?.[0]?.character_name;
      const isLeader = leaderName === selectedChar;
      if (!isMember && !isLeader) return false
    }

    if (tab === 'recruiting') return party.status !== 'completed' && party.status !== 'expired'
    if (tab === 'completed') return party.status === 'completed' || party.status === 'expired'
    return true
  })

  // 버튼 액션 핸들러들
  const handleStatusChange = async (id: string, status: string, message: string) => {
    if (window.confirm(message)) {
      await updatePartyStatus(id, status)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 파티를 삭제하시겠습니까? 복구할 수 없습니다.')) {
      await deleteParty(id)
    }
  }

  const handleKick = async (memberId: string, memberName: string) => {
    if (window.confirm(`${memberName}님을 파티에서 내보내시겠습니까?`)) {
      await removePartyMember(memberId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold">⚔️ 보스 파티 목록</h2>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button 
            onClick={() => setTab('recruiting')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'recruiting' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            모집 / 진행 중
          </button>
          <button 
            onClick={() => setTab('completed')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'completed' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            완료 / 만료됨
          </button>
          <button 
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            전체 보기
          </button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {filteredParties.length > 0 ? (
          filteredParties.map((party) => {
            const firstMemberName = party.party_members?.[0]?.character_name;
            const leaderName = party.leader_character || party.character_name || firstMemberName;
            
            const isMyParty = 
              (currentUserId && party.user_id === currentUserId) || 
              (leaderName && myCharacters.some(char => char.character_name === leaderName));

            // 파티가 완료/만료 상태인지 확인
            const isFinished = party.status === 'completed' || party.status === 'expired';

            return (
              <div key={party.id} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition-all ${isFinished ? 'opacity-70 grayscale-[30%]' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      party.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : 
                      party.status === 'expired' ? 'bg-slate-800 text-slate-400 border-slate-600' :
                      party.status === 'closed' ? 'bg-slate-800 text-slate-300 border-slate-600' : 
                      'bg-indigo-900/50 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {party.status === 'completed' ? '🏆 토벌 완료' : 
                       party.status === 'expired' ? '⏳ 기간 만료' :
                       party.status === 'closed' ? '🔒 모집 마감' : '📢 모집 중'}
                    </span>
                    <span className="bg-purple-900/50 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-xs font-bold">
                      {party.difficulty || 'Extreme'}
                    </span>
                    <h3 className="font-bold text-lg">{party.boss_name} 파티</h3>
                    
                    {isMyParty && (
                      <span className="text-xs font-bold text-orange-400 border border-orange-500/50 bg-orange-950 px-2 py-0.5 rounded">
                        내 파티 (파티장)
                      </span>
                    )}
                    {party.is_fixed && (
                      <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-900/30 px-2 py-0.5 rounded">
                        고정팟
                      </span>
                    )}
                  </div>
                  
                  {/* ⭐ 상태에 따라 버튼이 스마트하게 바뀌는 영역 */}
                  <div className="flex gap-2">
                    {isMyParty ? (
                      isFinished ? (
                        // 이미 완료/만료된 파티일 때
                        <>
                          <button onClick={() => handleStatusChange(party.id, 'recruiting', '이 파티를 다시 모집 중 상태로 되돌릴까요?')} className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded text-sm transition font-medium">다시 모집 📢</button>
                          <button onClick={() => handleDelete(party.id)} className="bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm transition font-medium">파티 삭제</button>
                        </>
                      ) : (
                        // 아직 진행 중이거나 마감만 된 파티일 때
                        <>
                          <button onClick={() => window.alert('설정 기능은 기존 수정 폼(Modal) 연결이 필요합니다.')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm transition font-medium border border-slate-600">설정 ⚙️</button>
                          <button onClick={() => handleStatusChange(party.id, 'completed', '파티를 토벌 완료 처리할까요?')} className="bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded text-sm transition font-medium">토벌 완료 🏆</button>
                          
                          {/* 모집 마감 <-> 모집 재개 토글 */}
                          {party.status === 'closed' ? (
                            <button onClick={() => handleStatusChange(party.id, 'recruiting', '모집을 다시 시작할까요?')} className="bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded text-sm transition font-medium border border-indigo-600">모집 재개 📢</button>
                          ) : (
                            <button onClick={() => handleStatusChange(party.id, 'closed', '파티 모집을 마감할까요?')} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm transition font-medium border border-slate-600">모집 마감 🔒</button>
                          )}
                          
                          <button onClick={() => handleDelete(party.id)} className="bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm transition font-medium">파티 삭제</button>
                        </>
                      )
                    ) : (
                      // 내가 파티장이 아닐 때
                      <button onClick={() => window.alert('참여 신청 모달과 연결이 필요합니다.')} className={`px-4 py-1.5 rounded text-sm transition font-bold ${isFinished || party.status === 'closed' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`} disabled={isFinished || party.status === 'closed'}>
                        {isFinished || party.status === 'closed' ? '신청 불가' : '참여 신청'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 mb-4">
                  일시: {party.party_date || party.period || '미정'} | 최대 인원: {party.max_members || party.max_member || 0}명
                </div>
                
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-sm font-medium mb-3">
                    파티원 현황 ({party.party_members?.length || 1} / {party.max_members || party.max_member || 0}명)
                  </h4>
                  <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-3 space-y-2">
                    {party.party_members && party.party_members.length > 0 ? (
                      party.party_members.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">⚔️ {member.character_name}</span>
                            {member.status === 'leader' && (
                              <span className="bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded text-[10px]">파티장</span>
                            )}
                            {member.memo && <span className="text-xs text-slate-400 ml-2">💭 {member.memo}</span>}
                          </div>
                          {isMyParty && member.character_name !== leaderName && !isFinished && (
                            <button onClick={() => handleKick(member.id, member.character_name)} className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 bg-red-950/30 px-2 py-1 rounded">
                              내보내기 ✕
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">⚔️ {leaderName || '파티장 정보'}</span>
                          <span className="bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded text-[10px]">파티장</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            해당 상태의 파티가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}