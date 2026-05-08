const STITCH_STEPS = [0, 1, 2, 3, 4, 5]

const stitchOffset = (index: number, base: number) => {
  const curve = [1.2, 0.7, 0.25, 0.25, 0.7, 1.2][index] ?? 0
  return curve * base
}

export const PwaIconArt = ({
  size,
  cornerRadius,
}: {
  size: number
  cornerRadius: number
}) => {
  const panelSize = size * 0.3
  const gap = size * 0.07
  const left = size * 0.16
  const right = left + panelSize + gap
  const top = size * 0.15
  const bottom = top + panelSize + gap
  const stitchDot = size * 0.015

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: cornerRadius,
        background:
          'radial-gradient(circle at 22% 18%, rgba(249,115,22,0.24), transparent 26%), linear-gradient(160deg, #0f172a 0%, #173250 55%, #21456d 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: size * 0.045,
          borderRadius: cornerRadius * 0.9,
          border: `${Math.max(1, size * 0.01)}px solid rgba(255,255,255,0.08)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: top + panelSize * 0.1,
          left: left + panelSize * 0.1,
          width: panelSize * 0.8,
          height: panelSize * 0.8,
          borderRadius: '9999px',
          background: 'linear-gradient(180deg, #fffdf8 0%, #fff5ea 100%)',
          boxShadow: '0 12px 26px rgba(2, 6, 23, 0.26)',
        }}
      />

      {STITCH_STEPS.map((step) => (
        <div
          key={`left-${step}`}
          style={{
            position: 'absolute',
            top: top + panelSize * (0.24 + step * 0.082),
            left: left + panelSize * 0.3 - stitchOffset(step, panelSize * 0.014),
            width: stitchDot,
            height: stitchDot * 1.9,
            borderRadius: '9999px',
            background: '#f97316',
            transform: 'rotate(-32deg)',
          }}
        />
      ))}

      {STITCH_STEPS.map((step) => (
        <div
          key={`right-${step}`}
          style={{
            position: 'absolute',
            top: top + panelSize * (0.24 + step * 0.082),
            left: left + panelSize * 0.67 + stitchOffset(step, panelSize * 0.014),
            width: stitchDot,
            height: stitchDot * 1.9,
            borderRadius: '9999px',
            background: '#f97316',
            transform: 'rotate(32deg)',
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top,
          left: right,
          width: panelSize,
          height: panelSize,
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.18,
            left: panelSize * 0.16,
            width: panelSize * 0.09,
            height: panelSize * 0.64,
            borderRadius: panelSize * 0.04,
            background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
            boxShadow: '0 8px 18px rgba(2, 6, 23, 0.18)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.18,
            left: panelSize * 0.28,
            width: panelSize * 0.54,
            height: panelSize * 0.64,
            borderRadius: panelSize * 0.045,
            background: 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)',
            boxShadow: '0 8px 18px rgba(2, 6, 23, 0.16)',
          }}
        />
        {[0, 1, 2].map((index) => (
          <div
            key={`note-${index}`}
            style={{
              position: 'absolute',
              top: panelSize * (0.31 + index * 0.15),
              left: panelSize * 0.37,
              width: panelSize * (index === 2 ? 0.28 : 0.36),
              height: size * 0.012,
              borderRadius: '9999px',
              background: index === 0 ? '#1e3a5f' : '#64748b',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.49,
            left: panelSize * 0.58,
            width: panelSize * 0.09,
            height: panelSize * 0.36,
            borderRadius: '9999px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #fb923c 100%)',
            border: `${Math.max(1, size * 0.005)}px solid rgba(15,23,42,0.18)`,
            boxShadow: '0 6px 14px rgba(2, 6, 23, 0.22)',
            transform: 'rotate(38deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.78,
            left: panelSize * 0.66,
            width: 0,
            height: 0,
            borderLeft: `${panelSize * 0.045}px solid transparent`,
            borderRight: `${panelSize * 0.045}px solid transparent`,
            borderTop: `${panelSize * 0.11}px solid #1e293b`,
            transform: 'rotate(38deg)',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: bottom,
          left,
          width: panelSize,
          height: panelSize,
          borderRadius: size * 0.07,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(239,246,255,0.96) 100%)',
          boxShadow: '0 16px 36px rgba(2, 6, 23, 0.2)',
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: panelSize * 0.18,
            bottom: panelSize * 0.18,
            width: panelSize * 0.62,
            height: size * 0.01,
            borderRadius: '9999px',
            background: 'rgba(226,232,240,0.92)',
          }}
        />
        {[0, 1, 2].map((index) => {
          const heights = [0.28, 0.46, 0.64]
          return (
            <div
              key={`bar-${index}`}
              style={{
                position: 'absolute',
                left: panelSize * (0.24 + index * 0.17),
                bottom: panelSize * 0.2,
                width: panelSize * 0.09,
                height: panelSize * heights[index],
                borderRadius: '9999px',
                background:
                  index === 2
                    ? 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)'
                    : '#1e3a5f',
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.2,
            right: panelSize * 0.18,
            width: panelSize * 0.18,
            height: panelSize * 0.18,
            borderRadius: '9999px',
            background: 'rgba(249,115,22,0.18)',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: bottom,
          left: right,
          width: panelSize,
          height: panelSize,
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.2,
            left: panelSize * 0.18,
            width: panelSize * 0.62,
            height: panelSize * 0.36,
            borderRadius: panelSize * 0.08,
            background: '#ffffff',
            border: `${Math.max(1, size * 0.007)}px solid rgba(249,115,22,0.32)`,
            boxShadow: '0 10px 22px rgba(2, 6, 23, 0.18)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: panelSize * 0.5,
            left: panelSize * 0.33,
            width: panelSize * 0.14,
            height: panelSize * 0.14,
            background: '#ffffff',
            borderRight: `${Math.max(1, size * 0.007)}px solid rgba(249,115,22,0.32)`,
            borderBottom: `${Math.max(1, size * 0.007)}px solid rgba(249,115,22,0.32)`,
            transform: 'rotate(45deg)',
            boxShadow: '6px 6px 12px rgba(2, 6, 23, 0.06)',
          }}
        />
        {[0, 1, 2].map((index) => (
          <div
            key={`comment-${index}`}
            style={{
              position: 'absolute',
              top: panelSize * (0.31 + index * 0.09),
              left: panelSize * 0.28,
              width: panelSize * (index === 2 ? 0.28 : 0.42),
              height: size * 0.009,
              borderRadius: '9999px',
              background: index === 0 ? '#f97316' : '#94a3b8',
            }}
          />
        ))}
      </div>
    </div>
  )
}
