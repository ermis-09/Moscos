import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import AppShell, { themes } from '../components/AppShell'
import { useMoscosStore } from '../store'

const t0 = themes.home
const t1 = themes.sinav
const t2 = themes.flash
const t3 = themes.sim

function Hamburger({ onClick, dim, accent }) {
  return (
    <button onClick={onClick} className="w-10 h-10 relative flex-shrink-0 cursor-pointer">
      <svg className="absolute inset-0" viewBox="0 0 40 40" fill="none">
        <polygon points="2,2 38,2 2,38" 
          fill={`${accent}10`} 
          stroke={`${accent}50`} 
          strokeWidth="1"/>
        <polygon points="38,2 38,38 2,38" 
          fill={`${accent}05`} 
          stroke={`${accent}25`} 
          strokeWidth="1"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5px]">
        {[0,1,2].map(i => (
          <div key={i} className="w-4 h-[1.5px] rounded-full transition-colors duration-500" style={{ background: dim }} />
        ))}
      </div>
    </button>
  )
}

function Drawer({ open, onClose, navigate, theme: t }) {
  const items = [
    { label: 'Profil', sub: 'İstatistikler & geçmiş', path: '/profil', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="8" r="5"/><path d="M3 21c0-5 4-9 9-9s9 4 9 9"/>
      </svg>
    )},
    { label: 'Admin Paneli', sub: 'Soru yönetimi', path: '/admin', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
      </svg>
    )},
    { label: 'GitHub', sub: 'Kaynak kod', path: 'https://github.com/ermis-09/Moscos', external: true, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>
    )},
    { label: 'Hakkımda', sub: 'Moscos nedir?', path: null, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )},
  ]

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: open ? 0 : '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 w-full max-w-[390px] z-50 flex flex-col px-8 py-14 gap-2"
      style={{ height: '100dvh', background: 'rgba(13,11,8,0.97)', backdropFilter: 'blur(8px)' }}
    >
      <button onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-sm"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
      >✕</button>

      <div className="font-display text-2xl font-bold mb-6" style={{ color: t.text, letterSpacing: '-0.025em' }}>
        M<span style={{ color: t.accent2 }}>os</span>cos
      </div>

      {items.map((item, i) => (
        <div key={i}>
          {i === 2 && <div className="my-2 h-px" style={{ background: `${t.accent}25` }} />}
          <button
            onClick={() => {
              if (item.external) window.open(item.path, '_blank')
              else if (item.path) { onClose(); navigate(item.path) }
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${t.accent}15`
              e.currentTarget.style.borderColor = `${t.accent}35`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${t.accent}18`, border: `1px solid ${t.accent}35` }}>
              {item.icon}
            </div>
            <div>
              <div className="font-display font-semibold text-base" style={{ color: t.text }}>{item.label}</div>
              <div className="text-xs mt-0.5" style={{ color: t.dim }}>{item.sub}</div>
            </div>
          </button>
        </div>
      ))}

      <div className="mt-auto text-center text-xs font-display tracking-widest" style={{ color: `${t.accent}50` }}>
        Moscos · v2.0
      </div>
    </motion.div>
  )
}

