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

  // ⭐ 캐릭터 등록 및 디코 닉네임 자동 처리 로직
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

    // 1. 이미 등록해둔 내 다른 캐릭터가 있는지 확인
    const { data: myOtherChars } = await supabase
      .from('characters')
      .select('discord_nickname')
      .eq('user_id', user.id)
      .not('discord_nickname', 'is', null)
      .limit(1)

    let finalDiscordNickname = '길드원'

    if (myOtherChars && myOtherChars.length > 0 && myOtherChars[0].discord_nickname) {
      // 이미 다른 캐릭에 등록해둔 닉네임이 있다면 알아서 복사
      finalDiscordNickname = myOtherChars[0].discord_nickname
    } else if (formDiscordNickname) {
      // 다른 캐릭이 없고 폼에서 새로 입력받았다면 그걸 적용
      finalDiscordNickname = formDiscordNickname
    }
    
    // 2. 캐릭터 정보와 닉네임 DB에 함께 저장
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
          
          {/* 1. 내 캐릭터별 파티 스케줄 모아보기 (개인 스케줄러) */}
          <section>
          <MySchedule myCharacters={myCharacters} parties={parties || []} currentUserId={user.id} />
          </section>

          {/* 2. 길드 주간 보스 스케줄 (2주치 세로 뷰) */}
          <section>
            <h2 className="text-xl font-bold mb-4">📅 길드 주간 보스 스케줄</h2>
            <GuildWeeklySchedule parties={parties || []} />
          </section>

          {/* 3. 보스 파티 목록 (구인구직 게시판) */}
          <section>
            <PartyList 
              parties={parties || []} 
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

        {/* 5. 우측 숨김 가능한 사이드바 (내 캐릭터 관리) */}
        <SidebarWrapper>
          <form action={registerCharacter}>
            <CharacterManager characters={myCharacters} />
          </form>
        </SidebarWrapper>

      </div>
    </div>
  )
}