import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'


export default function SinavSonuc() {
  const ayarlar = useMoscosStore(s => s.ayarlar)
const t = temaAl('sinav', ayarlar)
  const navigate = useNavigate()
  const aktivSinav = useMoscosStore(s => s.aktivSinav)
  const secimSifirla = useMoscosStore(s => s.secimSifirla)
  const kullanici = useMoscosStore(s => s.kullanici)
  const secim = useMoscosStore(s => s.secim)

  const { sorular, cevaplar } = aktivSinav

  // İstatistikler
  let dogru = 0, yanlis = 0, bos = 0
  const dersDetay = {}

  sorular.forEach((s, i) => {
    const cevap = cevaplar[i]
    if (!dersDetay[s.ders]) dersDetay[s.ders] = { dogru: 0, yanlis: 0, toplam: 0 }
    dersDetay[s.ders].toplam++
    if (!cevap) {
      bos++
      dersDetay[s.ders].yanlis++
    } else if (cevap === s.dogruCevap) {
      dogru++
      dersDetay[s.ders].dogru++
    } else {
      yanlis++
      dersDetay[s.ders].yanlis++
    }
  })

  const yuzde = sorular.length > 0 ? Math.round((dogru / sorular.length) * 100) : 0
  const tier = yuzde >= 75 ? 'high' : yuzde >= 50 ? 'mid' : 'low'
  const tierColor = tier === 'high' ? '#70D090' : tier === 'mid' ? t.accent2 : '#E08080'
  const mesaj = tier === 'high' ? 'Harika gidiyor!' : tier === 'mid' ? 'İyi iş çıkardın.' : 'Tekrar çalışmaya devam!'

  useEffect(() => {
    if (!kullanici || !sorular.length) return
    async function kaydet() {
      try {
        await addDoc(
          collection(db, 'kullanici_sonuclari', kullanici.uid, 'sonuclar'),
          {
            mod: aktivSinav.mod,
            donem: secim.donem,
            kurulId: secim.kurulId,
            ders: secim.ders,
            yil: secim.yil,
            sinav: secim.sinav,
            dogru,
            yanlis,
            bos,
            toplam: sorular.length,
            yuzde,
            tarih: new Date().toISOString(),
          }
        )
      } catch (err) {
        console.error('Sonuç kaydedilemedi:', err)
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
        <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(58,124,200,0.08)" strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(58,124,200,0.08)" strokeWidth="1"/>
      </svg>

      {/* Skor header */}
      <div className="flex flex-col items-center pt-10 pb-5 px-5 flex-shrink-0 relative z-10 border-b"
        style={{ borderColor: t.border }}>
        <span className="text-[10px] font-bold tracking-[0.28em] uppercase mb-3" style={{ color: t.accent }}>
          Sınav Sonucu
        </span>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display font-semibold" style={{ fontSize: 72, lineHeight: 1, letterSpacing: '-0.04em', color: tierColor }}>
            {dogru}
          </span>
          <span className="font-display font-light" style={{ fontSize: 28, color: t.dim }}>/ {sorular.length}</span>
        </div>
        <span className="font-display italic text-lg mb-2" style={{ color: tierColor }}>%{yuzde}</span>
        <span className="text-sm" style={{ color: t.dim }}>{mesaj}</span>

        <div className="flex gap-2.5 mt-4">
          {[
            { num: dogru, label: 'Doğru', color: '#70D090' },
            { num: yanlis, label: 'Yanlış', color: '#E08080' },
            { num: bos, label: 'Boş', color: t.dim },
          ].map(({ num, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl"
              style={{ background: t.bg2, border: `1px solid ${t.border}`, minWidth: 72 }}>
              <span className="font-display text-2xl font-semibold leading-none" style={{ color }}>{num}</span>
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ders detayı */}
      <main className="flex-1 px-5 py-4 overflow-y-auto relative z-10 pb-24">
        <p className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase mb-3" style={{ color: t.accent }}>
          Ders Bazında
        </p>
        <div className="flex flex-col gap-2">
          {Object.entries(dersDetay).map(([ders, stat]) => {
            const y = stat.toplam > 0 ? Math.round((stat.dogru / stat.toplam) * 100) : 0
            return (
              <div key={ders} className="rounded-xl p-3" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold" style={{ color: t.text }}>{ders}</span>
                  <span className="font-display text-sm font-semibold" style={{ color: t.accent2 }}>
                    {stat.dogru}/{stat.toplam} · %{y}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(to right, ${t.accent}, ${t.accent2})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${y}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 flex gap-2 px-5 pb-6 pt-3 z-10"
        style={{ background: `linear-gradient(to top, ${t.bg} 70%, transparent)` }}>
        <button
          onClick={() => { secimSifirla(); navigate('/sinav/filtre') }}
          className="flex-1 h-12 rounded-xl font-display text-sm font-semibold"
          style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}
        >
          Tekrar
        </button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { secimSifirla(); navigate('/') }}
          className="flex-1 h-12 rounded-xl font-display text-sm font-semibold"
          style={{ background: `linear-gradient(135deg, ${t.accent}, #204878)`, color: '#E8F4FF' }}
        >
          Ana Sayfa →
        </motion.button>
      </footer>
    </motion.div>
  )
}
