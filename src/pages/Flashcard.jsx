import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'


function karistir(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcard() {
  const ayarlar = useMoscosStore(s => s.ayarlar)
const t = temaAl('flash', ayarlar)
  const navigate = useNavigate()
  const location = useLocation()
  const { donem, kurulId, ders } = location.state || {}
  const flashcardlar = useMoscosStore(s => s.flashcardlar)

  const kartlar = karistir(flashcardlar.filter(f => {
    if (f.donem !== donem) return false
    if (f.kurulId !== kurulId) return false
    if (ders && f.ders !== ders) return false
    return true
  }))

  const [index, setIndex] = useState(0)
  const [cevrildimi, setCevrildimi] = useState(false)
  const [stats, setStats] = useState({ kolay: 0, zor: 0, atla: 0 })
  const [bitti, setBitti] = useState(false)
  const [swipeDir, setSwipeDir] = useState(null)

  const startX = useRef(0)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const cardRef = useRef(null)

  if (!kartlar.length) {
    return (
      <div className="w-full max-w-[390px] mx-auto flex flex-col items-center justify-center gap-4"
        style={{ height: '100dvh', background: t.bg, color: t.dim }}>
        <p className="font-display text-lg">Bu seçimde kart yok.</p>
        <button onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl font-display text-sm font-semibold"
          style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>
          Geri Dön
        </button>
      </div>
    )
  }

  const kart = kartlar[index]
  const progress = ((index + 1) / kartlar.length) * 100

  function swipeYap(yon) {
    setStats(s => ({ ...s, [yon]: s[yon] + 1 }))
    setSwipeDir(yon)
    setTimeout(() => {
      setSwipeDir(null)
      setCevrildimi(false)
      if (index + 1 >= kartlar.length) setBitti(true)
      else setIndex(i => i + 1)
    }, 350)
  }

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isDragging.current = false
  }

  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (!isDragging.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isDragging.current = true
    }
    if (!isDragging.current || !cardRef.current) return

    const rotate = dx * 0.06
    cardRef.current.style.transform = `translateX(${dx}px) translateY(${dy * 0.2}px) rotate(${rotate}deg)`

    if (Math.abs(dy) > Math.abs(dx) && dy < -30) {
      cardRef.current.style.borderColor = '#6080C4'
    } else if (dx > 40) {
      cardRef.current.style.borderColor = '#2E8B57'
    } else if (dx < -40) {
      cardRef.current.style.borderColor = '#8B3A3A'
    } else {
      cardRef.current.style.borderColor = t.border
    }
  }

  function onTouchEnd(e) {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current

    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.borderColor = t.border
    }

    if (Math.abs(dy) > Math.abs(dx) && dy < -80) swipeYap('atla')
    else if (dx > 80) swipeYap('kolay')
    else if (dx < -80) swipeYap('zor')
  }

  const swipeColor = swipeDir === 'kolay' ? '#2E8B57' : swipeDir === 'zor' ? '#8B3A3A' : swipeDir === 'atla' ? '#6080C4' : null

  if (bitti) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[390px] mx-auto flex flex-col items-center justify-center gap-6 px-6"
        style={{ height: '100dvh', background: t.bg, color: t.text }}
      >
        <div className="font-display text-5xl font-bold" style={{ color: t.accent2 }}>✦</div>
        <h2 className="font-display text-3xl font-bold" style={{ color: t.text, letterSpacing: '-0.02em' }}>Tamamlandı!</h2>
        <p className="text-sm" style={{ color: t.dim }}>{kartlar.length} kart çalışıldı</p>

        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { num: stats.kolay, label: 'Kolay', color: '#70D090' },
            { num: stats.atla, label: 'Atla', color: '#6080C4' },
            { num: stats.zor, label: 'Zor', color: '#E08080' },
          ].map(({ num, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 py-4 rounded-2xl"
              style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
              <span className="font-display text-3xl font-bold leading-none" style={{ color }}>{num}</span>
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-2">
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={() => { setIndex(0); setCevrildimi(false); setStats({ kolay: 0, zor: 0, atla: 0 }); setBitti(false) }}
            className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${t.accent}, #1A5030)`, color: '#E8FFF0' }}>
            Tekrar Çalış
          </motion.button>
          <button onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
            style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>
            Ana Sayfa
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full max-w-[390px] mx-auto flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: t.bg, color: t.text }}
    >
      {/* Izgara */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
      }} />

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 relative z-10 border-b"
        style={{ borderColor: t.border }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}
        >←</button>
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold" style={{ color: t.text }}>
            {index + 1} / {kartlar.length}
          </span>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
            <motion.div className="h-full rounded-full" style={{ background: t.accent }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </header>

      {/* Kart alanı */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-4 relative z-10">

        {/* Deste arka kartları */}
        <div className="relative w-full" style={{ maxWidth: 320 }}>
          <div className="absolute inset-0 rounded-2xl" style={{
            background: t.bg2, border: `1px solid ${t.border}`,
            transform: 'rotate(-3deg) translateY(8px)', opacity: 0.4
          }} />
          <div className="absolute inset-0 rounded-2xl" style={{
            background: t.bg2, border: `1px solid ${t.border}`,
            transform: 'rotate(2deg) translateY(5px)', opacity: 0.6
          }} />

          {/* Ana kart */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              ref={cardRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{
                scale: 1, opacity: 1,
                x: swipeDir === 'kolay' ? 400 : swipeDir === 'zor' ? -400 : 0,
                y: swipeDir === 'atla' ? -400 : 0,
                rotate: swipeDir === 'kolay' ? 20 : swipeDir === 'zor' ? -20 : 0,
              }}
              transition={{ duration: swipeDir ? 0.35 : 0.3 }}
              onClick={() => { if (!isDragging.current) setCevrildimi(f => !f) }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="relative w-full rounded-2xl cursor-pointer select-none"
              style={{
                height: 340,
                background: swipeColor ? `${swipeColor}15` : t.bg2,
                border: `1.5px solid ${swipeColor || t.border}`,
                boxShadow: swipeColor
                  ? `0 0 30px ${swipeColor}30`
                  : '0 20px 60px rgba(0,0,0,0.4)',
                perspective: 1200,
                transition: swipeDir ? 'all 0.35s ease' : 'border-color 0.2s, background 0.2s',
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                  transform: cevrildimi ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Ön yüz */}
                <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-7 gap-4"
                  style={{ backfaceVisibility: 'hidden' }}>
                  <span className="absolute top-4 left-5 text-[9px] font-bold tracking-widest uppercase"
                    style={{ color: t.accent }}>KAVRAM</span>
                  <p className="font-display text-xl font-semibold text-center leading-snug"
                    style={{ color: t.text, letterSpacing: '-0.01em' }}>
                    {kart.onYuz}
                  </p>
                  <span className="absolute bottom-4 text-[10px] italic" style={{ color: `${t.dim}60` }}>
                    dokunarak çevir
                  </span>
                </div>

                {/* Arka yüz */}
                <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-7 gap-4"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: t.bg3,
                    border: `1.5px solid ${t.accent}`,
                  }}>
                  <span className="absolute top-4 left-5 text-[9px] font-bold tracking-widest uppercase"
                    style={{ color: t.accent2 }}>AÇIKLAMA</span>
                  <p className="font-display text-base font-medium text-center leading-relaxed"
                    style={{ color: t.text }}>
                    {kart.arkaYuz}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe ipuçları */}
        {cevrildimi && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-6"
          >
            <span className="text-xs font-bold font-display" style={{ color: '#E08080' }}>← Zor</span>
            <span className="text-xs font-bold font-display" style={{ color: '#6080C4' }}>↑ Atla</span>
            <span className="text-xs font-bold font-display" style={{ color: '#70D090' }}>Kolay →</span>
          </motion.div>
        )}
      </main>

      {/* Footer stats */}
      <footer className="flex justify-center gap-5 px-5 pb-6 flex-shrink-0 relative z-10">
        <span className="font-display text-sm font-semibold" style={{ color: '#70D090' }}>{stats.kolay} Kolay</span>
        <span className="font-display text-sm font-semibold" style={{ color: '#6080C4' }}>{stats.atla} Atla</span>
        <span className="font-display text-sm font-semibold" style={{ color: '#E08080' }}>{stats.zor} Zor</span>
      </footer>
    </motion.div>
  )
}
