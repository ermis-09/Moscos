import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useMoscosStore } from '../store'
import { temaAl, RENK_PALETI, VARSAYILAN_AYARLAR, UYUMLAMA } from '../lib/renkler'
import { db } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

function RenkSec({ aksent, onChange, t }) {
  const [hexInput, setHexInput] = useState(aksent)
  const [gecersiz, setGecersiz] = useState(false)

  useEffect(() => { setHexInput(aksent) }, [aksent])

  function hexGecerliMi(hex) { return /^#[0-9A-Fa-f]{6}$/.test(hex) }

  function hexDegisti(val) {
    setHexInput(val)
    if (hexGecerliMi(val)) { setGecersiz(false); onChange(val) }
    else setGecersiz(true)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Palet */}
      <div className="grid grid-cols-9 gap-1.5">
        {RENK_PALETI.map(renk => (
          <button key={renk} onClick={() => { onChange(renk); setHexInput(renk); setGecersiz(false) }}
            className="rounded-lg transition-all"
            style={{
              background: renk,
              aspectRatio: '1',
              border: aksent === renk ? `2px solid white` : '2px solid transparent',
              boxShadow: aksent === renk ? `0 0 8px ${renk}80` : 'none',
              transform: aksent === renk ? 'scale(1.15)' : 'scale(1)',
            }} />
        ))}
      </div>
      {/* Hex input */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: hexGecerliMi(hexInput) ? hexInput : t.bg3, border: `1px solid ${t.border}` }} />
        <input value={hexInput} onChange={e => hexDegisti(e.target.value)}
          placeholder="#4A8CD8" maxLength={7}
          className="flex-1 px-3 py-2 rounded-xl text-sm font-mono"
          style={{
            background: t.bg3,
            border: `1px solid ${gecersiz ? '#E08080' : t.border}`,
            color: t.text,
          }} />
        {gecersiz && <span className="text-xs" style={{ color: '#E08080' }}>Geçersiz</span>}
      </div>
    </div>
  )
}

