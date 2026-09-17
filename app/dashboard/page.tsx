import { createClient } from '../../utils/supabase/server'
import { fetchCharacterInfo } from '../../utils/nexon'
import { redirect } from 'next/navigation'
import PartyForm from './PartyForm'
import PartyApplyModal from './PartyApplyModal'
import ConfirmButton from './ConfirmButton'
import MySchedule from './MySchedule'
import GuildWeeklySchedule from './GuildWeeklySchedule'
import PartyEditModal from './PartyEditModal'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const currentTab = params.tab || 'recruiting'

  const { data: allCharacters } = await supabase.from('characters').select('*')
  const myCharacters = allCharacters?.filter((char: any) => char.user_id === user.id) || []

  const { data: parties } = await supabase
    .from('parties')
    .select(`
      *,
      party_members (
        id,
        character_name,
        status,
        user_id,
        memo
      )
    `)
    .order('id', { ascending: false })

  const registerCharacter = async (formData: FormData) => {
    'use server'
    const characterName = formData.get('characterName') as string
    if (!characterName) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existingChar } = await supabase.from('characters').select('*').eq('user_id', user.id).eq('character_name', characterName).single()
    if (existingChar) redirect('/dashboard?error=already-registered')

    const charInfo = await fetchCharacterInfo(characterName)
    if (!charInfo) redirect('/dashboard?error=not-found')

    // 넥슨 API 속성명 타입 호환성 처리 완료
    await supabase.from('characters').insert({
      user_id: user.id,
      character_name: charInfo.character_name ?? charInfo.characterName,
      world_name: charInfo.world_name ?? charInfo.worldName,
      class_name: charInfo.class_name ?? charInfo.className,
      character_level: charInfo.character_level ?? charInfo.characterLevel,
      character_image: charInfo.character_image ?? charInfo.characterImage,
    })
    redirect('/dashboard?success=registered')
  }

  const deleteParty = async (partyId: number) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('party_members').delete().eq('party_id', partyId)
    await supabase.from('parties').delete().eq('id', partyId).eq('leader_id', user.id)
    redirect('/dashboard?success=party-deleted')
  }

  const toggleRecruitParty = async (partyId: number) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: party } = await supabase.from('parties').select('status').eq('id', partyId).eq('leader_id', user.id).single()
    if (!party) return

    const nextStatus = party.status === 'closed' ? 'recruiting' : 'closed'
    await supabase.from('parties').update({ status: nextStatus }).eq('id', partyId).eq('leader_id', user.id)
    redirect('/dashboard?success=recruit-status-updated')
  }

  const toggleClearParty = async (partyId: number) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: party } = await supabase.from('parties').select('status').eq('id', partyId).eq('leader_id', user.id).single()
    if (!party) return

    const nextStatus = party.status === 'cleared' ? 'recruiting' : 'cleared'
    await supabase.from('parties').update({ status: nextStatus }).eq('id', partyId).eq('leader_id', user.id)
    redirect('/dashboard?success=clear-status-updated')
  }

  const applyParty = async (partyId: string, characterName: string, memo: string) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: targetParty } = await supabase.from('parties').select('*').eq('id', partyId).single()
    if (!targetParty) throw new Error('존재하지 않는 파티입니다.')

    const { data: existingUserParty } = await supabase.from('party_members').select('*').eq('party_id', partyId).eq('user_id', user.id).maybeSingle()
    if (existingUserParty) throw new Error('이미 이 파티에 등록된 본인 계정의 캐릭터가 있습니다.')

    const { data: allPartiesWithMembers } = await supabase.from('parties').select(`*, party_members (character_name, status)`)

    if (allPartiesWithMembers) {
      const isMonthlyBoss = targetParty.boss_name === '검은 마법사' || targetParty.party_date?.includes('월간 보스')
      for (const p of allPartiesWithMembers) {
        if (String(p.id) === String(partyId)) continue
        const isCharInParty = p.party_members?.some((m: any) => m.character_name === characterName)
        if (!isCharInParty) continue

        if (isMonthlyBoss) {
          const isSameMonth = p.party_date === targetParty.party_date || (p.party_date?.includes('월간 보스') && targetParty.party_date?.includes('월간 보스'))
          if (isSameMonth) throw new Error(`[${characterName}] 캐릭터는 이미 해당 월간 보스 파티에 참여 중입니다. (월 1회)`)
        } else {
          const isSameWeek = p.party_date === targetParty.party_date
          if (isSameWeek && !p.is_fixed && !targetParty.is_fixed) throw new Error(`[${characterName}] 캐릭터는 이미 해당 주차의 동일 보스 파티에 참여 중입니다. (주 1회)`)
        }
      }
    }

    await supabase.from('party_members').insert({ party_id: partyId, user_id: user.id, character_name: characterName, status: 'pending', memo: memo || null })
    redirect('/dashboard?success=applied')
  }

  const cancelParty = async (memberId: number) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('party_members').delete().eq('id', memberId).eq('user_id', user.id)
    redirect('/dashboard?success=cancelled')
  }

  const acceptMember = async (memberId: number) => {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('party_members').update({ status: 'accepted' }).eq('id', memberId)
    redirect('/dashboard?success=accepted')
  }

  // 자동 만료 및 아카이브 탭 필터링 로직
  const filteredParties = parties?.filter((party: any) => {
    const status = party.status || 'recruiting'
    
    let isExpired = false;
    if (!party.is_fixed && party.departure_time) {
      const now = new Date()
      const yesterdayKst = new Date(now.getTime() + (9 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000))
      const limitStr = yesterdayKst.toISOString().slice(0, 16)
      if (party.departure_time < limitStr) {
        isExpired = true;
      }
    }

    if (currentTab === 'recruiting') {
      return !isExpired && (status === 'recruiting' || status === 'closed')
    } else if (currentTab === 'cleared') {
      return status === 'cleared' || isExpired
    }
    return true
  }) || []

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">길드 파티 스케줄러 - 대시보드</h1>
          <a href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors">홈으로 돌아가기</a>
        </div>

        <MySchedule parties={parties || []} myCharacters={myCharacters} currentUserId={user.id} />
        <GuildWeeklySchedule parties={parties || []} />

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-indigo-400">새 보스 파티 모집하기</h2>
          <PartyForm characters={myCharacters} />
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-indigo-400">보스 파티 목록</h2>
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700 text-xs">
              <a href="/dashboard?tab=recruiting" className={`px-4 py-2 rounded-md font-bold transition-colors ${currentTab === 'recruiting' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>모집 / 진행 중</a>
              <a href="/dashboard?tab=cleared" className={`px-4 py-2 rounded-md font-bold transition-colors ${currentTab === 'cleared' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>완료 / 만료됨 🗄️</a>
              <a href="/dashboard?tab=all" className={`px-4 py-2 rounded-md font-bold transition-colors ${currentTab === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>전체 보기</a>
            </div>
          </div>

          {filteredParties.length > 0 ? (
            <div className="space-y-4">
              {filteredParties.map((party: any) => {
                const isLeader = party.leader_id === user.id;
                const acceptedCount = party.party_members?.filter((m: any) => m.status === 'accepted').length || 0;
                const isFull = acceptedCount >= party.max_members;
                const partyStatus = party.status || 'recruiting';

                const isExpiredUI = !party.is_fixed && party.departure_time && party.departure_time < new Date(new Date().getTime() + (9 * 60 * 60 * 1000) - (24 * 60 * 60 * 1000)).toISOString().slice(0, 16);

                return (
                  <div key={party.id} className={`p-4 rounded-lg border transition-all ${
                    partyStatus === 'cleared' ? 'bg-gray-950 border-emerald-900/60 opacity-80' : isExpiredUI ? 'bg-gray-950/40 border-gray-800 opacity-60' : partyStatus === 'closed' ? 'bg-gray-900/70 border-gray-800' : 'bg-gray-900 border-gray-700'
                  } flex flex-col gap-3`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {partyStatus === 'cleared' ? <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs px-2 py-0.5 rounded font-bold">🏆 토벌 완료</span>
                            : isExpiredUI ? <span className="bg-gray-800 text-gray-500 border border-gray-700 text-xs px-2 py-0.5 rounded font-bold">🗄️ 일정 만료</span>
                            : partyStatus === 'closed' ? <span className="bg-gray-800 text-gray-300 border border-gray-600 text-xs px-2 py-0.5 rounded font-semibold">🔒 모집 마감</span>
                            : isFull ? <span className="bg-amber-950 text-amber-300 border border-amber-700 text-xs px-2 py-0.5 rounded font-semibold">👥 정원 마감</span>
                            : <span className="bg-blue-950 text-blue-300 border border-blue-700 text-xs px-2 py-0.5 rounded font-semibold">📢 모집 중</span>}
                          
                          <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-0.5 rounded font-semibold">{party.difficulty}</span>
                          <span className="text-lg font-bold">{party.boss_name} 파티</span>
                          {isLeader && <span className="bg-amber-950 text-amber-300 text-xs px-2 py-0.5 rounded border border-amber-800">내 파티 (파티장)</span>}
                        </div>
                        <p className="text-sm text-gray-400">일시: {party.is_fixed ? (party.party_date === '매월 고정팟' ? '매월 고정팟' : '매주 고정팟') : party.party_date} | 최대 인원: {party.max_members}명</p>
                        
                        {party.departure_time && (
                          <p className={`text-sm mt-2 p-2 rounded border flex items-start gap-1 font-bold ${isExpiredUI ? 'text-gray-500 bg-gray-900/50 border-gray-800' : 'text-emerald-300/90 bg-emerald-950/40 border-emerald-900/50'}`}>
                            <span>⏰</span> <span>확정된 출발 시간: {party.departure_time.replace('T', ' ')}</span>
                          </p>
                        )}
                        
                        {party.description && (
                          <p className="text-sm text-yellow-300/90 mt-1 bg-gray-950/50 p-2 rounded border border-gray-800 flex items-start gap-1">
                            <span>💬</span> <span>공지/메모: {party.description}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {isLeader && (
                          <>
                            <PartyEditModal
                              partyId={party.id}
                              bossName={party.boss_name}
                              currentDifficulty={party.difficulty}
                              currentMaxMembers={party.max_members}
                              currentDescription={party.description || ''}
                              currentDepartureTime={party.departure_time || ''} 
                            />

                            <ConfirmButton id={party.id} action={toggleClearParty} confirmMessage={`[${party.boss_name} 파티] 상태를 토글하시겠습니까?`} className={`text-xs px-3 py-2 rounded-lg font-bold border ${partyStatus === 'cleared' ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-emerald-800 text-white border-emerald-600'}`}>
                              {partyStatus === 'cleared' ? '토벌 취소' : '토벌 완료 🏆'}
                            </ConfirmButton>
                            
                            {partyStatus !== 'cleared' && !isExpiredUI && (
                              <ConfirmButton id={party.id} action={toggleRecruitParty} confirmMessage={`모집 상태를 토글하시겠습니까?`} className={`text-xs px-3 py-2 rounded-lg font-bold border ${partyStatus === 'closed' ? 'bg-blue-800 text-white border-blue-600' : 'bg-gray-700 text-gray-200 border-gray-500'}`}>
                                {partyStatus === 'closed' ? '모집 재개 📢' : '모집 마감 🔒'}
                              </ConfirmButton>
                            )}
                            
                            <ConfirmButton id={party.id} action={deleteParty} confirmMessage="정말 파티를 삭제하시겠습니까?" className="bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold border border-red-600">파티 삭제</ConfirmButton>
                          </>
                        )}
                        
                        {!isLeader && partyStatus === 'recruiting' && !isFull && !isExpiredUI ? (
                          <PartyApplyModal partyId={party.id} bossName={party.boss_name} difficulty={party.difficulty} characters={myCharacters} onApplyAction={applyParty} />
                        ) : (
                          !isLeader && <span className="text-xs bg-gray-800 text-gray-500 px-3 py-2 rounded-lg border border-gray-700 cursor-not-allowed">
                            {partyStatus === 'cleared' ? '토벌 완료됨' : isExpiredUI ? '만료된 일정' : isFull ? '정원 마감' : '모집 마감됨'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-800">
                      <span className="text-xs font-semibold text-gray-400 mb-2 block">파티원 현황 ({acceptedCount} / {party.max_members}명 승인됨)</span>
                      <div className="flex flex-col gap-2">
                        {party.party_members?.length > 0 ? party.party_members.map((member: any) => {
                          const isMyApplication = member.user_id === user.id;
                          const matchedChar = allCharacters?.find((c: any) => c.character_name === member.character_name);
                          return (
                            <div key={member.id} className={`text-xs px-3 py-2 rounded-md border flex flex-col gap-1 ${member.status === 'accepted' ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">⚔️ {member.character_name}</span>
                                  {matchedChar && <span className="text-gray-400 text-[11px]">({matchedChar.class_name} / Lv.{matchedChar.character_level})</span>}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${member.status === 'accepted' ? 'bg-emerald-900 text-emerald-200' : 'bg-gray-700 text-gray-300'}`}>{member.status === 'accepted' ? '승인됨' : '대기중'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isLeader && member.status === 'pending' && !isExpiredUI && (
                                    <ConfirmButton id={member.id} action={acceptMember} confirmMessage={`승인하시겠습니까?`} className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">승인하기 ✓</ConfirmButton>
                                  )}
                                  {(isMyApplication || isLeader) && (
                                    <ConfirmButton id={member.id} action={cancelParty} confirmMessage={isLeader ? '내보내시겠습니까?' : '취소하시겠습니까?'} className="text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 rounded bg-red-950/40 border border-red-900">
                                      {isLeader ? '내보내기 ✕' : '신청 취소 ✕'}
                                    </ConfirmButton>
                                  )}
                                </div>
                              </div>
                              {member.memo && <p className="text-yellow-300/90 text-[11px] bg-gray-900/60 px-2 py-1 rounded mt-1">💬 {member.memo}</p>}
                            </div>
                          )
                        }) : <span className="text-xs text-gray-500 italic">아직 신청한 파티원이 없습니다.</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-gray-400 text-sm italic">해당 조건에 일치하는 보스 파티가 없습니다.</p>}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-indigo-400">내 메이플 캐릭터 관리</h2>
          <form action={registerCharacter} className="flex gap-4 mb-6">
            <input type="text" name="characterName" placeholder="캐릭터 닉네임 입력" className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white" required />
            <button type="submit" className="bg-gray-700 hover:bg-gray-600 font-bold px-6 py-2 rounded-lg transition-colors">캐릭터 등록</button>
          </form>
          {myCharacters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCharacters.map((char: any) => (
                <div key={char.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                  {char.character_image && <img src={char.character_image} alt={char.character_name} className="w-16 h-16 object-contain bg-gray-800 rounded-lg" />}
                  <div>
                    <h3 className="font-bold text-lg">{char.character_name}</h3>
                    <p className="text-sm text-gray-400">{char.world_name} | {char.class_name}</p>
                    <p className="text-sm text-indigo-300">Lv. {char.character_level}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400">등록된 캐릭터가 없습니다. 캐릭터를 먼저 등록해 주세요!</p>}
        </div>
      </div>
    </div>
  )
}