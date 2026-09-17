const NEXON_API_KEY = process.env.NEXT_PUBLIC_NEXON_API_KEY || ''
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1'

export async function fetchCharacterInfo(characterName: string) {
  try {
    // 1. 캐릭터 ocid(고유 식별자) 조회
    const ocidRes = await fetch(
      `${BASE_URL}/id?character_name=${encodeURIComponent(characterName)}`,
      {
        headers: {
          'x-nxopen-api-key': NEXON_API_KEY,
        },
      }
    )

    if (!ocidRes.ok) throw new Error('캐릭터를 찾을 수 없습니다.')
    const ocidData = await ocidRes.json()
    const ocid = ocidData.ocid

    // 2. ocid를 이용해 캐릭터 기본 정보 조회
    const basicRes = await fetch(`${BASE_URL}/character/basic?ocid=${ocid}`, {
      headers: {
        'x-nxopen-api-key': NEXON_API_KEY,
      },
    })

    if (!basicRes.ok) throw new Error('캐릭터 정보를 불러오지 못했습니다.')
    const basicData = await basicRes.json()

    return {
      characterName: basicData.character_name,
      worldName: basicData.world_name,
      className: basicData.character_class,
      characterLevel: basicData.character_level,
      characterImage: basicData.character_image,
    }
  } catch (error: any) {
    console.error(error)
    return null
  }
}