function OnizlemeKart({ tema, label, aksent, t }) {
  const tt = temaAl(tema, { sinavAksent: aksent, flashAksent: aksent, simAksent: aksent, anaRenk: 'soguk' })
  return (
    <div className="rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: tt.bg, border: `1.5px solid ${tt.border}` }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: tt.border }}>
        <span className="font-display text-[9px] font-bold tracking-widest uppercase" style={{ color: tt.accent }}>{label}</span>
        <div className="w-3 h-3 rounded-full" style={{ background: tt.accent }} />
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-1.5 rounded-full" style={{ background: tt.accent, width: '65%' }} />
        <div className="h-1.5 rounded-full" style={{ background: `${tt.accent}40`, width: '45%' }} />
        <div className="flex gap-2 mt-1">
          <div className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
            style={{ background: tt.accent, color: tt.bg }}>Seçili</div>
          <div className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
            style={{ background: tt.bg2, border: `1px solid ${tt.border}`, color: tt.dim }}>Pasif</div>
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

  // Yerel kopya — kaydet basılana kadar store'a yansımaz
  const [taslak, setTaslak] = useState({ ...ayarlar })
  const [degisti, setDegisti] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(false)
  const [kategori, setKategori] = useState('temalar')

  // Uyumlama popup
  const [uyumlamaModal, setUyumlamaModal] = useState(false)
  const [bekleyenTon, setBekleyenTon] = useState(null)

  // Varsayılana dön popup
  const [sifirlaModal, setSifirlaModal] = useState(false)

  function taslakGuncelle(yeni) {
    setTaslak(f => ({ ...f, ...yeni }))
    setDegisti(true)
  }

  function anaTonDegisti(ton) {
    setBekleyenTon(ton)
    taslakGuncelle({ anaRenk: ton })
    setUyumlamaModal(true)
  }

  function uyumlamaOnayla() {
    const uyum = UYUMLAMA[bekleyenTon]
    if (uyum) taslakGuncelle(uyum)
    setUyumlamaModal(false)
    setBekleyenTon(null)
  }

  function uyumlamaReddet() {
    setUyumlamaModal(false)
    setBekleyenTon(null)
  }

  function sifirla() {
    setTaslak({ ...VARSAYILAN_AYARLAR })
    setDegisti(true)
    setSifirlaModal(false)
  }

  async function kaydet() {
    setAyarlar(taslak)
    setDegisti(false)
    setKaydedildi(true)
    setTimeout(() => setKaydedildi(false), 2000)
    if (!kullanici) return
    try {
      await setDoc(doc(db, 'kullanici_ayarlari', kullanici.uid), taslak)
    } catch (err) { console.error(err) }
  }

  const tOnizleme = temaAl('home', taslak)

  const KATEGORILER = [
  { id: 'temalar', label: 'Temalar', ikon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="8"/>
      <line x1="12" y1="16" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="8" y2="12"/>
      <line x1="16" y1="12" x2="22" y2="12"/>
    </svg>
  )},
  { id: 'gorunum', label: 'Görünüm', ikon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: 'hesap', label: 'Hesap', ikon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )},
]


  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full mx-auto flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
      }} />
      <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
        <polygon points="0,0 0,260 180,0" fill="none" stroke={t.triangle} strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke={t.triangle} strokeWidth="1"/>
      </svg>

      <header className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 relative z-10 border-b"
        style={{ borderColor: t.border }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-base font-semibold" style={{ color: t.text }}>Ayarlar</span>
          <AnimatePresence>
            {kaydedildi && (
              <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[9px] font-bold tracking-widest" style={{ color: '#70D090' }}>Kaydedildi ✓</motion.span>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setSifirlaModal(true)}
          className="px-3 py-1.5 rounded-lg font-display text-[10px] font-semibold"
          style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}>
          Sıfırla
        </button>
      </header>

      {/* İki kolon */}
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* Sol — kategori seçimi */}
        <div className="flex flex-col gap-1 px-3 py-4 flex-shrink-0 border-r"
          style={{ width: 72, borderColor: t.border }}>
          {KATEGORILER.map(k => (
            <button key={k.id} onClick={() => setKategori(k.id)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
              style={{
                background: kategori === k.id ? `${t.accent}20` : 'transparent',
                border: `1px solid ${kategori === k.id ? t.accent : 'transparent'}`,
              }}>
             <div style={{ color: kategori === k.id ? t.accent : t.dim }}>
  {k.ikon}
</div>

              <span className="text-[8px] font-bold tracking-wide" style={{ color: kategori === k.id ? t.accent2 : t.dim }}>
                {k.label}
              </span>
            </button>
          ))}
        </div>

        {/* Sağ — içerik */}
        <div className="flex-1 flex overflow-hidden">

          {/* İçerik paneli */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 md:max-w-sm md:border-r pb-32"
            style={{ borderColor: t.border }}>

            {kategori === 'temalar' && (
              <>
                {/* Ana ton */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Ana Sayfa Tonu
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sicak', label: 'Sıcak', renk: '#C8771A', sub: 'Amber & Altın' },
                      { id: 'soguk', label: 'Soğuk', renk: '#7A8A9A', sub: 'Çelik & Gri' },
                      { id: 'aydinlik', label: 'Aydınlık', renk: '#A09070', sub: 'Krem & Taş' },
                    ].map(s => {
                      const secili = taslak.anaRenk === s.id
                      return (
                        <motion.button key={s.id} whileTap={{ scale: 0.97 }}
                          onClick={() => anaTonDegisti(s.id)}
                          className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                          style={{
                            background: secili ? `${s.renk}18` : t.bg2,
                            border: `1.5px solid ${secili ? s.renk : t.border}`,
                            boxShadow: secili ? `0 0 16px ${s.renk}25` : 'none',
                          }}>
                          <div className="w-8 h-8 rounded-full"
                            style={{ background: s.renk, boxShadow: secili ? `0 0 10px ${s.renk}60` : 'none' }} />
                          <div className="text-center">
                            <p className="font-display text-xs font-semibold" style={{ color: secili ? s.renk : t.text }}>{s.label}</p>
                            <p className="text-[9px] mt-0.5" style={{ color: t.dim }}>{s.sub}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <div className="h-px" style={{ background: t.border }} />

                {/* Sınav rengi */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Sınav Rengi
                  </span>
                  <RenkSec aksent={taslak.sinavAksent || VARSAYILAN_AYARLAR.sinavAksent}
                    onChange={val => taslakGuncelle({ sinavAksent: val })} t={t} />
                </div>

                <div className="h-px" style={{ background: t.border }} />

                {/* Flashcard rengi */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Flashcard Rengi
                  </span>
                  <RenkSec aksent={taslak.flashAksent || VARSAYILAN_AYARLAR.flashAksent}
                    onChange={val => taslakGuncelle({ flashAksent: val })} t={t} />
                </div>

                <div className="h-px" style={{ background: t.border }} />

                {/* Simülasyon rengi */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Simülasyon Rengi
                  </span>
                  <RenkSec aksent={taslak.simAksent || VARSAYILAN_AYARLAR.simAksent}
                    onChange={val => taslakGuncelle({ simAksent: val })} t={t} />
                </div>
              </>
            )}

            {kategori === 'gorunum' && (
              <>
                {/* Buton boyutu */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Filtre Buton Boyutu
                  </span>
                  <div className="flex gap-2">
                    {[
                      { id: 'kucuk', label: 'Küçük', py: 6, fontSize: 11 },
                      { id: 'orta', label: 'Orta', py: 10, fontSize: 13 },
                      { id: 'buyuk', label: 'Büyük', py: 14, fontSize: 15 },
                    ].map(s => {
                      const secili = taslak.butonBoyutu === s.id
                      return (
                        <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                          onClick={() => taslakGuncelle({ butonBoyutu: s.id })}
                          className="flex-1 rounded-xl font-display font-semibold flex items-center justify-center"
                          style={{
                            background: secili ? `${t.accent}20` : t.bg2,
                            border: `1.5px solid ${secili ? t.accent : t.border}`,
                            color: secili ? t.accent2 : t.dim,
                            padding: `${s.py}px 16px`,
                            fontSize: s.fontSize,
                            boxShadow: secili ? `0 0 12px ${t.accent}20` : 'none',
                          }}>{s.label}</motion.button>
                      )
                    })}
                  </div>
                  {/* Önizleme */}
                  <div className="flex flex-col gap-2 pt-1">
                    <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Filtre</p>
                    <div className="flex flex-wrap gap-2">
                      {['Dönem 1', 'KK-1', 'Anatomi'].map(label => {
                        const s = [{ id: 'kucuk', py: 6, fontSize: 11 }, { id: 'orta', py: 10, fontSize: 13 }, { id: 'buyuk', py: 14, fontSize: 15 }].find(x => x.id === taslak.butonBoyutu)
                        return (
                          <div key={label} className="rounded-xl font-display font-semibold"
                            style={{ background: `${t.accent}15`, border: `1px solid ${t.accent}40`, color: t.accent2, padding: `${s?.py || 10}px 16px`, fontSize: s?.fontSize || 13 }}>
                            {label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="h-px" style={{ background: t.border }} />

                {/* Yazı boyutu */}
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                    Soru Yazı Boyutu
                  </span>
                  <div className="flex gap-2">
                    {[{ id: 'kucuk', label: 'Küçük', fontSize: 12 }, { id: 'normal', label: 'Normal', fontSize: 14 }, { id: 'buyuk', label: 'Büyük', fontSize: 17 }].map(s => {
                      const secili = taslak.yaziBoyutu === s.id
                      return (
                        <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                          onClick={() => taslakGuncelle({ yaziBoyutu: s.id })}
                          className="flex-1 py-3 rounded-xl font-display font-semibold"
                          style={{ background: secili ? `${t.accent}20` : t.bg2, border: `1.5px solid ${secili ? t.accent : t.border}`, color: secili ? t.accent2 : t.dim, fontSize: s.fontSize }}>
                          {s.label}
                        </motion.button>
                      )
                    })}
                  </div>
                  <p className="font-display font-medium leading-relaxed p-3 rounded-xl"
                    style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim, fontSize: [{ id: 'kucuk', fontSize: 12 }, { id: 'normal', fontSize: 14 }, { id: 'buyuk', fontSize: 17 }].find(x => x.id === taslak.yaziBoyutu)?.fontSize || 14 }}>
                    Aşağıdaki yapılardan hangisi ön kolda yer alır ve supinasyon hareketinde görev yapar?
                  </p>
                </div>
              </>
            )}

            {kategori === 'hesap' && (
              <div className="flex flex-col gap-3">
                <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
                  Hesap
                </span>
                <div className="rounded-2xl overflow-hidden" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
                  <button className="w-full flex items-center justify-between px-4 py-4">
                    <div>
                      <span className="font-display text-sm font-semibold" style={{ color: '#E08080' }}>Sınav Geçmişini Sıfırla</span>
                      <p className="text-xs mt-0.5" style={{ color: t.dim }}>Tüm sonuçlar silinir</p>
                    </div>
                    <span style={{ color: '#E08080' }}>›</span>
                  </button>
                </div>
                {!kullanici && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: `${t.accent}10`, border: `1px solid ${t.border}` }}>
                    <span style={{ color: t.accent }}>⚠</span>
                    <p className="text-xs" style={{ color: t.dim }}>Ayarları kaydetmek için profil sayfasından giriş yap.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canlı önizleme — md+ */}
          <div className="hidden md:flex flex-1 flex-col px-6 py-5 gap-4 overflow-y-auto">
            <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
              Canlı Önizleme
            </span>
            {kategori === 'temalar' && (
              <div className="flex flex-col gap-3">
                <OnizlemeKart tema="sinav" label="Sınav" aksent={taslak.sinavAksent || VARSAYILAN_AYARLAR.sinavAksent} t={t} />
                <OnizlemeKart tema="flash" label="Flashcard" aksent={taslak.flashAksent || VARSAYILAN_AYARLAR.flashAksent} t={t} />
                <OnizlemeKart tema="sim" label="Simülasyon" aksent={taslak.simAksent || VARSAYILAN_AYARLAR.simAksent} t={t} />
              </div>
            )}
            {kategori === 'gorunum' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: t.dim }}>Filtre ve soru boyutları sol panelde önizleniyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kaydet butonu */}
      <AnimatePresence>
        {degisti && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 z-20"
            style={{ background: `linear-gradient(to top, ${t.bg} 60%, transparent)` }}>
            <motion.button whileTap={{ scale: 0.98 }} onClick={kaydet}
              className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, ${t.accent}, ${tOnizleme.accent2 || t.accent})`, color: '#FAF0D0', boxShadow: `0 6px 20px ${t.accent}40` }}>
              Değişiklikleri Kaydet ✓
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uyumlama modal */}
      <AnimatePresence>
        {uyumlamaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[320px] rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
              <div className="text-center flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: `${t.accent}20`, border: `1px solid ${t.border}` }}>
                  <span style={{ fontSize: 22 }}>🎨</span>
                </div>
                <p className="font-display text-base font-bold" style={{ color: t.text }}>Renkleri Uyumla</p>
                <p className="text-sm leading-relaxed" style={{ color: t.dim }}>
                  Diğer renkleri de <span style={{ color: t.accent2 }}>{bekleyenTon}</span> tonuna uyumlamak ister misin?
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.98 }} onClick={uyumlamaOnayla}
                  className="w-full py-3 rounded-xl font-display text-sm font-semibold"
                  style={{ background: `linear-gradient(135deg, ${t.accent}, #8B5020)`, color: '#FAF0D0' }}>
                  Evet, uyumla
                </motion.button>
                <button onClick={uyumlamaReddet} className="w-full py-3 rounded-xl font-display text-sm font-semibold"
                  style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>
                  Hayır, olduğu gibi kalsın
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sıfırlama modal */}
      <AnimatePresence>
        {sifirlaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[320px] rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
              <div className="text-center">
                <p className="font-display text-base font-bold mb-2" style={{ color: t.text }}>Varsayılana Dön</p>
                <p className="text-sm" style={{ color: t.dim }}>Tüm renk ve görünüm ayarları sıfırlanacak.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSifirlaModal(false)} className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                  style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>İptal</button>
                <button onClick={sifirla} className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #8B3A3A, #6B2A2A)', color: '#FFD0D0' }}>Sıfırla</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
