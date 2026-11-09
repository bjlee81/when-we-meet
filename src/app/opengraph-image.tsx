import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'When We Meet - 초간편 친구 약속 날짜 조율';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            padding: '10px 24px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '26px',
            fontWeight: 700,
          }}
        >
          ✨ 회원가입 없는 무료 약속 조율
        </div>

        <div
          style={{
            fontSize: '76px',
            fontWeight: 900,
            letterSpacing: '-2px',
            backgroundImage: 'linear-gradient(to right, #60a5fa, #818cf8, #c084fc)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          When We Meet
        </div>

        <div
          style={{
            fontSize: '32px',
            fontWeight: 500,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          링크 하나로 친구들과 가장 완벽한 약속 날짜를 찾아보세요!
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '44px',
            fontSize: '22px',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 캘린더 날짜 투표
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔥 실시간 히트맵
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 최적 날짜 자동 추천
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
