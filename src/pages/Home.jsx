import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useMoscosStore } from '../store'
import { temaAl, bazTemalar } from '../lib/renkler'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'

const MOTIVASYON = [
  "Bilgi, taşıdığın en hafif yüktür.",
  "Her soru, yarının cevabıdır.",
  "Zorlu sorular seni büyütür.",
  "Bugün öğrendiğin, yarın hayat kurtarır.",
  "Tekrar, uzmanlaşmanın temelidir.",
  "Merak et, sorgula, öğren.",
  "Her yanlış cevap seni doğruya yaklaştırır.",
  "Tıp bir maraton, sabırla koş.",
  "Bugünün çalışması yarının güvencesidir.",
  "Küçük adımlar büyük hedeflere ulaştırır.",
  "Anlamak, ezberden üstündür.",
  "Zorluk olmadan gelişme olmaz.",
  "Her gün biraz daha iyi ol.",
  "Bilim sabır ister, sen de sabırlısın.",
]

function gunlukMotivasyonAl() {
  const gun = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return MOTIVASYON[gun % MOTIVASYON.length]
}

function Hamburger({ onClick, dim, accent }) {
  return (
    <button onClick={onClick} className="w-10 h-10 relative flex-shrink-0 cursor-pointer">
      <svg className="absolute inset-0" viewBox="0 0 40 40" fill="none">
        <polygon points="2,2 38,2 2,38" fill={`${accent}08`} stroke={`${accent}50`} strokeWidth="1"/>
        <polygon points="38,2 38,38 2,38" fill={`${accent}04`} stroke={`${accent}25`} strokeWidth="1"/>
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
    { label: 'Ayarlar', sub: 'Tema & görünüm', path: '/ayarlar', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
          {i === 3 && <div className="my-2 h-px" style={{ background: `${t.accent}25` }} />}
          <button
            onClick={() => {
              if (item.external) window.open(item.path, '_blank')
              else if (item.path) { onClose(); navigate(item.path) }
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${t.accent}15`; e.currentTarget.style.borderColor = `${t.accent}35` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
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
        Moscos · v2.1
      </div>
    </motion.div>
  )
}

function Page({ theme, ayarlar, decoNum, children, triangleColor }) {
  const t = temaAl(theme, ayarlar)
  return (
    <div className="flex-shrink-0 flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: t.bg, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
      }} />
      <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <polygon points="0,0 0,260 180,0" fill="none" stroke={triangleColor} strokeWidth="1"/>
        <polygon points="0,0 0,200 140,0" fill="none" stroke={triangleColor.replace('0.1','0.05')} strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke={triangleColor} strokeWidth="1"/>
        <polygon points="390,844 390,644 250,844" fill="none" stroke={triangleColor.replace('0.1','0.05')} strokeWidth="1"/>
      </svg>
      {[
        { style: { top: 12, left: 12, borderWidth: '2px 0 0 2px' } },
        { style: { top: 12, right: 12, borderWidth: '2px 2px 0 0' } },
        { style: { bottom: 12, left: 12, borderWidth: '0 0 2px 2px' } },
        { style: { bottom: 12, right: 12, borderWidth: '0 2px 2px 0' } },
      ].map(({ style }, i) => (
        <div key={i} className="absolute w-5 h-5 pointer-events-none"
          style={{ ...style, borderColor: t.borderS, borderStyle: 'solid', zIndex: 5 }} />
      ))}
      <div className="absolute bottom-4 right-4 font-display font-bold pointer-events-none select-none"
        style={{ fontSize: 100, lineHeight: 1, color: triangleColor.replace('0.1','0.04'), letterSpacing: '-0.05em', zIndex: 0 }}>
        {decoNum}
      </div>
      {children}
    </div>
  )
}

function GunlukKart({ flashcardlar, t }) {
  const [cevrildimi, setCevrildimi] = useState(false)
  if (!flashcardlar.length) return null
  const gun = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const kart = flashcardlar[gun % flashcardlar.length]
  return (
    <div onClick={() => setCevrildimi(f => !f)}
      className="rounded-2xl cursor-pointer relative flex-shrink-0"
      style={{
        height: 140, background: cevrildimi ? t.bg3 : t.bg2,
        border: `1.5px solid ${cevrildimi ? t.accent : t.border}`,
        transition: 'all 0.3s',
        boxShadow: cevrildimi ? `0 0 20px ${t.accent}30` : 'none',
      }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-5 gap-2">
        <span className="text-[9px] font-bold tracking-widest uppercase absolute top-3 left-4"
          style={{ color: cevrildimi ? t.accent2 : t.accent }}>
          {cevrildimi ? 'AÇIKLAMA' : 'GÜNÜN KARTI'}
        </span>
        <p className="font-display text-sm font-medium text-center leading-snug" style={{ color: t.text }}>
          {cevrildimi ? kart.arkaYuz : kart.onYuz}
        </p>
        <span className="text-[9px] italic absolute bottom-3" style={{ color: `${t.dim}80` }}>
          {cevrildimi ? 'tekrar çevir' : 'dokunarak çevir'}
        </span>
      </div>
    </div>
  )
}

function RastgeleSoru({ sorular, t }) {
  const [secilen, setSecilen] = useState(null)
  const [onay, setOnay] = useState(null)
  if (!sorular.length) return null
  const gun = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const soru = sorular[gun % sorular.length]
  const harfler = ['A','B','C','D','E']
  const cevaplandi = secilen !== null
  const dogruMu = secilen === soru.dogruCevap

  return (
    <div className="rounded-2xl flex flex-col flex-1 overflow-y-auto"
      style={{ background: t.bg2, border: `1px solid ${t.border}` }}>

      {/* Başlık */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 border-b"
        style={{ borderColor: t.border }}>
        <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase"
          style={{ color: t.accent }}>Günün Sorusu</span>
        <div className="flex items-center gap-2">
          {cevaplandi && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{
                background: dogruMu ? 'rgba(46,139,87,0.2)' : 'rgba(139,58,58,0.2)',
                color: dogruMu ? '#70D090' : '#E08080',
                border: `1px solid ${dogruMu ? '#2E8B57' : '#8B3A3A'}`,
              }}>
              {dogruMu ? '✓ Doğru' : '✗ Yanlış'}
            </motion.span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: `${t.accent}20`, color: t.accent }}>
            {soru.ders}
          </span>
        </div>
      </div>

      {/* Soru metni */}
      <p className="font-display text-sm font-medium leading-relaxed px-4 pt-3 pb-2 flex-shrink-0"
        style={{ color: t.text }}>
        {soru.soru}
      </p>

      {/* Seçenekler */}
      <div className="flex flex-col gap-1.5 px-4 pb-3 flex-shrink-0">
        {harfler.map(harf => {
          const metin = soru.secenekler?.[harf]
          if (!metin) return null

          const secildi = secilen === harf
          const dogruCevap = harf === soru.dogruCevap
          const yanlisCevap = cevaplandi && secildi && !dogruCevap
          const onayBekliyor = !cevaplandi && onay === harf

          let bg = t.bg3
          let border = t.border
          let textColor = t.dim
          let letterBg = t.bg2
          let letterColor = t.accent

          if (!cevaplandi) {
            if (onayBekliyor) {
              bg = `${t.accent}15`
              border = t.accent
              letterBg = `${t.accent}40`
              letterColor = t.accent2
              textColor = t.text
            }
          } else if (dogruCevap) {
            bg = 'rgba(46,139,87,0.2)'
            border = '#2E8B57'
            textColor = '#B8E0C8'
            letterBg = '#2E8B57'
            letterColor = 'white'
          } else if (yanlisCevap) {
            bg = 'rgba(139,58,58,0.2)'
            border = '#8B3A3A'
            textColor = '#E0B8B8'
            letterBg = '#8B3A3A'
            letterColor = 'white'
          } else {
            textColor = `${t.dim}50`
            letterColor = `${t.accent}40`
          }

          return (
            <motion.button
              key={harf}
              whileTap={!cevaplandi ? { scale: 0.98 } : {}}
              onClick={() => {
                if (cevaplandi) return
                if (onay === harf) return
                setOnay(harf)
              }}
              disabled={cevaplandi}
              className="flex items-start gap-2.5 w-full rounded-xl px-3 py-2.5 text-left transition-all"
              style={{
                background: bg,
                border: `1.5px solid ${border}`,
                boxShadow: dogruCevap && cevaplandi ? '0 0 12px rgba(46,139,87,0.3)' : 'none',
              }}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold"
                style={{ background: letterBg, color: letterColor }}>
                {harf}
              </span>
              <span className="flex-1 text-xs leading-relaxed pt-0.5 font-medium"
                style={{ color: textColor }}>
                {metin}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Onay mesajı */}
      <AnimatePresence>
        {onay && !cevaplandi && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mx-4 mb-2 rounded-xl px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ background: `${t.accent}15`, border: `1.5px solid ${t.accent}40` }}
          >
            <span className="text-xs font-display font-semibold" style={{ color: t.text }}>
              <span style={{ color: t.accent2 }}>{onay}</span> şıkkından emin misin?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOnay(null)}
                className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>
                İptal
              </button>
              <button
                onClick={() => { setSecilen(onay); setOnay(null) }}
                className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                style={{ background: t.accent, color: '#E8F4FF' }}>
                Evet →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Açıklama */}
      <AnimatePresence>
        {cevaplandi && soru.aciklama && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 flex-shrink-0"
          >
            <div className="rounded-xl px-3 py-2.5 border-l-2"
              style={{ background: `${t.accent}10`, borderColor: t.accent }}>
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1"
                style={{ color: t.accent }}>Açıklama</p>
              <p className="text-xs leading-relaxed" style={{ color: t.dim }}>
                {soru.aciklama}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


function SimulasyonArsiv({ cikmislar, t, navigate }) {
  const sinavlar = Object.entries(
    cikmislar.reduce((acc, s) => {
      const key = `${s.yil} · ${s.sinav}`
      if (!acc[key]) acc[key] = { yil: s.yil, sinav: s.sinav, sayi: 0 }
      acc[key].sayi++
      return acc
    }, {})
  ).sort((a, b) => b[1].yil - a[1].yil)

  if (!sinavlar.length) return <p className="text-xs italic" style={{ color: t.dim }}>Henüz çıkmış soru yok.</p>

  return (
    <div className="flex flex-col gap-2">
      {sinavlar.slice(0, 3).map(([key, val]) => (
        <button key={key} onClick={() => navigate('/simulasyon/filtre')}
          className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
          style={{ background: t.bg2, border: `1px solid ${t.border}` }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
          <div>
            <p className="font-display text-sm font-semibold text-left" style={{ color: t.text }}>{key}</p>
            <p className="text-xs mt-0.5" style={{ color: t.dim }}>{val.sayi} soru</p>
          </div>
          <span style={{ color: t.accent }}>→</span>
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef(null)

  const sorularData = useMoscosStore(s => s.sorular)
  const cikmislar = useMoscosStore(s => s.cikmislar)
  const flashcardlar = useMoscosStore(s => s.flashcardlar)
  const kullanici = useMoscosStore(s => s.kullanici)
  const aktivSinav = useMoscosStore(s => s.aktivSinav)
  const yukleniyor = useMoscosStore(s => s.yukleniyor)
  const setAnaSayfaIndex = useMoscosStore(s => s.setAnaSayfaIndex)
  const ayarlar = useMoscosStore(s => s.ayarlar)

  const t0 = temaAl('home', ayarlar)
  const t1 = temaAl('sinav', ayarlar)
  const t2 = temaAl('flash', ayarlar)
  const t3 = temaAl('sim', ayarlar)

  const [sonSinav, setSonSinav] = useState(null)
const aktivSinavYukle = useMoscosStore(s => s.aktivSinavYukle)
const setSecim = useMoscosStore(s => s.setSecim)
const [firebaseDevamVar, setFirebaseDevamVar] = useState(false)

useEffect(() => {
  if (!kullanici) return
  if (sorularData.length === 0 && cikmislar.length === 0) return

  async function aktifSinavYukle_() {
    try {
      const snap = await getDoc(doc(db, 'kullanici_aktif_sinav', kullanici.uid))
      console.log('snap:', snap.exists())
      if (snap.exists()) {
        const veri = snap.data()
        const tumS = veri.mod === 'simulasyon' ? cikmislar : sorularData
        const eslesmis = veri.soruIdleri
          .map(id => tumS.find(s => s.id === id))
          .filter(Boolean)
        console.log('eslesmis:', eslesmis.length)
        if (eslesmis.length > 0) {
          aktivSinavYukle({ ...veri, sorular: eslesmis })
          setFirebaseDevamVar(true)
          if (veri.secim) {
            Object.entries(veri.secim).forEach(([key, val]) => {
              if (val) setSecim(key, val)
            })
          }
        }
      }
    } catch (err) {
      console.error('Firebase hata:', err)
    }
  }
  aktifSinavYukle_()
}, [kullanici, sorularData.length, cikmislar.length])


  const yariKalan = (aktivSinav.sorular.length > 0 && !aktivSinav.tamamlandi) || firebaseDevamVar

  const pages = [
    { theme: 'home', color: t0.triangle },
    { theme: 'sinav', color: t1.triangle },
    { theme: 'flash', color: t2.triangle },
    { theme: 'sim', color: t3.triangle },
  ]

  useEffect(() => {
    const idx = parseInt(sessionStorage.getItem('anaIndex') || '0')
    if (idx > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: idx * window.innerHeight, behavior: 'instant' })
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight)
      setCurrentPage(idx)
      setAnaSayfaIndex(idx)
      sessionStorage.setItem('anaIndex', idx)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const currentThemeObj = [t0, t1, t2, t3][currentPage]
  const motivasyon = gunlukMotivasyonAl()

  const sonSinavLabel = sonSinav
    ? sonSinav.mod === 'simulasyon'
      ? `${sonSinav.yil} · ${sonSinav.sinav}`
      : `D${sonSinav.donem} · ${sonSinav.kurulId}${sonSinav.ders ? ' · ' + sonSinav.ders : ''}`
    : null

  return (
    <div className="w-full max-w-[390px] mx-auto relative overflow-hidden" style={{ height: '100dvh' }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navigate={navigate} theme={currentThemeObj} />

      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-3 z-20">
        <Hamburger onClick={() => setDrawerOpen(true)} dim={currentThemeObj.dim} accent={currentThemeObj.accent} />
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
          <span className="font-display text-xl font-bold leading-none tracking-tight transition-colors duration-500" style={{ color: currentThemeObj.text }}>
            M<span style={{ color: currentThemeObj.accent2 }}>os</span>cos
          </span>
          <span className="text-[8px] font-bold tracking-[0.24em] uppercase transition-colors duration-500" style={{ color: currentThemeObj.dim }}>Soru Bankası</span>
        </div>
        <span className="text-[10px] font-display font-semibold tracking-widest uppercase transition-colors duration-500" style={{ color: currentThemeObj.accent }}>
          {['Ana','Sınav','Flash','Sim.'][currentPage]}
        </span>
      </header>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {pages.map((_, i) => (
          <div key={i}
            onClick={() => scrollRef.current?.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' })}
            className="cursor-pointer rounded-full transition-all duration-300"
            style={{ width: 4, height: i === currentPage ? 16 : 4, background: i === currentPage ? currentThemeObj.accent : 'rgba(255,255,255,0.2)' }}
          />
        ))}
      </div>

      <div ref={scrollRef} id="anaScroll" className="w-full h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}>

        {/* ANA SAYFA */}
        <Page theme="home" ayarlar={ayarlar} decoNum="01" triangleColor={t0.triangle}>
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 overflow-hidden">
            <div className="rounded-2xl px-4 py-3 flex items-start gap-3 flex-shrink-0"
              style={{ background: t0.bg2, border: `1px solid ${t0.border}` }}>
              <span style={{ color: t0.accent, fontSize: 18, flexShrink: 0 }}>✦</span>
              <p className="font-display text-sm italic leading-relaxed" style={{ color: t0.text }}>"{motivasyon}"</p>
            </div>

            <div className="rounded-2xl p-4 flex flex-col gap-3 flex-shrink-0"
              style={{ background: t0.bg2, border: `1px solid ${t0.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: '#A87840' }}>
                Genel Durum
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  [yukleniyor ? '...' : sorularData.length, 'Soru'],
                  [yukleniyor ? '...' : cikmislar.length, 'Çıkmış'],
                  [yukleniyor ? '...' : flashcardlar.length, 'Kart'],
                ].map(([num, label]) => (
                  <div key={label} className="text-center">
                    <div className="font-display text-3xl font-semibold leading-none" style={{ color: t0.text }}>{num}</div>
                    <div className="text-[9px] font-bold tracking-[0.14em] uppercase mt-1" style={{ color: t0.dim }}>{label}</div>
                  </div>
                ))}
              </div>
              {sonSinavLabel && (
                <>
                  <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t0.border}, transparent)` }} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: t0.dim }}>{sonSinavLabel}</span>
                    <span className="font-display text-lg font-semibold" style={{ color: t0.accent2 }}>%{sonSinav.yuzde}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2.5 mt-auto">
              {yariKalan && (
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/sinav/coz')}
                  className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                  style={{
                    background: aktivSinav.mod === 'simulasyon'
                      ? `linear-gradient(135deg, ${t3.accent}, #501878)`
                      : `linear-gradient(135deg, ${t1.accent}, #204878)`,
                    color: '#E8F4FF', boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                  }}>
                  Devam Et — {aktivSinav.aktifIndex + 1}/{aktivSinav.sorular.length} <span>→</span>
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${t0.accent}, #8B5020)`, color: '#FAF0D0', boxShadow: '0 6px 20px rgba(200,119,26,0.3)' }}>
                Sınav Modları <span>↓</span>
              </motion.button>
            </div>
          </main>
        </Page>

        {/* SINAV SAYFASI */}
        <Page theme="sinav" ayarlar={ayarlar} decoNum="02" triangleColor={t1.triangle}>
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 overflow-hidden">
            <div className="flex-shrink-0">
              <h1 className="font-display text-3xl font-bold leading-tight mb-1" style={{ color: t1.text, letterSpacing: '-0.025em' }}>Sınav Modu</h1>
              <p className="text-xs leading-relaxed" style={{ color: t1.dim }}>Anında geri bildirim ve açıklamalarla çalış.</p>
            </div>
            <RastgeleSoru sorular={sorularData} t={t1} />
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/sinav/filtre')}
              className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${t1.accent}, #204878)`, color: '#E8F4FF', boxShadow: '0 6px 20px rgba(58,124,200,0.3)' }}>
              Sınava Başla <span>→</span>
            </motion.button>
          </main>
        </Page>

        {/* FLASHCARD SAYFASI */}
        <Page theme="flash" ayarlar={ayarlar} decoNum="03" triangleColor={t2.triangle}>
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 overflow-hidden">
            <div className="flex-shrink-0">
              <h1 className="font-display text-3xl font-bold leading-tight mb-1" style={{ color: t2.text, letterSpacing: '-0.025em' }}>Flashcard</h1>
              <p className="text-xs leading-relaxed" style={{ color: t2.dim }}>Kavramları kart çevirerek çalış.</p>
            </div>
            <GunlukKart flashcardlar={flashcardlar} t={t2} />
            <div className="rounded-2xl p-4 flex flex-col gap-2 flex-shrink-0"
              style={{ background: t2.bg2, border: `1px solid ${t2.border}` }}>
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t2.accent }}>Kart Havuzu</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  [yukleniyor ? '...' : flashcardlar.length, 'Toplam Kart'],
                  [yukleniyor ? '...' : new Set(flashcardlar.map(f => f.ders)).size, 'Ders'],
                ].map(([num, label]) => (
                  <div key={label} className="text-center py-2 rounded-xl" style={{ background: t2.bg3 }}>
                    <div className="font-display text-2xl font-semibold leading-none" style={{ color: t2.text }}>{num}</div>
                    <div className="text-[9px] font-bold tracking-[0.14em] uppercase mt-1" style={{ color: t2.dim }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/flashcard/filtre')}
              className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between flex-shrink-0 mt-auto"
              style={{ background: `linear-gradient(135deg, ${t2.accent}, #1A5030)`, color: '#E8FFF0', boxShadow: '0 6px 20px rgba(46,139,87,0.3)' }}>
              Çalışmaya Başla <span>→</span>
            </motion.button>
          </main>
        </Page>

        {/* SİMÜLASYON SAYFASI */}
        <Page theme="sim" ayarlar={ayarlar} decoNum="04" triangleColor={t3.triangle}>
          <main className="flex-1 px-5 pb-6 flex flex-col gap-3 relative z-10 mt-20 overflow-hidden">
            <div className="flex-shrink-0">
              <h1 className="font-display text-3xl font-bold leading-tight mb-1" style={{ color: t3.text, letterSpacing: '-0.025em' }}>Simülasyon</h1>
              <p className="text-xs leading-relaxed" style={{ color: t3.dim }}>Gerçek sınav hissiyle çıkmış soruları çöz.</p>
            </div>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase flex-shrink-0" style={{ color: t3.accent }}>Arşiv</span>
              <SimulasyonArsiv cikmislar={cikmislar} t={t3} navigate={navigate} />
            </div>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/simulasyon/filtre')}
              className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${t3.accent}, #501878)`, color: '#F8E8FF', boxShadow: '0 6px 20px rgba(139,58,200,0.3)' }}>
              Simülasyona Başla <span>→</span>
            </motion.button>
          </main>
        </Page>

      </div>
    </div>
  )
}
