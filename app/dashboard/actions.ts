'use server'

import { revalidatePath } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

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

  // 파티 멤버 먼저 삭제 후 파티 삭제 (외래키 제약조건 방지)
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

// 5. 파티 설정 수정 액션 (난이도, 최대인원, 일정, 메모 반영)
export async function updatePartySettings(formData: FormData) {
  const partyId = formData.get('partyId') as string
  const difficulty = formData.get('difficulty') as string
  const maxMembers = Number(formData.get('maxMembers'))
  const description = formData.get('description') as string // 메모/설정 내용
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
    description, // 👈 DB 컬럼에 메모 내용 반영
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