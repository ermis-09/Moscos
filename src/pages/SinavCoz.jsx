import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMoscosStore } from '../store'
import { themes } from '../components/AppShell'

const t = themes.sinav

export default function SinavCoz() {
  const navigate = useNavigate()
  const aktivSinav = useMoscosStore(s => s.aktivSinav)
  const cevapVer = useMoscosStore(s => s.cevapVer)
  const [aktifIndex, setAktifIndex] = useState(0)

  const { sorular, cevaplar } = aktivSinav

  if (!sorular.length) {
    navigate('/')
    return null
  }

  const soru = sorular[aktifIndex]
  const kullaniciCevap = cevaplar[aktifIndex]
  const sonSoru = aktifIndex === sorular.length - 1
  const harfler = ['A', 'B', 'C', 'D', 'E']
  const progress = ((aktifIndex + 1) / sorular.length) * 100

  const mod = aktivSinav.mod

function cevapla(harf) {
  if (kullaniciCevap) return
  cevapVer(aktifIndex, harf)
}


  function secenekStil(harf) {
  if (!kullaniciCevap) return {
    bg: t.bg2, border: t.border,
    text: t.text, letterBg: t.bg3, letterColor: t.accent
  }
  // Simülasyon modunda sadece seçimi göster, doğruyu değil
  if (mod === 'simulasyon') {
    if (harf === kullaniciCevap) return {
      bg: `${t.accent}20`, border: t.accent,
      text: t.text, letterBg: t.accent, letterColor: '#E8F4FF'
    }
    return {
      bg: t.bg2, border: t.border,
      text: `${t.dim}80`, letterBg: t.bg3, letterColor: `${t.accent}60`
    }
  }
  // Normal mod
  if (harf === soru.dogruCevap) return {
    bg: 'rgba(46,139,87,0.2)', border: '#2E8B57',
    text: '#B8E0C8', letterBg: '#2E8B57', letterColor: 'white'
  }
  if (harf === kullaniciCevap) return {
    bg: 'rgba(139,58,58,0.2)', border: '#8B3A3A',
    text: '#E0B8B8', letterBg: '#8B3A3A', letterColor: 'white'
  }
  return {
    bg: t.bg2, border: t.border,
    text: `${t.dim}80`, letterBg: t.bg3, letterColor: `${t.accent}60`
  }
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
        <button
          onClick={() => { if (confirm('Sınavı bırakmak istediğine emin misin?')) navigate('/') }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}
        >←</button>
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="font-display text-xs font-semibold" style={{ color: t.text }}>
            {aktifIndex + 1} / {sorular.length}
          </span>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: t.accent }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* Soru */}
      <main className="flex-1 px-5 py-4 flex flex-col gap-4 relative z-10 overflow-y-auto pb-24">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: t.accent, color: '#E8F4FF' }}>
            {soru.ders}
          </span>
          {soru.ogrenimHedefi && (
            <span className="text-xs italic" style={{ color: t.dim }}>{soru.ogrenimHedefi}</span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.h2
            key={aktifIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-display text-lg font-medium leading-snug"
            style={{ color: t.text, letterSpacing: '-0.01em' }}
          >
            {soru.soru}
          </motion.h2>
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {harfler.map(harf => {
            const metin = soru.secenekler?.[harf]
            if (!metin) return null
            const s = secenekStil(harf)
            return (
              <motion.button
                key={harf}
                whileTap={{ scale: 0.98 }}
                onClick={() => cevapla(harf)}
                disabled={!!kullaniciCevap}
                className="flex items-start gap-3 w-full rounded-xl px-4 py-3 text-left transition-all"
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-display text-sm font-semibold"
                  style={{ background: s.letterBg, color: s.letterColor }}>
                  {harf}
                </span>
                <span className="flex-1 text-sm leading-relaxed pt-0.5 font-medium" style={{ color: s.text }}>
                  {metin}
                </span>
              </motion.button>
            )
          })}
        </div>

        {kullaniciCevap && soru.aciklama && mod !== 'simulasyon' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-4 py-3 border-l-2"
            style={{ background: t.bg2, borderColor: t.accent }}
          >
            <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: t.accent }}>Açıklama</p>
            <p className="text-sm leading-relaxed" style={{ color: t.dim }}>{soru.aciklama}</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 flex gap-2 px-5 pb-6 pt-3 z-10"
        style={{ background: `linear-gradient(to top, ${t.bg} 70%, transparent)` }}>
        <button
          onClick={() => { if (aktifIndex > 0) setAktifIndex(i => i - 1) }}
          disabled={aktifIndex === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30"
          style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}
        >←</button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { if (sonSoru) navigate('/sinav/sonuc'); else setAktifIndex(i => i + 1) }}
          className="flex-1 h-12 rounded-xl font-display text-sm font-semibold flex items-center justify-between px-4"
          style={{ background: `linear-gradient(135deg, ${t.accent}, #204878)`, color: '#E8F4FF' }}
        >
          {sonSoru ? 'Sınavı Bitir' : 'Sonraki'} <span>{sonSoru ? '✓' : '→'}</span>
        </motion.button>
      </footer>
    </motion.div>
  )
}
