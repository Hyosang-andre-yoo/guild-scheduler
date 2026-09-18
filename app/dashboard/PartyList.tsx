'use client'

import { useState } from 'react'
import { updatePartyStatus, deleteParty, removePartyMember, updatePartySettings, applyToParty, acceptPartyMember, rejectPartyMember } from './actions'

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
  const [editingParty, setEditingParty] = useState<any>(null)
  const [applyingParty, setApplyingParty] = useState<any>(null)
  
  const currentUserId = myCharacters.length > 0 ? myCharacters[0].user_id : null;

  const filteredParties = parties.filter((party) => {
    if (selectedChar !== 'all') {
      const isMember = party.party_members?.some((m: any) => m.character_name === selectedChar)
      // ⭐ 파티장 찾는 로직 똑똑하게 수정
      const leaderName = party.party_members?.find((m: any) => m.status === 'leader')?.character_name || party.leader_character || party.party_members?.[0]?.character_name;
      const isLeader = leaderName === selectedChar;
      if (!isMember && !isLeader) return false
    }

    if (tab === 'recruiting') {
      return party.status === 'recruiting'
    }
    
    if (tab === 'completed') {
      return party.status === 'closed' || party.status === 'completed' || party.status === 'expired'
    }

    return true
  })

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

  const handleLeave = async (memberId: string, isPending: boolean) => {
    const msg = isPending ? '파티 가입 신청을 취소하시겠습니까?' : '정말로 이 파티에서 탈퇴하시겠습니까?';
    if (window.confirm(msg)) {
      await removePartyMember(memberId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold">⚔️ 보스 파티 목록</h2>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button onClick={() => setTab('recruiting')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'recruiting' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>모집 / 진행 중</button>
          <button onClick={() => setTab('completed')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'completed' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>완료 / 만료됨</button>
          <button onClick={() => setTab('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>전체 보기</button>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {filteredParties.length > 0 ? (
          filteredParties.map((party) => {
            // ⭐ 파티장 찾는 로직 수정 반영
            const leaderName = party.party_members?.find((m: any) => m.status === 'leader')?.character_name || party.leader_character || party.party_members?.[0]?.character_name;
            const isMyParty = (currentUserId && party.user_id === currentUserId) || (leaderName && myCharacters.some(char => char.character_name === leaderName));
            const isFinished = party.status === 'completed' || party.status === 'expired';

            return (
              <div key={party.id} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition-all ${isFinished ? 'opacity-70 grayscale-[30%]' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${party.status === 'completed' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : party.status === 'expired' ? 'bg-slate-800 text-slate-400 border-slate-600' : party.status === 'closed' ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-indigo-900/50 text-indigo-400 border-indigo-500/30'}`}>
                      {party.status === 'completed' ? '🏆 토벌 완료' : party.status === 'expired' ? '⏳ 기간 만료' : party.status === 'closed' ? '🔒 모집 마감' : '📢 모집 중'}
                    </span>
                    <span className="bg-purple-900/50 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-xs font-bold">{party.difficulty || 'Extreme'}</span>
                    <h3 className="font-bold text-lg">{party.boss_name} 파티</h3>
                    {isMyParty && <span className="text-xs font-bold text-orange-400 border border-orange-500/50 bg-orange-950 px-2 py-0.5 rounded">내 파티 (파티장)</span>}
                    {party.is_fixed && <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-900/30 px-2 py-0.5 rounded">고정팟</span>}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* ⭐ 일반 파티원 탈퇴 버튼 렌더링 로직 적용 */}
                    {(() => {
                      const myMembership = party.party_members?.find((m: any) => 
                        myCharacters.some(char => char.character_name === m.character_name)
                      );

                      if (isMyParty) {
                        return isFinished ? (
                          <>
                            <button onClick={() => handleStatusChange(party.id, 'recruiting', '이 파티를 다시 모집 중 상태로 되돌릴까요?')} className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded text-sm transition font-medium">다시 모집 📢</button>
                            <button onClick={() => handleDelete(party.id)} className="bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm transition font-medium">파티 삭제</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingParty(party)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-sm transition font-medium border border-slate-600">설정 ⚙️</button>
                            <button onClick={() => handleStatusChange(party.id, 'completed', '파티를 토벌 완료 처리할까요?')} className="bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded text-sm transition font-medium">토벌 완료 🏆</button>
                            
                            {party.status === 'closed' ? (
                              <button onClick={() => handleStatusChange(party.id, 'recruiting', '모집을 다시 시작할까요?')} className="bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded text-sm transition font-medium border border-indigo-600">모집 재개 📢</button>
                            ) : (
                              <button onClick={() => handleStatusChange(party.id, 'closed', '파티 모집을 마감할까요?')} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm transition font-medium border border-slate-600">모집 마감 🔒</button>
                            )}
                            
                            <button onClick={() => handleDelete(party.id)} className="bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded text-sm transition font-medium">파티 삭제</button>
                          </>
                        );
                      } else if (myMembership) {
                        // 내가 파티장도 아닌데 파티원으로 소속되어 있는 경우 (탈퇴 / 신청 취소 표시)
                        return myMembership.status === 'pending' ? (
                          <button onClick={() => handleLeave(myMembership.id, true)} className="bg-slate-700 hover:bg-slate-600 px-4 py-1.5 rounded text-sm transition font-bold border border-slate-600">신청 취소</button>
                        ) : (
                          <button onClick={() => handleLeave(myMembership.id, false)} className="bg-red-900/80 hover:bg-red-800 text-red-200 px-4 py-1.5 rounded text-sm transition font-bold border border-red-800/50">파티 탈퇴</button>
                        );
                      } else {
                        // 파티에 소속되지 않은 외부 유저인 경우 (참여 신청)
                        return (
                          <button 
                            onClick={() => setApplyingParty(party)} 
                            className={`px-4 py-1.5 rounded text-sm transition font-bold ${isFinished || party.status === 'closed' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`} 
                            disabled={isFinished || party.status === 'closed'}
                          >
                            {isFinished || party.status === 'closed' ? '신청 불가' : '참여 신청'}
                          </button>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                <div className="text-sm text-slate-400 mb-4 flex flex-col gap-1">
                  <div>일시: {party.party_date || party.period || '미정'} | 최대 인원: {party.max_members || party.max_member || 0}명</div>
                  {party.description && (
                    <div className="text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-1 rounded text-xs mt-1">
                      💬 메모: {party.description}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-sm font-medium mb-3">파티원 현황 ({party.party_members?.filter((m:any) => m.status !== 'pending').length || 1} / {party.max_members || party.max_member || 0}명)</h4>
                  
                  <div className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-3 space-y-2">
                    {party.party_members && party.party_members.filter((m:any) => m.status !== 'pending').length > 0 ? (
                      party.party_members.filter((m:any) => m.status !== 'pending').map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-200">⚔️ {member.character_name}</span>
                            
                            {member.characters && (
                              <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {member.characters.class_name} | Lv.{member.characters.character_level}
                              </span>
                            )}

                            {member.status === 'leader' && <span className="bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded text-[10px]">파티장</span>}
                            {member.memo && <span className="text-xs text-slate-400 ml-2">💭 {member.memo}</span>}
                          </div>
                          {isMyParty && member.character_name !== leaderName && !isFinished && (
                            <button onClick={() => handleKick(member.id, member.character_name)} className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 bg-red-950/30 px-2 py-1 rounded">내보내기 ✕</button>
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
                    
                    {isMyParty && party.party_members?.some((m:any) => m.status === 'pending') && (
                      <div className="mt-4 pt-3 border-t border-slate-800 border-dashed">
                        <h5 className="text-xs font-bold text-indigo-400 mb-2">🙋‍♂️ 가입 대기 ({party.party_members.filter((m:any) => m.status === 'pending').length}명)</h5>
                        <div className="space-y-2">
                          {party.party_members.filter((m:any) => m.status === 'pending').map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between bg-indigo-950/30 p-2 rounded border border-indigo-900/50">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-300">{member.character_name}</span>
                                {member.characters && (
                                  <span className="text-[11px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                    {member.characters.class_name} | Lv.{member.characters.character_level}
                                  </span>
                                )}
                                {member.memo && <span className="text-xs text-slate-400 ml-2">💭 {member.memo}</span>}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => acceptPartyMember(member.id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-bold">수락</button>
                                <button onClick={() => rejectPartyMember(member.id)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded">거절</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-10 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">조건에 맞는 파티가 없습니다.</div>
        )}
      </div>

      {editingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">⚙️ 파티 설정 수정</h3>
              <button onClick={() => setEditingParty(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              formData.append('partyId', editingParty.id)
              
              await updatePartySettings(formData)
              setEditingParty(null)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">난이도</label>
                <select name="difficulty" defaultValue={editingParty.difficulty || 'Normal'} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="Normal">Normal</option>
                  <option value="Hard">Hard</option>
                  <option value="Chaos">Chaos</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">최대 인원</label>
                <input type="number" name="maxMembers" defaultValue={editingParty.max_members || editingParty.max_member || 1} min={editingParty.party_members?.length || 1} max={6} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" required />
              </div>
              {!editingParty.is_fixed ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">출발 일정 (날짜 수정)</label>
                  <input type="date" name="partyDate" defaultValue={editingParty.party_date || ''} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">출발 일정 (고정팟)</label>
                  <input type="text" value={editingParty.party_date || '매주 고정팟'} disabled className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded-lg px-4 py-2 text-sm cursor-not-allowed" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">파티 설명 / 메모</label>
                <input type="text" name="description" defaultValue={editingParty.description || ''} placeholder="예: 2층 좌측 / 디코 필수" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditingParty(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold transition">취소</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold transition">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applyingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">🙋‍♂️ 파티 참여 신청</h3>
              <button onClick={() => setApplyingParty(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              formData.append('partyId', applyingParty.id)
              
              try {
                await applyToParty(formData)
                setApplyingParty(null)
              } catch (err: any) {
                alert(err.message)
              }
            }} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">참여할 내 캐릭터</label>
                {myCharacters.length > 0 ? (
                  <select name="characterName" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" required>
                    {myCharacters.map(char => (
                      <option key={char.id} value={char.character_name}>
                        {char.character_name} ({char.class_name} | Lv.{char.character_level})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-red-400 bg-red-950/50 p-2 rounded border border-red-900/50">
                    우측 사이드바에서 먼저 캐릭터를 등록해주세요.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">파티장에게 남길 메모 (선택)</label>
                <input type="text" name="memo" placeholder="예: 비숍입니다 / 디코 가능" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-800">
                <button type="button" onClick={() => setApplyingParty(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold transition">취소</button>
                <button type="submit" disabled={myCharacters.length === 0} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50">신청하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}