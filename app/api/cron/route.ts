import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  const now = new Date()
  
  // 한국 시간(KST) 기준으로 계산
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const todayStr = kstNow.toISOString().split('T')[0]

  try {
    // ---------------------------------------------------------
    // 1. 디스코드 일일 브리핑 (디스코드 닉네임 + 참여 횟수 반영)
    // ---------------------------------------------------------
    if (webhookUrl) {
      const { data: todayParties } = await supabase
        .from('parties')
        .select(`
          *,
          party_members (
            user_id,
            character_name
          )
        `)
        .like('departure_time', `${todayStr}%`)
        .neq('status', 'completed')
        .neq('status', 'expired')

      if (todayParties && todayParties.length > 0) {
        let msg = `📅 **[오늘의 길드 보스 스케줄 브리핑]** 📅\n오늘 출발 예정인 보스 파티가 **${todayParties.length}개** 있습니다!\n\n`
        
        // 유저(user_id)별로 참여 캐릭터 이름(Set)과 참여 횟수(count)를 묶어서 저장
        const userParticipationMap = new Map<string, { chars: Set<string>, count: number }>()

        todayParties.forEach(party => {
          const timeMatch = party.departure_time?.match(/T(\d{2}:\d{2})/)
          const timeStr = timeMatch ? timeMatch[1] : '시간 미정'
          msg += `- ⏰ **${timeStr}** | ⚔️ **${party.boss_name}** (${party.difficulty}) | 👑 ${party.leader_character || '파티장'} 팟\n`
          
          if (party.party_members) {
            party.party_members.forEach((member: any) => {
              if (member.user_id) {
                if (!userParticipationMap.has(member.user_id)) {
                  userParticipationMap.set(member.user_id, { chars: new Set(), count: 0 })
                }
                const userData = userParticipationMap.get(member.user_id)!
                // 참여 캐릭터 이름 추가 (중복 방지)
                userData.chars.add(member.character_name)
                // 참여해야 할 파티 개수 1 증가
                userData.count += 1
              }
            })
          }
        })
        
        const mentionList: string[] = []
        
        for (const [userId, userData] of userParticipationMap.entries()) {
          // 새로 만든 discord_nickname 컬럼을 함께 불러옴
          const { data: mainChar } = await supabase
            .from('characters')
            .select('character_name, discord_nickname')
            .eq('user_id', userId)
            .order('id', { ascending: true })
            .limit(1)
            .single()
            
          // discord_nickname이 비어있으면 캐릭터 이름으로 대체
          const guildNickname = mainChar?.discord_nickname || mainChar?.character_name || '길드원'
          const joinedChars = Array.from(userData.chars).join(', ')
          
          // 예: @방생(보마방생, 렌방생) 2개
          mentionList.push(`@${guildNickname}(${joinedChars}) ${userData.count}개`)
        }

        const mentionsString = mentionList.join(', ')
        msg += `\n🔔 **오늘의 일정**: ${mentionsString}\n대시보드에서 일정을 확인하시고 늦지 않게 모여주세요!`

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: msg }),
        }).catch(console.error)
      }
    }

    // ---------------------------------------------------------
    // 2. 일회성 파티 자동 만료
    // ---------------------------------------------------------
    await supabase
      .from('parties')
      .update({ status: 'expired' })
      .eq('is_fixed', false)
      .lt('party_date', todayStr)
      .in('status', ['recruiting', 'closed'])

    // ---------------------------------------------------------
    // 3. 고정팟 자동 부활 (주간 / 월간 분리)
    // ---------------------------------------------------------
    const isThursday = kstNow.getDay() === 4 
    const isFirstDayOfMonth = kstNow.getDate() === 1 

    if (isThursday) {
      await supabase
        .from('parties')
        .update({ status: 'closed', departure_time: null })
        .eq('is_fixed', true)
        .eq('party_date', '매주 고정팟')
    }

    if (isFirstDayOfMonth) {
      await supabase
        .from('parties')
        .update({ status: 'closed', departure_time: null })
        .eq('is_fixed', true)
        .eq('party_date', '매월 고정팟')
    }

    return NextResponse.json({ success: true, message: '스케줄 브리핑 및 정리 완료' })

  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}