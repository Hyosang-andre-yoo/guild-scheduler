'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../utils/supabase/server'

// ⭐ 누락되었던 새 파티 생성 액션
export async function createParty(formData: FormData) {
  const bossName = formData.get('bossName') as string
  const difficulty = formData.get('difficulty') as string
  const maxMembers = Number(formData.get('maxMembers'))
  const isFixed = formData.get('isFixed') === 'true'
  const partyDate = formData.get('partyDate') as string
  const leaderCharacter = formData.get('leaderCharacter') as string
  const description = formData.get('description') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 1. parties 테이블에 파티 생성
  const { data: newParty, error: partyError } = await supabase
    .from('parties')
    .insert([
      {
        user_id: user.id,
        boss_name: bossName,
        difficulty,
        max_members: maxMembers,
        is_fixed: isFixed,
        party_date: partyDate,
        leader_character: leaderCharacter,
        description,
        status: 'recruiting'
      }
    ])
    .select()
    .single()

  if (partyError || !newParty) {
    console.error('Party create error:', partyError?.message)
    throw new Error('파티 생성 실패')
  }

  // 2. 파티 생성자를 자동으로 파티원(leader)으로 등록
  await supabase.from('party_members').insert([
    {
      party_id: newParty.id,
      user_id: user.id,
      character_name: leaderCharacter,
      status: 'leader',
      time_confirmed: false
    }
  ])

  revalidatePath('/dashboard')
}

// 1. 캐릭터 삭제 액션
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

// 2. 파티 상태 변경 액션 (모집중, 모집마감, 토벌완료 등)
export async function updatePartyStatus(partyId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('parties')
    .update({ status })
    .eq('id', partyId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 3. 파티 삭제 액션
export async function deleteParty(partyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('party_members').delete().eq('party_id', partyId)
  
  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', partyId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 4. 파티원 내보내기 액션
export async function removePartyMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('party_members')
    .delete()
    .eq('id', memberId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}

// 5. 파티 설정 수정 액션
export async function updatePartySettings(formData: FormData) {
  const partyId = formData.get('partyId') as string
  const difficulty = formData.get('difficulty') as string
  const maxMembers = Number(formData.get('maxMembers'))
  const description = formData.get('description') as string
  const partyDate = formData.get('partyDate') as string || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: members } = await supabase
    .from('party_members')
    .select('*')
    .eq('party_id', partyId)

  if (members && members.length > maxMembers) {
    throw new Error(`현재 승인된 파티원(${members.length}명)보다 적은 인원으로 수정할 수 없습니다.`)
  }

  const updateData: any = {
    difficulty,
    max_members: maxMembers,
    description,
  }

  if (partyDate) {
    updateData.party_date = partyDate
  }

  const { error } = await supabase
    .from('parties')
    .update(updateData)
    .eq('id', partyId)

  if (error) {
    console.error('Party update error:', error.message)
    throw new Error('파티 설정 수정 실패')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// 6. 파티장 출발 시간 설정 액션 (MySchedule용)
export async function updatePartyDepartureTime(formData: FormData) {
  const partyId = formData.get('partyId') as string
  const departureTime = formData.get('departureTime') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('parties')
    .update({ departure_time: departureTime })
    .eq('id', partyId)

  if (error) {
    console.error('Departure time update error:', error.message)
    throw new Error('출발 시간 설정 실패')
  }

  revalidatePath('/dashboard')
}

// 7. 파티원 출발 시간 확인 체크 액션
export async function toggleTimeConfirmation(memberId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('party_members')
    .update({ time_confirmed: !currentStatus })
    .eq('id', memberId)

  if (!error) {
    revalidatePath('/dashboard')
  }
  return { success: !error }
}