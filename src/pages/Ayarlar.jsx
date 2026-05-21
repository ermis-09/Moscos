import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'
import { db } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

const AYARLAR_TANIMI = [
 {
   key: 'sinavRenk',
   baslik: 'Sınav Rengi',
   tip: 'renk',
   secenekler: [
     { id: 'mavi', label: 'Mavi', renk: '#3A7CC8' },
     { id: 'kirmizi', label: 'Kırmızı', renk: '#C83A3A' },
     { id: 'turkuaz', label: 'Turkuaz', renk: '#2A9B9B' },
   ]
 },
 {
   key: 'flashRenk',
   baslik: 'Flashcard Rengi',
   tip: 'renk',
   secenekler: [
     { id: 'yesil', label: 'Yeşil', renk: '#2E8B57' },
     { id: 'pembe', label: 'Pembe', renk: '#C83A8B' },
     { id: 'sari', label: 'Sarı', renk: '#B89020' },
   ]
 },
 {
   key: 'simRenk',
   baslik: 'Simülasyon Rengi',
   tip: 'renk',
   secenekler: [
     { id: 'mor', label: 'Mor', renk: '#8B3AC8' },
     { id: 'turuncu', label: 'Turuncu', renk: '#C86020' },
     { id: 'gri', label: 'Gri', renk: '#7A8A9A' },
   ]
 },
 {
   key: 'butonBoyutu',
   baslik: 'Filtre Buton Boyutu',
   tip: 'buton',
   secenekler: [
     { id: 'kucuk', label: 'Küçük', py: 6, fontSize: 11 },
     { id: 'orta', label: 'Orta', py: 10, fontSize: 13 },
     { id: 'buyuk', label: 'Büyük', py: 14, fontSize: 15 },
   ]
 },
 {
   key: 'yaziBoyutu',
   baslik: 'Soru Yazı Boyutu',
   tip: 'yazi',
   secenekler: [
     { id: 'kucuk', label: 'Küçük', fontSize: 12 },
     { id: 'normal', label: 'Normal', fontSize: 14 },
     { id: 'buyuk', label: 'Büyük', fontSize: 17 },
   ]
 },
]

