import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMoscosStore } from '../store'
import { temaAl, renkSecenekleri } from '../lib/renkler'
import { db } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

const BUTON_BOYUTLARI = [
  { id: 'kucuk', label: 'Küçük', px: 'px-3 py-2', text: 'text-xs' },
  { id: 'orta', label: 'Orta', px: 'px-4 py-2.5', text: 'text-sm' },
  { id: 'buyuk', label: 'Büyük', px: 'px-5 py-3', text: 'text-base' },
]

const YAZI_BOYUTLARI = [
  { id: 'kucuk', label: 'Küçük', size: 'text-xs' },
  { id: 'normal', label: 'Normal', size: 'text-sm' },
  { id: 'buyuk', label: 'Büyük', size: 'text-base' },
]

const RENK_GRUPLARI = [
  {
    key: 'sinavRenk',
    theme: 'sinav',
    label: 'Sınav',
    secenekler: [
      { id: 'mavi', label: 'Mavi', renk: '#3A7CC8' },
      { id: 'kirmizi', label: 'Kırmızı', renk: '#C83A3A' },
      { id: 'turkuaz', label: 'Turkuaz', renk: '#2A9B9B' },
    ]
  },
  {
    key: 'flashRenk',
    theme: 'flash',
    label: 'Flashcard',
    secenekler: [
      { id: 'yesil', label: 'Yeşil', renk: '#2E8B57' },
      { id: 'pembe', label: 'Pembe', renk: '#C83A8B' },
      { id: 'sari', label: 'Sarı', renk: '#B89020' },
    ]
  },
  {
    key: 'simRenk',
    theme: 'sim',
    label: 'Simülasyon',
    secenekler: [
      { id: 'mor', label: 'Mor', renk: '#8B3AC8' },
      { id: 'turuncu', label: 'Turuncu', renk: '#C86020' },
      { id: 'gri', label: 'Gri', renk: '#7A8A9A' },
    ]
  },
]

function OnizlemeKart({ theme, ayarlar }) {
  const t = temaAl(theme, ayarlar)
  return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: t.bg, border: `1.5px solid ${t.border}`, width: 120, height: 80 }}>
      <div className="h-full flex flex-col justify-between p-3">
        <div className="flex gap-1">
          <div className="h-1.5 rounded-full flex-1" style={{ background: t.accent }} />
          <div className="h-1.5 rounded-full" style={{ background: t.border, width: 24 }} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-1 rounded-full" style={{ background: `${t.accent}40`, width: '70%' }} />
          <div className="h-1 rounded-full" style={{ background: `${t.accent}25`, width: '50%' }} />
        </div>
        <div className="flex gap-1">
          <div className="rounded-lg flex items-center justify-center"
            style={{ background: t.accent, width: 28, height: 14 }}>
            <div className="h-0.5 rounded-full w-3" style={{ background: t.bg }} />
          </div>
          <div className="rounded-lg flex-1" style={{ background: t.bg2, border: `1px solid ${t.border}` }} />
        </div>
      </div>
    </div>
  )
}

