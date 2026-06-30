import React from "react"

const PX: React.CSSProperties = { imageRendering: "pixelated", display: "block" }

function Crack1() {
  return (
    <>
      <line x1="9" y1="0" x2="13" y2="6" stroke="#000" strokeWidth="1" opacity="0.75" />
      <line x1="13" y1="6" x2="10" y2="9" stroke="#000" strokeWidth="1" opacity="0.75" />
    </>
  )
}

function Crack2() {
  return (
    <>
      <line x1="3" y1="3" x2="7" y2="9" stroke="#000" strokeWidth="1" opacity="0.75" />
      <line x1="7" y1="9" x2="4" y2="14" stroke="#000" strokeWidth="1" opacity="0.75" />
      <line x1="11" y1="2" x2="15" y2="7" stroke="#000" strokeWidth="1" opacity="0.75" />
      <line x1="9" y1="11" x2="14" y2="15" stroke="#000" strokeWidth="1" opacity="0.75" />
    </>
  )
}

function StoneBase() {
  return (
    <>
      <rect width="16" height="16" fill="#888" />
      <rect x="0" y="0" width="16" height="1" fill="#aaa" />
      <rect x="0" y="0" width="1" height="16" fill="#aaa" />
      <rect x="0" y="15" width="16" height="1" fill="#555" />
      <rect x="15" y="0" width="1" height="16" fill="#555" />
    </>
  )
}

export function BedrockBlock({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={PX}>
      <rect width="16" height="16" fill="#404040" />
      <rect x="1" y="1" width="3" height="2" fill="#5a5a5a" />
      <rect x="7" y="2" width="4" height="3" fill="#5a5a5a" />
      <rect x="13" y="1" width="2" height="3" fill="#5a5a5a" />
      <rect x="2" y="6" width="2" height="4" fill="#5a5a5a" />
      <rect x="9" y="7" width="4" height="2" fill="#5a5a5a" />
      <rect x="1" y="12" width="5" height="3" fill="#5a5a5a" />
      <rect x="11" y="11" width="3" height="4" fill="#5a5a5a" />
      <rect x="5" y="13" width="3" height="2" fill="#5a5a5a" />
      <rect x="0" y="15" width="16" height="1" fill="#1a1a1a" />
      <rect x="15" y="0" width="1" height="16" fill="#1a1a1a" />
    </svg>
  )
}

export function CoalOreBlock({ size = 64, cracks = 0 }: { size?: number; cracks?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={PX}>
      <StoneBase />
      <rect x="2" y="2" width="3" height="2" fill="#1a1a1a" />
      <rect x="3" y="3" width="2" height="3" fill="#1a1a1a" />
      <rect x="9" y="5" width="4" height="2" fill="#1a1a1a" />
      <rect x="10" y="4" width="2" height="4" fill="#1a1a1a" />
      <rect x="4" y="10" width="3" height="3" fill="#1a1a1a" />
      <rect x="5" y="9" width="2" height="5" fill="#1a1a1a" />
      <rect x="11" y="11" width="2" height="3" fill="#1a1a1a" />
      {cracks >= 1 && <Crack1 />}
      {cracks >= 2 && <Crack2 />}
    </svg>
  )
}

export function IronOreBlock({ size = 64, cracks = 0 }: { size?: number; cracks?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={PX}>
      <StoneBase />
      <rect x="2" y="3" width="4" height="2" fill="#D4A07A" />
      <rect x="3" y="2" width="2" height="4" fill="#D4A07A" />
      <rect x="9" y="4" width="5" height="2" fill="#D4A07A" />
      <rect x="10" y="3" width="3" height="4" fill="#D4A07A" />
      <rect x="3" y="10" width="4" height="3" fill="#D4A07A" />
      <rect x="4" y="9" width="2" height="5" fill="#D4A07A" />
      <rect x="10" y="10" width="4" height="2" fill="#D4A07A" />
      <rect x="11" y="9" width="2" height="4" fill="#D4A07A" />
      {cracks >= 1 && <Crack1 />}
      {cracks >= 2 && <Crack2 />}
    </svg>
  )
}

export function DiamondOreBlock({ size = 64, cracks = 0 }: { size?: number; cracks?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={PX}>
      <StoneBase />
      <rect x="1" y="3" width="4" height="2" fill="#5DE8F5" />
      <rect x="2" y="2" width="2" height="4" fill="#5DE8F5" />
      <rect x="9" y="1" width="5" height="2" fill="#5DE8F5" />
      <rect x="10" y="1" width="3" height="5" fill="#5DE8F5" />
      <rect x="2" y="10" width="4" height="3" fill="#5DE8F5" />
      <rect x="3" y="9" width="2" height="5" fill="#5DE8F5" />
      <rect x="10" y="10" width="4" height="2" fill="#5DE8F5" />
      <rect x="11" y="9" width="2" height="4" fill="#5DE8F5" />
      <rect x="1" y="2" width="1" height="1" fill="#a0f8ff" />
      <rect x="10" y="1" width="1" height="1" fill="#a0f8ff" />
      {cracks >= 1 && <Crack1 />}
      {cracks >= 2 && <Crack2 />}
    </svg>
  )
}

export function GoldBlock({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={PX}>
      <rect width="16" height="16" fill="#FACC15" />
      <rect x="0" y="0" width="16" height="1" fill="#FEF08A" />
      <rect x="0" y="0" width="1" height="16" fill="#FEF08A" />
      <rect x="0" y="15" width="16" height="1" fill="#CA8A04" />
      <rect x="15" y="0" width="1" height="16" fill="#CA8A04" />
      <rect x="4" y="0" width="1" height="16" fill="#EAB308" />
      <rect x="11" y="0" width="1" height="16" fill="#EAB308" />
      <rect x="0" y="4" width="16" height="1" fill="#EAB308" />
      <rect x="0" y="11" width="16" height="1" fill="#EAB308" />
      <rect x="5" y="6" width="2" height="2" fill="#FEF08A" />
      <rect x="9" y="6" width="2" height="2" fill="#FEF08A" />
      <rect x="7" y="8" width="2" height="2" fill="#CA8A04" />
    </svg>
  )
}
