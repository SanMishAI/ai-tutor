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
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>

        {/* Full-bleed photo */}
        <img
          src={photoSrc}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />

        {/* Dark gradient — bottom two-thirds so text is legible */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '68%',
            background: 'linear-gradient(to top, rgba(10,11,26,1) 0%, rgba(10,11,26,0.88) 45%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Text content anchored to bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '48px 64px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                fontFamily: 'Arial Black, Impact, sans-serif',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              Built by a dad.
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                fontFamily: 'Arial Black, Impact, sans-serif',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              For every parent.
            </span>
          </div>

          {/* Name + role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <span style={{ fontSize: 22, color: '#94a3b8', fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>
              Santrupta Mishra · Director, Global Consulting · Melbourne
            </span>
          </div>

          {/* Wordmark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginTop: 20,
              fontFamily: 'Arial Black, Impact, sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 32,
              letterSpacing: -1,
            }}
          >
            <span style={{ color: '#00e5ff' }}>Select</span>
            <span style={{ color: '#ff44aa' }}>Ed</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
