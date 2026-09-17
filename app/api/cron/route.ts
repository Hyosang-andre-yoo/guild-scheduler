// app/api/cron/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  const now = new Date()
  
  // 한국 시간(KST, UTC+9) 기준으로 계산
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)

  // ---------------------------------------------------------
  // 1. 디스코드 출발 1시간 전 알림
  // ---------------------------------------------------------
  if (webhookUrl) {
    const targetTime = new Date(kstNow.getTime() + 1 * 60 * 60 * 1000)
    const targetTimeStr = targetTime.toISOString().slice(0, 16)

    const { data: alertParties } = await supabase
      .from('parties')
      .select('*')
      .eq('departure_time', targetTimeStr)
      .neq('status', 'cleared')

    if (alertParties && alertParties.length > 0) {
      for (const party of alertParties) {
        const alertMsg = `⏰ **[출발 1시간 전 알림!]** ⏰\n\n**${party.boss_name} (${party.difficulty})** 파티가 1시간 뒤 출발할 예정입니다!\n- 📅 **확정 시간**: ${party.departure_time.replace('T', ' ')}\n- 💬 **메모**: ${party.description || '없음'}\n\n참여 인원분들은 디스코드 보스 채널에 모여서 준비해 주세요!`;
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: alertMsg }),
        }).catch(console.error)
      }
    }
  }

  // ---------------------------------------------------------
  // 2. 일회성 파티 자동 만료 (출발 후 24시간 경과 시)
  // ---------------------------------------------------------
  const yesterdayKst = new Date(kstNow.getTime() - 24 * 60 * 60 * 1000)
  const expireLimitStr = yesterdayKst.toISOString().slice(0, 16)

  await supabase
    .from('parties')
    .update({ status: 'closed' })
    .eq('is_fixed', false)
    .eq('status', 'recruiting')
    .lt('departure_time', expireLimitStr)

  // ---------------------------------------------------------
  // 3. 고정팟 자동 부활 (모집 완료 상태 유지, 출발 시간만 초기화)
  // ---------------------------------------------------------
  const isThursdayReset = kstNow.getDay() === 4 && kstNow.getHours() === 0 && kstNow.getMinutes() < 5
  const isMonthlyReset = kstNow.getDate() === 1 && kstNow.getHours() === 0 && kstNow.getMinutes() < 5

  if (isThursdayReset) {
    await supabase
      .from('parties')
      .update({ status: 'closed', departure_time: null })
      .eq('is_fixed', true)
      .eq('party_date', '매주 고정팟')
  }

  if (isMonthlyReset) {
    await supabase
      .from('parties')
      .update({ status: 'closed', departure_time: null })
      .eq('is_fixed', true)
      .eq('party_date', '매월 고정팟')
  }

  return NextResponse.json({ success: true })
}