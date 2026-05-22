export const themes = {
  home: {
    bg:       '#1A1710',
    bg2:      '#221F15',
    bg3:      '#2C2818',
    accent:   '#C8771A',
    accent2:  '#E09030',
    gold:     '#F0B050',
    text:     '#E8D5A3',
    dim:      '#A89060',
    border:   'rgba(200,119,26,0.2)',
    borderS:  'rgba(200,119,26,0.45)',
    triangle: 'rgba(200,119,26,0.1)',
  },
  sinav: {
    bg:       '#111820',
    bg2:      '#182030',
    bg3:      '#1E2838',
    accent:   '#3A7CC8',
    accent2:  '#5090E0',
    gold:     '#80B8F8',
    text:     '#C8DCF0',
    dim:      '#6080A0',
    border:   'rgba(58,124,200,0.2)',
    borderS:  'rgba(58,124,200,0.45)',
    triangle: 'rgba(58,124,200,0.1)',
  },
  flash: {
    bg:       '#101A14',
    bg2:      '#162018',
    bg3:      '#1C2A1E',
    accent:   '#2E8B57',
    accent2:  '#40A868',
    gold:     '#70D090',
    text:     '#B8E0C8',
    dim:      '#508060',
    border:   'rgba(46,139,87,0.2)',
    borderS:  'rgba(46,139,87,0.45)',
    triangle: 'rgba(46,139,87,0.1)',
  },
  sim: {
    bg:       '#181018',
    bg2:      '#201520',
    bg3:      '#281C28',
    accent:   '#8B3AC8',
    accent2:  '#A050E0',
    gold:     '#C880F8',
    text:     '#D8C0F0',
    dim:      '#806090',
    border:   'rgba(139,58,200,0.2)',
    borderS:  'rgba(139,58,200,0.45)',
    triangle: 'rgba(139,58,200,0.1)',
  },
}

export default function AppShell({ theme = 'home', children }) {
  const t = themes[theme]
  return (
    <div
      className="w-full max-w-[390px] flex flex-col relative overflow-hidden mx-auto"
style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}
      style={{ background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Izgara */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px),
            repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)
          `
        }}
      />

      {/* Üçgen motifler */}
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        <polygon points="0,0 0,260 180,0" fill="none" stroke={t.triangle} strokeWidth="1"/>
        <polygon points="0,0 0,200 140,0" fill="none" stroke={t.triangle.replace('0.1','0.06')} strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke={t.triangle} strokeWidth="1"/>
        <polygon points="390,844 390,644 250,844" fill="none" stroke={t.triangle.replace('0.1','0.06')} strokeWidth="1"/>
      </svg>

      {/* Köşe süsler */}
      {['tl','tr','bl','br'].map(pos => (
        <div
          key={pos}
          className="absolute w-5 h-5 pointer-events-none"
          style={{
            top: pos.includes('t') ? 12 : 'auto',
            bottom: pos.includes('b') ? 12 : 'auto',
            left: pos.includes('l') ? 12 : 'auto',
            right: pos.includes('r') ? 12 : 'auto',
            borderColor: t.borderS,
            borderStyle: 'solid',
            borderWidth: pos === 'tl' ? '2px 0 0 2px' : pos === 'tr' ? '2px 2px 0 0' : pos === 'bl' ? '0 0 2px 2px' : '0 2px 2px 0',
            zIndex: 5,
          }}
        />
      ))}

      {children}
    </div>
  )
}
