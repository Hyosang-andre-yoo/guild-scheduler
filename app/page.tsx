import { createClient } from '../utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  // 현재 로그인한 사용자 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 로그아웃을 처리하는 서버 액션
  const logout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">메이플 파티 보스 스케줄러</h1>

      {user ? (
        // 로그인된 상태일 때 보여줄 화면
        <div className="flex flex-col items-center bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <p className="text-xl mb-2 text-green-400 font-semibold">
            환영합니다! 🎉
          </p>
          <p className="text-gray-300 mb-6">
            디스코드 계정으로 로그인되었습니다.
          </p>
          
          {/* 대시보드로 이동하는 링크 */}
          <a
            href="/dashboard"
            className="mb-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-center w-full block"
          >
            내 캐릭터 관리 및 대시보드로 가기
          </a>

          <form action={logout} className="w-full">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full"
            >
              로그아웃
            </button>
          </form>
        </div>
      ) : (
        // 로그인되지 않은 상태일 때 보여줄 로그인 버튼
        <a
          href="/auth/login"
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          디스코드로 로그인
        </a>
      )}
    </div>
  )
}