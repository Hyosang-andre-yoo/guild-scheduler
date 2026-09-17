'use client'

import { useState } from 'form' // 혹은 React 상태 관리
import { createClient } from '@/utils/supabase/client' // Supabase 클라이언트 경로에 맞게 조절

interface PartyFormProps {
  onSuccess?: () => void
}

export default function PartyForm({ onSuccess }: PartyFormProps) {
  const [bossName, setBossName] = useState('익스트림 스우 (주간)')
  const [characterName, setCharacterName] = useState('보마방생')
  const [partyType, setPartyType] = useState(false) // 고정팟 여부
  const [difficulty, setDifficulty] = useState('Extreme')
  const [maxMember, setMaxMember] = useState(4)
  const [period, setPeriod] = useState('목요일 ~ 수요일 (1주차)')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Supabase 테이블에 데이터 삽입 (테이블 이름은 실제 사용하시는 이름으로 확인 필요)
      const { error } = await supabase.from('parties').insert([
        {
          boss_name: bossName,
          character_name: characterName,
          is_fixed: partyType,
          difficulty: difficulty,
          max_member: Number(maxMember),
          period: period,
          memo: memo,
        },
      ])

      if (error) throw error

      alert('보스 파티가 성공적으로 생성되었습니다! 🚀')
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('파티 생성 에러:', error.message)
      alert(`파티 생성 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-950 text-white rounded-xl border border-slate-800 shadow-xl">
      <h2 className="text-2xl font-bold mb-6">새 보스 파티 모집하기</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 보스 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">보스 선택</label>
            <select
              value={bossName}
              onChange={(e) => setBossName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="익스트림 스우 (주간)">익스트림 스우 (주간)</option>
              <option value="익스트림 카린 (주간)">익스트림 카린 (주간)</option>
              <option value="하드 림보 (주간)">하드 림보 (주간)</option>
            </select>
          </div>

          {/* 내 대표 캐릭터 */}
          <div>
            <label className="block text-sm font-medium mb-2">내 대표 캐릭터</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 파티 유형 */}
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="partyType"
              checked={partyType}
              onChange={(e) => setPartyType(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700"
            />
            <label htmlFor="partyType" className="text-sm font-medium">고정팟 여부</label>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block text-sm font-medium mb-2">난이도</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="Extreme">Extreme</option>
              <option value="Hard">Hard</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* 최대 인원 */}
          <div>
            <label className="block text-sm font-medium mb-2">최대 인원</label>
            <input
              type="number"
              value={maxMember}
              onChange={(e) => setMaxMember(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 주차 / 기간 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">주차 / 기간 선택</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="목요일 ~ 수요일 (1주차)">목요일 ~ 수요일 (1주차)</option>
            </select>
          </div>

          {/* 파티장 공지 및 메모 */}
          <div>
            <label className="block text-sm font-medium mb-2">파티장 공지 및 메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 스펙 컷 자유, 무언 팟"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition rounded-xl font-semibold text-white shadow-lg flex items-center justify-center space-x-2"
        >
          <span>{loading ? '생성 중...' : '보스 파티 생성하기 🚀'}</span>
        </button>
      </form>
    </div>
  )
}