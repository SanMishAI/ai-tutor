import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: '#000936',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 15,
          letterSpacing: -0.5,
        }}
      >
        <span style={{ color: '#56DBFF' }}>S</span>
        <span style={{ color: '#FDC800' }}>E</span>
      </div>
    ),
    { ...size },
  )
}
