import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'


export default function SimFiltre() {
  const ayarlar = useMoscosStore(s => s.ayarlar)
const t = temaAl('sim', ayarlar)
  const navigate = useNavigate()
  const cikmislar = useMoscosStore(s => s.cikmislar)
  const setSecim = useMoscosStore(s => s.setSecim)
  const sinavBaslat = useMoscosStore(s => s.sinavBaslat)
  const anaSayfaIndex = useMoscosStore(s => s.anaSayfaIndex)

  const [donem, setDonem] = useState(null)
const [yil, setYil] = useState(null)
const [sinav, setSinav] = useState(null)

const kurullarData = useMoscosStore(s => s.kurullarData)

const donemler = kurullarData?.donemler.filter(d =>
  cikmislar.some(s => s.donem === d.id)
) || []

const yillar = donem
  ? [...new Set(cikmislar.filter(s => s.donem === donem).map(s => s.yil))].sort((a, b) => b - a)
  : []

const sinavlar = yil
  ? [...new Set(cikmislar.filter(s => s.donem === donem && s.yil === yil).map(s => s.sinav))]
  : []

const sayi = (yil && sinav)
  ? cikmislar.filter(s => s.donem === donem && s.yil === yil && s.sinav === sinav).length
  : 0


  function basla() {
  const uygun = cikmislar
    .filter(s => s.donem === donem && s.yil === yil && s.sinav === sinav)
    .sort((a, b) => (a.sira || 0) - (b.sira || 0))
  setSecim('yil', yil)
  setSecim('sinav', sinav)
  sinavBaslat(uygun, 'simulasyon')
  navigate('/sinav/coz')
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

      {/* Üçgenler */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(139,58,200,0.1)" strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(139,58,200,0.1)" strokeWidth="1"/>
      </svg>

      {/* Köşe süsler */}
      {[
        { style: { top: 12, left: 12, borderWidth: '2px 0 0 2px' } },
        { style: { top: 12, right: 12, borderWidth: '2px 2px 0 0' } },
        { style: { bottom: 12, left: 12, borderWidth: '0 0 2px 2px' } },
        { style: { bottom: 12, right: 12, borderWidth: '0 2px 2px 0' } },
      ].map(({ style }, i) => (
        <div key={i} className="absolute w-5 h-5 pointer-events-none"
          style={{ ...style, borderColor: t.borderS, borderStyle: 'solid', zIndex: 5 }} />
      ))}

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
  <button
    onClick={() => {
  sessionStorage.setItem('anaIndex', anaSayfaIndex)
  navigate('/')
}}

    className="w-9 h-9 rounded-full flex items-center justify-center"
    style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}
  >←</button>
  <span className="font-display text-base font-semibold" style={{ color: t.text }}>Simülasyon</span>
  <div className="w-9" />
</header>


      {/* İçerik */}
      <main className="flex-1 px-5 pb-6 flex flex-col gap-5 relative z-10 overflow-y-auto">
{/* Dönem */}
<div className="flex flex-col gap-3">
  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
    Dönem
  </span>
  <div className="flex gap-2 flex-wrap">
    {donemler.map(d => (
      <button key={d.id}
        onClick={() => { setDonem(d.id); setYil(null); setSinav(null) }}
        className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
        style={{
          background: donem === d.id ? t.accent : t.bg2,
          color: donem === d.id ? '#F8E8FF' : t.dim,
          border: `1px solid ${donem === d.id ? t.accent2 : t.border}`,
          boxShadow: donem === d.id ? `0 4px 12px ${t.accent}40` : 'none'
        }}
      >{d.ad}</button>
    ))}
  </div>
</div>

{/* Yıl — sadece dönem seçilince */}
{donem && (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
    <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
      Yıl
    </span>
    <div className="flex gap-2 flex-wrap">
      {yillar.map(y => (
        <button key={y}
          onClick={() => { setYil(y); setSinav(null) }}
          className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
          style={{
            background: yil === y ? t.accent : t.bg2,
            color: yil === y ? '#F8E8FF' : t.dim,
            border: `1px solid ${yil === y ? t.accent2 : t.border}`,
            boxShadow: yil === y ? `0 4px 12px ${t.accent}40` : 'none'
          }}
        >{y}</button>
      ))}
    </div>
  </motion.div>
)}

{/* Sınav */}
{yil && (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
    <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
      Sınav
    </span>
    <div className="flex gap-2 flex-wrap">
      {sinavlar.map(s => (
        <button key={s}
          onClick={() => setSinav(s)}
          className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
          style={{
            background: sinav === s ? t.accent : t.bg2,
            color: sinav === s ? '#F8E8FF' : t.dim,
            border: `1px solid ${sinav === s ? t.accent2 : t.border}`,
            boxShadow: sinav === s ? `0 4px 12px ${t.accent}40` : 'none'
          }}
        >{s}</button>
      ))}
    </div>
  </motion.div>
)}

{/* Başla */}
{sinav && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-auto">
    <p className="text-center text-sm mb-4 font-display" style={{ color: t.dim }}>
      {sayi} soru · Cevaplar sınav sonunda gösterilir
    </p>
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={basla}
      disabled={sayi === 0}
      className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between disabled:opacity-40"
      style={{
        background: `linear-gradient(135deg, ${t.accent}, #501878)`,
        color: '#F8E8FF',
        boxShadow: `0 6px 20px ${t.accent}40`
      }}
    >
      Simülasyona Başla <span>→</span>
    </motion.button>
  </motion.div>
)}

      </main>
    </motion.div>
  )
}