export default function Ayarlar() {
  const navigate = useNavigate()
  const kullanici = useMoscosStore(s => s.kullanici)
  const ayarlar = useMoscosStore(s => s.ayarlar)
  const setAyarlar = useMoscosStore(s => s.setAyarlar)
  const t = temaAl('home', ayarlar)

  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(false)

  async function ayarGuncelle(yeniAyarlar) {
    setAyarlar(yeniAyarlar)
    if (!kullanici) return
    setKaydediliyor(true)
    try {
      await setDoc(doc(db, 'kullanici_ayarlari', kullanici.uid), {
        ...ayarlar,
        ...yeniAyarlar
      })
      setKaydedildi(true)
      setTimeout(() => setKaydedildi(false), 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setKaydediliyor(false)
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

      {/* Üçgenler */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <polygon points="0,0 0,260 180,0" fill="none" stroke={t.triangle} strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke={t.triangle} strokeWidth="1"/>
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
      <header className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 relative z-10 border-b"
        style={{ borderColor: t.border }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
        <div className="flex flex-col items-center">
          <span className="font-display text-base font-semibold" style={{ color: t.text }}>Ayarlar</span>
          <AnimatePresence>
            {kaydedildi && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[9px] font-bold tracking-widest"
                style={{ color: '#70D090' }}>
                Kaydedildi ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="w-9" />
      </header>

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-8 relative z-10 pb-10">

        {/* Tema Renkleri */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
            <span className="font-display text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: t.accent }}>
              Tema Renkleri
            </span>
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
          </div>

          {RENK_GRUPLARI.map(grup => (
            <div key={grup.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold" style={{ color: t.dim }}>
                  {grup.label}
                </span>
                <OnizlemeKart theme={grup.theme} ayarlar={ayarlar} />
              </div>
              <div className="flex gap-2">
                {grup.secenekler.map(s => {
                  const secili = ayarlar[grup.key] === s.id
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => ayarGuncelle({ [grup.key]: s.id })}
                      className="flex-1 py-3 rounded-xl font-display text-xs font-semibold flex flex-col items-center gap-2"
                      style={{
                        background: secili ? `${s.renk}25` : t.bg2,
                        border: `1.5px solid ${secili ? s.renk : t.border}`,
                        color: secili ? s.renk : t.dim,
                        boxShadow: secili ? `0 0 16px ${s.renk}30` : 'none',
                        transition: 'all 0.2s',
                      }}>
                      <div className="w-5 h-5 rounded-full"
                        style={{ background: s.renk, boxShadow: secili ? `0 0 8px ${s.renk}80` : 'none' }} />
                      {s.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Buton Boyutu */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
            <span className="font-display text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: t.accent }}>
              Buton Boyutu
            </span>
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
          </div>

          <div className="flex gap-2">
            {BUTON_BOYUTLARI.map(b => {
              const secili = ayarlar.butonBoyutu === b.id
              return (
                <motion.button key={b.id} whileTap={{ scale: 0.95 }}
                  onClick={() => ayarGuncelle({ butonBoyutu: b.id })}
                  className="flex-1 rounded-xl font-display font-semibold flex items-center justify-center"
                  style={{
                    background: secili ? `${t.accent}20` : t.bg2,
                    border: `1.5px solid ${secili ? t.accent : t.border}`,
                    color: secili ? t.accent2 : t.dim,
                    padding: b.id === 'kucuk' ? '8px 12px' : b.id === 'orta' ? '10px 16px' : '12px 20px',
                    fontSize: b.id === 'kucuk' ? 11 : b.id === 'orta' ? 13 : 15,
                    boxShadow: secili ? `0 0 12px ${t.accent}25` : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {b.label}
                </motion.button>
              )
            })}
          </div>

          {/* Önizleme */}
          <div className="rounded-xl p-4 flex flex-wrap gap-2"
            style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
            <span className="text-[9px] font-bold tracking-widest uppercase w-full mb-1" style={{ color: t.dim }}>
              Önizleme
            </span>
            {['Dönem 1', 'KK-1', 'Anatomi', 'Histoloji'].map(label => {
              const b = BUTON_BOYUTLARI.find(x => x.id === ayarlar.butonBoyutu)
              return (
                <div key={label}
                  className={`rounded-xl font-display font-semibold ${b.px} ${b.text}`}
                  style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>
                  {label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Yazı Boyutu */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
            <span className="font-display text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: t.accent }}>
              Yazı Boyutu
            </span>
            <div className="h-px flex-1" style={{ background: `${t.accent}30` }} />
          </div>

          <div className="flex gap-2">
            {YAZI_BOYUTLARI.map(y => {
              const secili = ayarlar.yaziBoyutu === y.id
              return (
                <motion.button key={y.id} whileTap={{ scale: 0.95 }}
                  onClick={() => ayarGuncelle({ yaziBoyutu: y.id })}
                  className="flex-1 py-3 rounded-xl font-display font-semibold"
                  style={{
                    background: secili ? `${t.accent}20` : t.bg2,
                    border: `1.5px solid ${secili ? t.accent : t.border}`,
                    color: secili ? t.accent2 : t.dim,
                    fontSize: y.id === 'kucuk' ? 11 : y.id === 'normal' ? 13 : 15,
                    boxShadow: secili ? `0 0 12px ${t.accent}25` : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {y.label}
                </motion.button>
              )
            })}
          </div>

          {/* Önizleme */}
          <div className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Önizleme</span>
            {(() => {
              const y = YAZI_BOYUTLARI.find(x => x.id === ayarlar.yaziBoyutu)
              return (
                <p className={`font-display font-medium leading-relaxed ${y.size}`} style={{ color: t.text }}>
                  Aşağıdaki yapılardan hangisi ön kolda yer alır ve supinasyon hareketinde görev yapar?
                </p>
              )
            })()}
          </div>
        </div>

        {/* Giriş yapılmamışsa uyarı */}
        {!kullanici && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: `${t.accent}10`, border: `1px solid ${t.border}` }}>
            <span style={{ color: t.accent }}>⚠</span>
            <p className="text-xs" style={{ color: t.dim }}>
              Ayarları kaydetmek için profil sayfasından giriş yap.
            </p>
          </div>
        )}

      </main>
    </motion.div>
  )
}
