'use client'

import { useRouter } from 'next/navigation'
import { deleteCharacter } from './actions'

interface Character {
  id: string
  character_name: string
  world_name: string
  class_name: string
  character_level: number
  character_image?: string
  discord_nickname?: string
}

export default function CharacterManager({ characters }: { characters: Character[] }) {
  const router = useRouter()
  const existingNickname = characters.find(c => c.discord_nickname)?.discord_nickname;

  // 캐릭터 삭제 핸들러
  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault() // 폼 제출 간섭 완벽 차단

    if (window.confirm(`정말로 '${name}' 캐릭터를 삭제하시겠습니까?\n(파티에 소속되어 있다면 파티에서도 나가지게 될 수 있습니다)`)) {
      const result = await deleteCharacter(id)
      
      if (result.success) {
        router.refresh() // 성공 시 화면 즉시 새로고침
      } else {
        window.alert(`삭제 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            name="characterName"
            placeholder="캐릭터 닉네임 입력"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
            required
          />
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold transition-colors text-sm whitespace-nowrap"
          >
            캐릭터 등록
          </button>
        </div>

        {!existingNickname ? (
          <input
            type="text"
            name="discordNickname"
            placeholder="길드 디스코드 닉네임 (최초 1회 입력)"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
            required
          />
        ) : (
          <div className="text-xs text-emerald-400 px-1">
            ✔️ 길드 닉네임 자동 적용: {existingNickname}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 mt-4">
        {characters && characters.length > 0 ? (
          characters.map((char) => (
            <div key={char.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between group">
              
              {/* 캐릭터 정보 영역 */}
              <div className="flex items-center gap-4">
                {char.character_image ? (
                  <img src={char.character_image} alt={char.character_name} className="w-10 h-10 rounded bg-slate-900 object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-xs">No Img</div>
                )}
                <div>
                  <div className="font-bold text-sm">{char.character_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {char.world_name} | {char.class_name} | Lv.{char.character_level}
                  </div>
                </div>
              </div>

              {/* 삭제 버튼 영역 */}
              <button
                type="button"
                onClick={(e) => handleDelete(e, char.id, char.character_name)}
                className="text-slate-500 hover:text-red-400 hover:bg-red-950/30 p-2 rounded transition-colors"
                title="캐릭터 삭제"
              >
                ✕
              </button>

            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 py-6 text-sm bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
            등록된 캐릭터가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}