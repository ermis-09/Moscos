import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'

const harfler = ['A', 'B', 'C', 'D', 'E']

function secenekStil(harf, soruObj, cevap) {
  if (harf === soruObj.dogruCevap) return {
    bg: 'rgba(46,139,87,0.2)', border: '#2E8B57',
    text: '#B8E0C8', letterBg: '#2E8B57', letterColor: 'white'
  }
  if (harf === cevap && cevap !== soruObj.dogruCevap) return {
    bg: 'rgba(139,58,58,0.2)', border: '#8B3A3A',
    text: '#E0B8B8', letterBg: '#8B3A3A', letterColor: 'white'
  }
  return {
    bg: t.bg2, border: t.border,
    text: `${t.dim}80`, letterBg: t.bg3, letterColor: `${t.accent}60`
  }
}

export default function SimulasyonSonuc() {
  const ayarlar = useMoscosStore(s => s.ayarlar)
const t = temaAl('sim', ayarlar)
  const navigate = useNavigate()
  const aktivSinav = useMoscosStore(s => s.aktivSinav)
  const secimSifirla = useMoscosStore(s => s.secimSifirla)
  const kullanici = useMoscosStore(s => s.kullanici)
  const secim = useMoscosStore(s => s.secim)

  const [optikAcik, setOptikAcik] = useState(false)
  const [secilenSoru, setSecilenSoru] = useState(0)
  const [filtre, setFiltre] = useState('hepsi')

  const { sorular, cevaplar } = aktivSinav

  let dogru = 0, yanlis = 0, bos = 0
  sorular.forEach((s, i) => {
    const c = cevaplar[i]
    if (!c) bos++
    else if (c === s.dogruCevap) dogru++
    else yanlis++
  })

  const yuzde = sorular.length > 0 ? Math.round((dogru / sorular.length) * 100) : 0
  const tierColor = yuzde >= 75 ? '#70D090' : yuzde >= 50 ? t.accent2 : '#E08080'
  const mesaj = yuzde >= 75 ? 'Harika gidiyor!' : yuzde >= 50 ? 'İyi iş çıkardın.' : 'Tekrar çalışmaya devam!'

  useEffect(() => {
    if (!kullanici || !sorular.length) return
    async function kaydet() {
      try {
        await addDoc(
          collection(db, 'kullanici_sonuclari', kullanici.uid, 'sonuclar'),
          {
            mod: 'simulasyon',
            yil: secim.yil,
            sinav: secim.sinav,
            dogru, yanlis, bos,
            toplam: sorular.length,
            yuzde,
            tarih: new Date().toISOString(),
          }
        )
      } catch (err) {
        console.error(err)
      }
    }
    kaydet()
  }, [])

  if (!sorular.length) {
    return (
      <div className="w-full max-w-[390px] mx-auto flex items-center justify-center"
        style={{ height: '100dvh', background: t.bg, color: t.dim }}>
        <p>Veri bulunamadı.</p>
      </div>
    )
  }

  function optikRenk(i) {
    const c = cevaplar[i]
    if (!c) return { bg: t.bg3, border: t.border, color: t.dim }
    if (c === sorular[i].dogruCevap) return { bg: 'rgba(46,139,87,0.3)', border: '#2E8B57', color: '#70D090' }
    return { bg: 'rgba(139,58,58,0.3)', border: '#8B3A3A', color: '#E08080' }
  }

  const filtreliSorular = sorular.map((s, i) => ({ s, i })).filter(({ i }) => {
    const c = cevaplar[i]
    if (filtre === 'yanlis') return c && c !== sorular[i].dogruCevap
    if (filtre === 'bos') return !c
    return true
  })

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

      {/* Skor header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-5 flex-shrink-0 relative z-10 border-b"
        style={{ borderColor: t.border }}>
        <span className="text-[10px] font-bold tracking-[0.28em] uppercase mb-2" style={{ color: t.accent }}>
          Simülasyon Sonucu
        </span>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display font-semibold" style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.04em', color: tierColor }}>
            {dogru}
          </span>
          <span className="font-display font-light" style={{ fontSize: 24, color: t.dim }}>/ {sorular.length}</span>
        </div>
        <span className="font-display italic text-base mb-1" style={{ color: tierColor }}>%{yuzde}</span>
        <span className="text-xs mb-3" style={{ color: t.dim }}>{mesaj}</span>

        <div className="flex gap-2">
          {[
            { num: dogru, label: 'Doğru', color: '#70D090' },
            { num: yanlis, label: 'Yanlış', color: '#E08080' },
            { num: bos, label: 'Boş', color: t.dim },
          ].map(({ num, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
              style={{ background: t.bg2, border: `1px solid ${t.border}`, minWidth: 64 }}>
              <span className="font-display text-xl font-semibold leading-none" style={{ color }}>{num}</span>
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optik önizleme */}
      <main className="flex-1 px-5 py-4 overflow-y-auto relative z-10 pb-24">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
            Optik
          </p>
          {/* Filtre */}
          <div className="flex gap-1.5">
            {[
              { id: 'hepsi', label: 'Hepsi' },
              { id: 'yanlis', label: 'Yanlış' },
              { id: 'bos', label: 'Boş' },
            ].map(f => (
              <button key={f.id}
                onClick={() => setFiltre(f.id)}
                className="px-3 py-1 rounded-lg font-display text-[10px] font-semibold"
                style={{
                  background: filtre === f.id ? t.accent : t.bg2,
                  border: `1px solid ${filtre === f.id ? t.accent2 : t.border}`,
                  color: filtre === f.id ? '#F8E8FF' : t.dim,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {filtreliSorular.map(({ i }) => {
            const renk = optikRenk(i)
            return (
              <button
                key={i}
                onClick={() => { setSecilenSoru(i); setOptikAcik(true) }}
                className="w-full aspect-square rounded-lg flex items-center justify-center font-display text-[11px] font-semibold"
                style={{
                  background: renk.bg,
                  border: `1.5px solid ${renk.border}`,
                  color: renk.color,
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 flex gap-2 px-5 pb-6 pt-3 z-10"
        style={{ background: `linear-gradient(to top, ${t.bg} 70%, transparent)` }}>
        <button
          onClick={() => { secimSifirla(); navigate('/simulasyon/filtre') }}
          className="flex-1 h-12 rounded-xl font-display text-sm font-semibold"
          style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}
        >Tekrar</button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { secimSifirla(); navigate('/') }}
          className="flex-1 h-12 rounded-xl font-display text-sm font-semibold"
          style={{ background: `linear-gradient(135deg, ${t.accent}, #501878)`, color: '#F8E8FF' }}
        >Ana Sayfa →</motion.button>
      </footer>

      {/* Soru detay paneli — tam ekran */}
      <AnimatePresence>
        {optikAcik && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 z-30 flex flex-col"
            style={{ background: t.bg }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b flex-shrink-0"
              style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSecilenSoru(i => Math.max(0, i - 1))}
                  disabled={secilenSoru === 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}
                >←</button>
                <span className="font-display text-sm font-semibold" style={{ color: t.text }}>
                  Soru {secilenSoru + 1} / {sorular.length}
                </span>
                <button
                  onClick={() => setSecilenSoru(i => Math.min(sorular.length - 1, i + 1))}
                  disabled={secilenSoru === sorular.length - 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}
                >→</button>
              </div>
              <button
                onClick={() => setOptikAcik(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}
              >✕</button>
            </div>

            {/* Soru içeriği */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {(() => {
                const soruObj = sorular[secilenSoru]
                const cevap = cevaplar[secilenSoru]
                return (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                        style={{ background: t.accent, color: '#F8E8FF' }}>
                        {soruObj.ders}
                      </span>
                      {soruObj.ogrenimHedefi && (
                        <span className="text-xs italic" style={{ color: t.dim }}>{soruObj.ogrenimHedefi}</span>
                      )}
                    </div>

                    <p className="font-display text-lg font-medium leading-snug"
                      style={{ color: t.text, letterSpacing: '-0.01em' }}>
                      {soruObj.soru}
                    </p>

                    <div className="flex flex-col gap-2">
                      {harfler.map(harf => {
                        const metin = soruObj.secenekler?.[harf]
                        if (!metin) return null
                        const st = secenekStil(harf, soruObj, cevap)
                        return (
                          <div key={harf}
                            className="flex items-start gap-3 rounded-xl px-4 py-3"
                            style={{ background: st.bg, border: `1.5px solid ${st.border}` }}>
                            <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-display text-sm font-semibold"
                              style={{ background: st.letterBg, color: st.letterColor }}>
                              {harf}
                            </span>
                            <span className="flex-1 text-sm leading-relaxed pt-0.5"
                              style={{ color: st.text }}>
                              {metin}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {soruObj.aciklama && (
                      <div className="rounded-xl px-4 py-3 border-l-2"
                        style={{ background: t.bg2, borderColor: t.accent }}>
                        <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5"
                          style={{ color: t.accent }}>Açıklama</p>
                        <p className="text-sm leading-relaxed" style={{ color: t.dim }}>{soruObj.aciklama}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Alt mini optik */}
            <div className="px-5 pb-6 pt-3 border-t flex-shrink-0" style={{ borderColor: t.border }}>
              <div className="grid grid-cols-10 gap-1">
                {sorular.map((_, i) => {
                  const renk = optikRenk(i)
                  const aktif = i === secilenSoru
                  return (
                    <button
                      key={i}
                      onClick={() => setSecilenSoru(i)}
                      className="aspect-square rounded-md flex items-center justify-center font-display text-[9px] font-semibold"
                      style={{
                        background: aktif ? t.accent : renk.bg,
                        border: `1px solid ${aktif ? t.accent2 : renk.border}`,
                        color: aktif ? '#F8E8FF' : renk.color,
                      }}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
