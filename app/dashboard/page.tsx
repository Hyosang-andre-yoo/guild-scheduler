import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { fetchCharacterInfo } from '../../utils/nexon'

import PartyForm from './PartyForm'
import CharacterManager from './CharacterManager' 
import GuildWeeklySchedule from './GuildWeeklySchedule'
import PartyList from './PartyList' 
import SidebarWrapper from './SidebarWrapper'
import MySchedule from './MySchedule'

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

 // ⭐ 기존 조인 에러 우회를 유지하면서, 전체 캐릭터 정보를 가져와 수동으로 매핑합니다.
 const { data: partiesData } = await supabase
 .from('parties')
 .select('*')
 .order('id', { ascending: false })

const { data: membersData } = await supabase
 .from('party_members')
 .select('*')

const { data: allChars } = await supabase
 .from('characters')
 .select('character_name, class_name, character_level')

// 파티 데이터에 멤버 목록 및 직업/레벨 매핑
const parties = partiesData?.map(party => ({
 ...party,
 party_members: membersData?.filter(m => m.party_id === party.id).map(m => {
   const charInfo = allChars?.find(c => c.character_name === m.character_name)
   return { ...m, characters: charInfo }
 }) || []
})) || []

  // 캐릭터 등록 및 디코 닉네임 자동 처리 로직
  const registerCharacter = async (formData: FormData) => {
    'use server'
    const characterName = formData.get('characterName') as string
    const formDiscordNickname = formData.get('discordNickname') as string
    
    if (!characterName) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existingChar } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .eq('character_name', characterName)
      .single()
      
    if (existingChar) redirect('/dashboard?error=already-registered')

    const charInfo = await fetchCharacterInfo(characterName)
    if (!charInfo) redirect('/dashboard?error=not-found')

    const { data: myOtherChars } = await supabase
      .from('characters')
      .select('discord_nickname')
      .eq('user_id', user.id)
      .not('discord_nickname', 'is', null)
      .limit(1)

    let finalDiscordNickname = '길드원'

    if (myOtherChars && myOtherChars.length > 0 && myOtherChars[0].discord_nickname) {
      finalDiscordNickname = myOtherChars[0].discord_nickname
    } else if (formDiscordNickname) {
      finalDiscordNickname = formDiscordNickname
    }
    
    const { error } = await supabase.from('characters').insert([
      {
        user_id: user.id,
        character_name: charInfo.characterName,
        world_name: charInfo.worldName,
        class_name: charInfo.className,
        character_level: charInfo.characterLevel,
        character_image: charInfo.characterImage,
        discord_nickname: finalDiscordNickname
      },
    ])
    
    if (error) redirect('/dashboard?error=insert-failed')
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        
        <div className="flex-1 space-y-10">
          
          {/* 1. 내 캐릭터별 파티 스케줄 모아보기 */}
          <section>
            <MySchedule myCharacters={myCharacters} parties={parties} currentUserId={user.id} />
          </section>

          {/* 2. 길드 주간 보스 스케줄 */}
          <section>
            <h2 className="text-xl font-bold mb-4">📅 길드 주간 보스 스케줄</h2>
            <GuildWeeklySchedule parties={parties} />
          </section>

          {/* 3. 보스 파티 목록 */}
          <section>
            <PartyList 
              parties={parties} 
              myCharacters={myCharacters} 
              currentTab={currentTab} 
            />
          </section>

          {/* 4. 새 보스 파티 모집하기 */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-xl font-bold mb-4">새 보스 파티 모집하기</h2>
            <PartyForm characters={myCharacters} />
          </section>
        </div>

        {/* 5. 우측 사이드바 (내 캐릭터 관리) */}
        <SidebarWrapper>
          <form action={registerCharacter}>
            <CharacterManager characters={myCharacters} />
          </form>
        </SidebarWrapper>

      </div>
    </div>
  )
}