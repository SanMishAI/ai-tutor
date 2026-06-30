import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Built by a dad. For every parent. — SelectEd'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const photoData = await readFile(join(process.cwd(), 'public', 'san.jpeg'), 'base64')
  const photoSrc = `data:image/jpeg;base64,${photoData}`

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
            background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
            top: -160,
            left: -140,
            display: 'flex',
          }}
        />
        {/* Cyan glow — bottom right */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
            bottom: -120,
            right: -100,
            display: 'flex',
          }}
        />

        {/* Founder photo */}
        <img
          src={photoSrc}
          width={148}
          height={148}
          style={{
            borderRadius: 9999,
            border: '3px solid rgba(255,255,255,0.15)',
            objectFit: 'cover',
            marginBottom: 28,
          }}
        />

        {/* Headline — two lines via flex column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 62,
              fontWeight: 900,
              fontFamily: 'Arial Black, Impact, sans-serif',
              color: '#ffffff',
              lineHeight: 1.15,
            }}
          >
            Built by a dad.
          </span>
          <span
            style={{
              fontSize: 62,
              fontWeight: 900,
              fontFamily: 'Arial Black, Impact, sans-serif',
              color: '#ffffff',
              lineHeight: 1.15,
            }}
          >
            For every parent.
          </span>
        </div>

        {/* Name + role */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Arial, sans-serif' }}>
            Santrupta Mishra
          </span>
          <span style={{ fontSize: 18, color: '#64748b', fontFamily: 'Arial, sans-serif' }}>
            Director, Global Consulting · Melbourne
          </span>
        </div>

        {/* SelectEd wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: 36,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: '#00e5ff' }}>Select</span>
          <span style={{ color: '#ff44aa' }}>Ed</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
