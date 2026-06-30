import { ImageResponse } from 'next/og'

export const alt = 'SelectEd — AI-powered exam prep for Australian selective exams'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0b1a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Purple glow — top left */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
            top: -150,
            left: -120,
          }}
        />
        {/* Cyan glow — bottom right */}
        <div
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(0,229,255,0.2) 0%, transparent 70%)',
            bottom: -130,
            right: -100,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: 130,
            letterSpacing: -3,
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#00e5ff' }}>Select</span>
          <span style={{ color: '#ff44aa' }}>Ed</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontSize: 36,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            marginBottom: 36,
          }}
        >
          <span style={{ color: '#16a34a' }}>Sharpen</span>
          <span style={{ color: '#6b7280' }}>·</span>
          <span style={{ color: '#0284c7' }}>Sit</span>
          <span style={{ color: '#6b7280' }}>·</span>
          <span style={{ color: '#d97706' }}>Succeed.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: '#94a3b8',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 720,
          }}
        >
          AI-powered preparation for Australian & international competitions
        </div>

        {/* Exam badges — two rows of 4 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 36,
          }}
        >
          {[['AMC', 'Olympiad', 'ACER', 'ICAS'], ['ATAR', 'NAPLAN', 'Bebras', 'KSF']].map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 10 }}>
              {row.map((label) => (
            <div
              key={label}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: '#cbd5e1',
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