// Tek sayfa bileşeni
function Page({ theme, tag, decoNum, children, triangleColor }) {
  const t = themes[theme]
  return (
    <div
      className="flex-shrink-0 flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: t.bg, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
      {/* Izgara */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
      }} />

      {/* Üçgenler */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <polygon points="0,0 0,260 180,0" fill="none" stroke={triangleColor} strokeWidth="1"/>
        <polygon points="0,0 0,200 140,0" fill="none" stroke={triangleColor.replace('0.1','0.05')} strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke={triangleColor} strokeWidth="1"/>
        <polygon points="390,844 390,644 250,844" fill="none" stroke={triangleColor.replace('0.1','0.05')} strokeWidth="1"/>
      </svg>

      {/* Köşe süsler */}
      {[
        { pos: 'tl', style: { top: 12, left: 12, borderWidth: '2px 0 0 2px' } },
        { pos: 'tr', style: { top: 12, right: 12, borderWidth: '2px 2px 0 0' } },
        { pos: 'bl', style: { bottom: 12, left: 12, borderWidth: '0 0 2px 2px' } },
        { pos: 'br', style: { bottom: 12, right: 12, borderWidth: '0 2px 2px 0' } },
      ].map(({ pos, style }) => (
        <div key={pos} className="absolute w-5 h-5 pointer-events-none" style={{ ...style, borderColor: t.borderS, borderStyle: 'solid', zIndex: 5 }} />
      ))}

      {/* Dekoratif sayı */}
      <div className="absolute bottom-4 right-4 font-display font-bold pointer-events-none select-none"
        style={{ fontSize: 100, lineHeight: 1, color: triangleColor.replace('0.1','0.04'), letterSpacing: '-0.05em', zIndex: 0 }}>
        {decoNum}
      </div>

      {children}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const sorular = useMoscosStore(s => s.sorular)
const cikmislar = useMoscosStore(s => s.cikmislar)
const yukleniyor = useMoscosStore(s => s.yukleniyor)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef(null)

  const pages = [
    { theme: 'home', color: 'rgba(200,119,26,0.1)' },
    { theme: 'sinav', color: 'rgba(58,124,200,0.1)' },
    { theme: 'flash', color: 'rgba(46,139,87,0.1)' },
    { theme: 'sim', color: 'rgba(139,58,200,0.1)' },
  ]

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight)
      setCurrentPage(idx)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const currentTheme = themes[pages[currentPage].theme]

  return (
    <div className="w-full max-w-[390px] mx-auto relative overflow-hidden" style={{ height: '100dvh' }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} theme={currentTheme} />

      {/* Sabit header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-3 z-20">
        <Hamburger onClick={() => setDrawerOpen(true)} dim={currentTheme.dim} />
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <span className="font-display text-xl font-bold leading-none tracking-tight transition-colors duration-500" style={{ color: currentTheme.text }}>
            M<span style={{ color: currentTheme.accent2 }}>os</span>cos
          </span>
          <span className="text-[8px] font-bold tracking-[0.24em] uppercase transition-colors duration-500" style={{ color: currentTheme.dim }}>Soru Bankası</span>
        </div>
        <span className="text-[10px] font-display font-semibold tracking-widest uppercase transition-colors duration-500" style={{ color: currentTheme.accent }}>
          {['Ana','Sınav','Flash','Sim.'][currentPage]}
        </span>
      </header>

      {/* Sayfa göstergesi */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {pages.map((_, i) => (
          <div
            key={i}
            onClick={() => scrollRef.current?.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' })}
            className="cursor-pointer rounded-full transition-all duration-300"
            style={{
              width: 4,
              height: i === currentPage ? 16 : 4,
              background: i === currentPage ? currentTheme.accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
      >

        {/* ANA SAYFA */}
        <Page theme="home" decoNum="01" triangleColor="rgba(200,119,26,0.1)">
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 min-h-0">
            <div className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: t0.bg2, border: `1px solid ${t0.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#A87840' }}>
                Bu Haftaki Durum
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
  [yukleniyor ? '...' : sorular.length, 'Soru'],
  [yukleniyor ? '...' : cikmislar.length, 'Çıkmış'],
  ['%74', 'Ort.']
].map(([num, label]) => (
                  <div key={label} className="text-center">
                    <div className="font-display text-3xl font-semibold leading-none" style={{ color: t0.text }}>{num}</div>
                    <div className="text-[9px] font-bold tracking-[0.14em] uppercase mt-1" style={{ color: t0.dim }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t0.border}, transparent)` }} />
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: t0.dim }}>Son sınav · D2K5</span>
                <span className="font-display text-lg font-semibold" style={{ color: t0.accent2 }}>%81</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-auto">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t0.accent}, #8B5020)`, color: '#FAF0D0', boxShadow: '0 6px 20px rgba(200,119,26,0.3)' }}>
                Sınava Git <span>↓</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profil')}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: t0.bg2, border: `1px solid ${t0.border}`, color: t0.text }}>
                Profil & İstatistikler <span>→</span>
              </motion.button>
            </div>
          </main>
        </Page>

        {/* SINAV SAYFASI */}
        <Page theme="sinav" decoNum="02" triangleColor="rgba(58,124,200,0.1)">
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 min-h-0">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight mb-1.5" style={{ color: t1.text, letterSpacing: '-0.025em' }}>Sınav Modu</h1>
              <p className="text-xs leading-relaxed" style={{ color: t1.dim }}>Dönem, kurul ve ders bazında sorularla kendini test et.</p>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-2.5"
              style={{ background: t1.bg2, border: `1px solid ${t1.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t1.accent }}>Son Sınavlar</span>
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t1.border}, transparent)` }} />
              {[['D2K5 · Anatomi','%81'],['D2K5 · Fizyoloji','%68']].map(([l,s]) => (
                <div key={l} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: t1.dim }}>{l}</span>
                  <span className="font-display text-base font-semibold" style={{ color: t1.accent2 }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/sinav/filtre')}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t1.accent}, #204878)`, color: '#E8F4FF', boxShadow: '0 6px 20px rgba(58,124,200,0.3)' }}>
                Sınava Başla <span>→</span>
              </motion.button>
            </div>
          </main>
        </Page>

        {/* FLASHCARD SAYFASI */}
        <Page theme="flash" decoNum="03" triangleColor="rgba(46,139,87,0.1)">
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 min-h-0">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight mb-1.5" style={{ color: t2.text, letterSpacing: '-0.025em' }}>Flashcard</h1>
              <p className="text-xs leading-relaxed" style={{ color: t2.dim }}>Kavramları kart çevirerek çalış. Kolay, orta, zor değerlendirmeleriyle öğrenimini takip et.</p>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-2.5"
              style={{ background: t2.bg2, border: `1px solid ${t2.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t2.accent }}>Çalışılacak Kartlar</span>
              <div className="grid grid-cols-3 gap-2">
                {[['48','Kart'],['12','Zor'],['%75','Bilinen']].map(([num,label]) => (
                  <div key={label} className="text-center">
                    <div className="font-display text-2xl font-semibold leading-none" style={{ color: t2.text }}>{num}</div>
                    <div className="text-[9px] font-bold tracking-[0.14em] uppercase mt-1" style={{ color: t2.dim }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/flashcard/filtre')}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t2.accent}, #1A5030)`, color: '#E8FFF0', boxShadow: '0 6px 20px rgba(46,139,87,0.3)' }}>
                Çalışmaya Başla <span>→</span>
              </motion.button>
            </div>
          </main>
        </Page>

        {/* SİMÜLASYON SAYFASI */}
        <Page theme="sim" decoNum="04" triangleColor="rgba(139,58,200,0.1)">
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 min-h-0">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight mb-1.5" style={{ color: t3.text, letterSpacing: '-0.025em' }}>Simülasyon</h1>
              <p className="text-xs leading-relaxed" style={{ color: t3.dim }}>Gerçek sınav hissiyle çıkmış soruları çöz. Cevaplar sınav sonunda açıklanır.</p>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-2.5"
              style={{ background: t3.bg2, border: `1px solid ${t3.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t3.accent }}>Son Simülasyon</span>
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t3.border}, transparent)` }} />
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: t3.dim }}>2025 · Kurul 5</span>
                <span className="font-display text-base font-semibold" style={{ color: t3.accent2 }}>%72</span>
              </div>
            </div>
            <div className="mt-auto">
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/simulasyon/filtre')}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t3.accent}, #501878)`, color: '#F8E8FF', boxShadow: '0 6px 20px rgba(139,58,200,0.3)' }}>
                Simülasyona Başla <span>→</span>
              </motion.button>
            </div>
          </main>
        </Page>

      </div>
    </div>
  )
}
