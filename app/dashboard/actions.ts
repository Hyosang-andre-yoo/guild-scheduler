'use server'

import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache' // 👈 새로고침을 위해 추가됨

// 디스코드 웹훅 알림 전송 헬퍼 함수
export async function sendDiscordWebhook(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return // URL이 설정되지 않았으면 무시
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })
  } catch (err) {
    console.error('Discord Webhook error:', err)
  }
}

// 파티 생성
export async function createParty(formData: FormData) {
  const bossName = formData.get('bossName') as string
  const difficulty = formData.get('difficulty') as string
  const isFixed = formData.get('isFixed') === 'on'
  const maxMembers = Number(formData.get('maxMembers'))
  const description = formData.get('description') as string
  const leaderCharacter = formData.get('leaderCharacter') as string

  const monthlyBosses = ['검은 마법사']
  const isMonthly = monthlyBosses.includes(bossName)

  const partyDate = isFixed ? (isMonthly ? '매월 고정팟' : '매주 고정팟') : (formData.get('partyDate') as string)

  if (!bossName || !difficulty || !maxMembers || !leaderCharacter || (!isFixed && !partyDate)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 중복 검증 로직
  const { data: existingParties } = await supabase
    .from('parties')
    .select('*')
    .eq('boss_name', bossName)
    .eq('party_date', partyDate)

  if (existingParties && existingParties.length > 0) {
    throw new Error('이미 해당 일정에 동일한 보스 파티가 개설되어 있습니다.')
  }

  // 파티 데이터 삽입
  const { data: newParty, error: partyError } = await supabase.from('parties').insert({
    leader_id: user.id,
    boss_name: bossName,
    difficulty: difficulty,
    party_date: partyDate,
    max_members: maxMembers,
    description: description,
    is_fixed: isFixed,
  }).select().single()

  if (partyError || !newParty) {
    console.error('Party insert error:', partyError?.message)
    throw new Error('파티 개설 중 오류가 발생했습니다.')
  }

  // 파티장 멤버로 즉시 등록
  await supabase.from('party_members').insert({
    party_id: newParty.id,
    user_id: user.id,
    character_name: leaderCharacter,
    status: 'accepted',
    memo: '파티장',
  })

  // 🔔 디스코드 채널로 알림 전송 (에러가 나도 파티 생성은 성공하도록 await 처리만 함)
  const alertMsg = `📢 **새로운 보스 파티가 개설되었습니다!**\n- ⚔️ **보스**: ${bossName} (${difficulty})\n- 📅 **일정**: ${partyDate}\n- 👑 **파티장**: ${leaderCharacter}\n- 👥 **인원**: 1 / ${maxMembers}명\n대시보드에서 신청해주세요!`;
  await sendDiscordWebhook(alertMsg)

  redirect('/dashboard?success=party-created')
}

// 파티 설정 수정 액션
export async function updatePartySettings(formData: FormData) {
  const partyId = formData.get('partyId') as string
  const difficulty = formData.get('difficulty') as string
  const maxMembers = Number(formData.get('maxMembers'))
  const description = formData.get('description') as string
  const departureTime = formData.get('departureTime') as string || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: members } = await supabase
    .from('party_members')
    .select('*')
    .eq('party_id', partyId)
    .eq('status', 'accepted')

  if (members && members.length > maxMembers) {
    throw new Error(`현재 승인된 파티원(${members.length}명)보다 적은 인원으로 수정할 수 없습니다.`)
  }

  const { error } = await supabase
    .from('parties')
    .update({
      difficulty,
      max_members: maxMembers,
      description,
      departure_time: departureTime
    })
    .eq('id', partyId)
    .eq('leader_id', user.id)

  if (error) {
    console.error('Party update error:', error.message)
    throw new Error('파티 설정 수정 실패')
  }

  redirect('/dashboard?success=party-updated')
}

// ==========================================
// ⭐ 아래부터 새로 추가된 버튼 작동용 액션들 ⭐
// ==========================================

// 1. 파티 상태 변경 (토벌 완료, 모집 마감 등)
export async function updatePartyStatus(partyId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('parties')
    .update({ status })
    .eq('id', partyId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 2. 파티 삭제
export async function deleteParty(partyId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', partyId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 3. 파티원 강퇴 (내보내기)
export async function removePartyMember(memberId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('party_members')
    .delete()
    .eq('id', memberId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 캐릭터 삭제 액션
export async function deleteCharacter(characterId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)

  if (error) {
    console.error('캐릭터 삭제 오류:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}