function AyarSatiri({ tanim, ayarlar, onGuncelle, t }) {
 const [acik, setAcik] = useState(false)
 const mevcutSecim = tanim.secenekler.find(s => s.id === ayarlar[tanim.key])
 const mevcutRenk = tanim.tip === 'renk' ? mevcutSecim?.renk : null

 return (
   <div className="rounded-2xl overflow-hidden" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
     {/* Satır başlığı */}
     <button
       onClick={() => setAcik(a => !a)}
       className="w-full flex items-center justify-between px-4 py-4"
     >
       <span className="font-display text-sm font-semibold" style={{ color: t.text }}>
         {tanim.baslik}
       </span>
       <div className="flex items-center gap-2.5">
         {mevcutRenk && (
           <div className="w-4 h-4 rounded-full" style={{ background: mevcutRenk }} />
         )}
         <span className="text-xs font-display" style={{ color: t.dim }}>
           {mevcutSecim?.label}
         </span>
         <motion.span
           animate={{ rotate: acik ? 90 : 0 }}
           transition={{ duration: 0.2 }}
           style={{ color: t.dim, fontSize: 12 }}>›</motion.span>
       </div>
     </button>

     {/* Açılır içerik */}
     <AnimatePresence>
       {acik && (
         <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: 'auto', opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           transition={{ duration: 0.2 }}
           style={{ overflow: 'hidden', borderTop: `1px solid ${t.border}` }}
         >
           <div className="px-4 py-4 flex flex-col gap-3">

             {/* Renk seçimi */}
             {tanim.tip === 'renk' && (
               <div className="flex gap-2">
                 {tanim.secenekler.map(s => {
                   const secili = ayarlar[tanim.key] === s.id
                   return (
                     <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                       onClick={() => onGuncelle({ [tanim.key]: s.id })}
                       className="flex-1 py-3 rounded-xl font-display text-xs font-semibold flex flex-col items-center gap-2"
                       style={{
                         background: secili ? `${s.renk}20` : t.bg3,
                         border: `1.5px solid ${secili ? s.renk : t.border}`,
                         color: secili ? s.renk : t.dim,
                         boxShadow: secili ? `0 0 12px ${s.renk}30` : 'none',
                         transition: 'all 0.2s',
                       }}>
                       <div className="w-5 h-5 rounded-full flex-shrink-0"
                         style={{ background: s.renk, boxShadow: secili ? `0 0 8px ${s.renk}60` : 'none' }} />
                       {s.label}
                     </motion.button>
                   )
                 })}
               </div>
             )}

             {/* Buton boyutu */}
             {tanim.tip === 'buton' && (
               <>
                 <div className="flex gap-2">
                   {tanim.secenekler.map(s => {
                     const secili = ayarlar[tanim.key] === s.id
                     return (
                       <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                         onClick={() => onGuncelle({ [tanim.key]: s.id })}
                         className="flex-1 rounded-xl font-display font-semibold flex items-center justify-center"
                         style={{
                           background: secili ? `${t.accent}20` : t.bg3,
                           border: `1.5px solid ${secili ? t.accent : t.border}`,
                           color: secili ? t.accent2 : t.dim,
                           padding: `${s.py}px 16px`,
                           fontSize: s.fontSize,
                           boxShadow: secili ? `0 0 12px ${t.accent}25` : 'none',
                           transition: 'all 0.2s',
                         }}>
                         {s.label}
                       </motion.button>
                     )
                   })}
                 </div>
                 {/* Önizleme */}
<div className="flex flex-col gap-2 pt-1">
  <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Filtre</p>
  <div className="flex flex-wrap gap-2">
    {['Dönem 1', 'KK-1', 'Anatomi'].map(label => {
      const s = tanim.secenekler.find(x => x.id === ayarlar[tanim.key])
      return (
        <div key={label} className="rounded-xl font-display font-semibold"
          style={{
            background: `${t.accent}15`, border: `1px solid ${t.accent}40`, color: t.accent2,
            padding: `${s?.py || 10}px 16px`, fontSize: s?.fontSize || 13,
          }}>
          {label}
        </div>
      )
    })}
  </div>
  <p className="text-[9px] font-bold tracking-widest uppercase mt-1" style={{ color: t.dim }}>Ana Buton</p>
  <div className="rounded-2xl font-display font-semibold flex items-center justify-between px-5"
    style={{
      background: `linear-gradient(135deg, ${t.accent}, #8B5020)`,
      color: '#FAF0D0',
      paddingTop: (tanim.secenekler.find(x => x.id === ayarlar[tanim.key])?.py || 10) + 2,
      paddingBottom: (tanim.secenekler.find(x => x.id === ayarlar[tanim.key])?.py || 10) + 2,
      fontSize: tanim.secenekler.find(x => x.id === ayarlar[tanim.key])?.fontSize || 13,
    }}>
    Sınava Başla <span>→</span>
  </div>
</div>

               </>
             )}

             {/* Yazı boyutu */}
             {tanim.tip === 'yazi' && (
               <>
                 <div className="flex gap-2">
                   {tanim.secenekler.map(s => {
                     const secili = ayarlar[tanim.key] === s.id
                     return (
                       <motion.button key={s.id} whileTap={{ scale: 0.95 }}
                         onClick={() => onGuncelle({ [tanim.key]: s.id })}
                         className="flex-1 py-3 rounded-xl font-display font-semibold"
                         style={{
                           background: secili ? `${t.accent}20` : t.bg3,
                           border: `1.5px solid ${secili ? t.accent : t.border}`,
                           color: secili ? t.accent2 : t.dim,
                           fontSize: s.fontSize,
                           boxShadow: secili ? `0 0 12px ${t.accent}25` : 'none',
                           transition: 'all 0.2s',
                         }}>
                         {s.label}
                       </motion.button>
                     )
                   })}
                 </div>
                 {/* Önizleme */}
                 <p className="font-display font-medium leading-relaxed pt-1"
                   style={{
                     color: t.dim,
                     fontSize: tanim.secenekler.find(x => x.id === ayarlar[tanim.key])?.fontSize || 14
                   }}>
                   Aşağıdaki yapılardan hangisi ön kolda yer alır ve supinasyon hareketinde görev yapar?
                 </p>
               </>
             )}

           </div>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 )
}

export default function Ayarlar() {
 const navigate = useNavigate()
 const kullanici = useMoscosStore(s => s.kullanici)
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const setAyarlar = useMoscosStore(s => s.setAyarlar)
 const t = temaAl('home', ayarlar)

 const [kaydedildi, setKaydedildi] = useState(false)

 async function ayarGuncelle(yeniAyarlar) {
   setAyarlar(yeniAyarlar)
   if (!kullanici) return
   try {
     await setDoc(doc(db, 'kullanici_ayarlari', kullanici.uid), {
       ...ayarlar,
       ...yeniAyarlar
     })
     setKaydedildi(true)
     setTimeout(() => setKaydedildi(false), 1500)
   } catch (err) {
     console.error(err)
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
     <div className="absolute inset-0 pointer-events-none" style={{
       backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
     }} />

     <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
       <polygon points="0,0 0,260 180,0" fill="none" stroke={t.triangle} strokeWidth="1"/>
       <polygon points="390,844 390,584 210,844" fill="none" stroke={t.triangle} strokeWidth="1"/>
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
               initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
               className="text-[9px] font-bold tracking-widest"
               style={{ color: '#70D090' }}>
               Kaydedildi ✓
             </motion.span>
           )}
         </AnimatePresence>
       </div>
       <div className="w-9" />
     </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3 relative z-10 pb-10">

  {/* Özelleştirme bölümü */}
  <div className="flex items-center gap-2 mb-1">
    <div className="h-px flex-1" style={{ background: `${t.accent}25` }} />
    <span className="font-display text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: t.accent }}>
      Özelleştirme
    </span>
    <div className="h-px flex-1" style={{ background: `${t.accent}25` }} />
  </div>

  {AYARLAR_TANIMI.map(tanim => (
    <AyarSatiri key={tanim.key} tanim={tanim} ayarlar={ayarlar} onGuncelle={ayarGuncelle} t={t} />
  ))}

  {/* Hesap bölümü */}
  <div className="flex items-center gap-2 mt-4 mb-1">
    <div className="h-px flex-1" style={{ background: `${t.accent}25` }} />
    <span className="font-display text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: t.accent }}>
      Hesap
    </span>
    <div className="h-px flex-1" style={{ background: `${t.accent}25` }} />
  </div>

  <div className="rounded-2xl overflow-hidden" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
  <button
    onClick={() => {
      if (!kullanici) return
      // Sınav geçmişi sıfırlama ileride eklenecek
    }}
    className="w-full flex items-center justify-between px-4 py-4">
    <div>
      <span className="font-display text-sm font-semibold" style={{ color: '#E08080' }}>
        Sınav Geçmişini Sıfırla
      </span>
      <p className="text-xs mt-0.5" style={{ color: t.dim }}>Tüm sonuçlar silinir</p>
    </div>
    <span style={{ color: '#E08080', fontSize: 12 }}>›</span>
  </button>
</div>

  {!kullanici && (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3 mt-2"
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
