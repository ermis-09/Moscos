import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'

export default function FlashFiltre() {
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const t = temaAl('flash', ayarlar)
 const navigate = useNavigate()
 const flashcardlar = useMoscosStore(s => s.flashcardlar)
 const kurullarData = useMoscosStore(s => s.kurullarData)
 const anaSayfaIndex = useMoscosStore(s => s.anaSayfaIndex)

 const [donem, setDonem] = useState(null)
 const [kurulId, setKurulId] = useState(null)
 const [ders, setDers] = useState(null)
 const [kartSayisi, setKartSayisi] = useState('')
 const [siralama, setSiralama] = useState('karisik') // 'karisik' | 'sirali'

 const donemler = kurullarData?.donemler.filter(d =>
   flashcardlar.some(f => f.donem === d.id)
 ) || []

 const kurullar = donem
   ? (kurullarData?.donemler.find(d => d.id === donem)?.kurullar || [])
       .filter(k => flashcardlar.some(f => f.donem === donem && f.kurulId === k.id))
   : []

 const dersler = (donem && kurulId)
   ? [...new Set(flashcardlar.filter(f => f.donem === donem && f.kurulId === kurulId).map(f => f.ders))]
   : []

 const sayi = flashcardlar.filter(f => {
   if (f.donem !== donem) return false
   if (f.kurulId !== kurulId) return false
   if (ders && f.ders !== ders) return false
   return true
 }).length

 function basla() {
   navigate('/flashcard', {
     state: { donem, kurulId, ders, kartSayisi: kartSayisi || null, siralama }
   })
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
       <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(46,139,87,0.1)" strokeWidth="1"/>
       <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(46,139,87,0.1)" strokeWidth="1"/>
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

     <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
       <button onClick={() => { sessionStorage.setItem('anaIndex', anaSayfaIndex); navigate('/') }}
         className="w-9 h-9 rounded-full flex items-center justify-center"
         style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
       <span className="font-display text-base font-semibold" style={{ color: t.text }}>Flashcard</span>
       <div className="w-9" />
     </header>

     <main className="flex-1 px-5 pb-6 flex flex-col gap-5 relative z-10 overflow-y-auto">

       {/* Dönem */}
       <div className="flex flex-col gap-3">
         <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
           Dönem
         </span>
         <div className="flex gap-2 flex-wrap">
           {donemler.length === 0 && (
             <p className="text-sm italic" style={{ color: t.dim }}>Henüz flashcard yok.</p>
           )}
           {donemler.map(d => (
             <button key={d.id}
               onClick={() => { setDonem(d.id); setKurulId(null); setDers(null) }}
               className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
               style={{
                 background: donem === d.id ? t.accent : t.bg2,
                 color: donem === d.id ? '#E8FFF0' : t.dim,
                 border: `1px solid ${donem === d.id ? t.accent2 : t.border}`,
                 boxShadow: donem === d.id ? `0 4px 12px ${t.accent}40` : 'none'
               }}>{d.ad}</button>
           ))}
         </div>
       </div>

       {/* Kurul */}
       {donem && (
         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
           <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
             Kurul
           </span>
           <div className="flex gap-2 flex-wrap">
             {kurullar.map(k => (
               <button key={k.id}
                 onClick={() => { setKurulId(k.id); setDers(null) }}
                 className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
                 style={{
                   background: kurulId === k.id ? t.accent : t.bg2,
                   color: kurulId === k.id ? '#E8FFF0' : t.dim,
                   border: `1px solid ${kurulId === k.id ? t.accent2 : t.border}`,
                   boxShadow: kurulId === k.id ? `0 4px 12px ${t.accent}40` : 'none'
                 }}>{k.ad}</button>
             ))}
           </div>
         </motion.div>
       )}

       {/* Ders */}
       {kurulId && (
         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
           <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
             Ders <span style={{ color: t.dim, fontWeight: 400 }}>(opsiyonel)</span>
           </span>
           <div className="flex gap-2 flex-wrap">
             <button onClick={() => setDers(null)}
               className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
               style={{
                 background: ders === null ? t.accent : t.bg2,
                 color: ders === null ? '#E8FFF0' : t.dim,
                 border: `1px solid ${ders === null ? t.accent2 : t.border}`,
               }}>Tümü</button>
             {dersler.map(d => (
               <button key={d} onClick={() => setDers(d)}
                 className="px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all"
                 style={{
                   background: ders === d ? t.accent : t.bg2,
                   color: ders === d ? '#E8FFF0' : t.dim,
                   border: `1px solid ${ders === d ? t.accent2 : t.border}`,
                 }}>{d}</button>
             ))}
           </div>
         </motion.div>
       )}

       {/* Sıralama + Kart sayısı */}
       {kurulId && (
         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

           {/* Sıralama */}
           <div className="flex flex-col gap-3">
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
               Sıralama
             </span>
             <div className="flex gap-2">
               {[
                 { id: 'karisik', label: 'Karışık' },
{ id: 'sirali', label: 'Sıralı' },
               ].map(s => (
                 <button key={s.id} onClick={() => setSiralama(s.id)}
                   className="flex-1 py-3 rounded-xl font-display text-sm font-semibold transition-all"
                   style={{
                     background: siralama === s.id ? t.accent : t.bg2,
                     color: siralama === s.id ? '#E8FFF0' : t.dim,
                     border: `1.5px solid ${siralama === s.id ? t.accent2 : t.border}`,
                     boxShadow: siralama === s.id ? `0 4px 12px ${t.accent}40` : 'none',
                   }}>{s.label}</button>
               ))}
             </div>
           </div>

           {/* Kart sayısı */}
           <div className="flex flex-col gap-3">
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
               Kart Sayısı
             </span>
             <div className="flex gap-2">
               {[10, 20, 50].map(n => (
                 <button key={n}
                   onClick={() => setKartSayisi(kartSayisi === n ? '' : n)}
                   className="flex-1 py-3 rounded-xl font-display text-sm font-semibold transition-all"
                   style={{
                     background: kartSayisi === n ? t.accent : t.bg2,
                     color: kartSayisi === n ? '#E8FFF0' : t.dim,
                     border: `1.5px solid ${kartSayisi === n ? t.accent2 : t.border}`,
                     boxShadow: kartSayisi === n ? `0 4px 12px ${t.accent}40` : 'none',
                   }}>{n}</button>
               ))}
               <div className="relative flex items-center rounded-xl overflow-hidden flex-shrink-0"
                 style={{
                   background: t.bg2,
                   border: `1.5px solid ${typeof kartSayisi === 'number' && ![10,20,50].includes(kartSayisi) ? t.accent2 : t.border}`,
                   width: 72,
                 }}>
                 <input
                   type="number"
                   value={typeof kartSayisi === 'number' && ![10,20,50].includes(kartSayisi) ? kartSayisi : ''}
                   onChange={e => setKartSayisi(e.target.value ? parseInt(e.target.value) : '')}
                   placeholder="—"
                   className="w-full py-3 font-display text-sm font-semibold text-center bg-transparent outline-none"
                   style={{ color: t.text }}
                 />
                 <span className="absolute bottom-1.5 right-2 font-display text-[8px]"
                   style={{ color: t.dim }}>/{sayi}</span>
               </div>
             </div>
           </div>

           {/* Başla */}
           <div className="mt-auto">
             <motion.button whileTap={{ scale: 0.98 }} onClick={basla} disabled={sayi === 0}
               className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-semibold flex items-center justify-between disabled:opacity-40"
               style={{
                 background: `linear-gradient(135deg, ${t.accent}, #1A5030)`,
                 color: '#E8FFF0',
                 boxShadow: `0 6px 20px ${t.accent}40`
               }}>
               Çalışmaya Başla
               <span className="text-sm font-normal opacity-70">
                 {kartSayisi && kartSayisi > 0 ? `${Math.min(kartSayisi, sayi)}` : sayi} kart →
               </span>
             </motion.button>
           </div>
         </motion.div>
       )}

     </main>
   </motion.div>
 )
}
