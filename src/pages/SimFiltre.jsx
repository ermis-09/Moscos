import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
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
 const kurullarData = useMoscosStore(s => s.kurullarData)

 const [donem, setDonem] = useState(null)
 const [yil, setYil] = useState(null)
 const [sinav, setSinav] = useState(null)

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

 useEffect(() => {
   function handleKey(e) {
     if (e.key === 'Enter' && sinav && sayi > 0) basla()
   }
   window.addEventListener('keydown', handleKey)
   return () => window.removeEventListener('keydown', handleKey)
 }, [sinav, sayi, donem, yil])

 function basla() {
   const uygun = cikmislar
     .filter(s => s.donem === donem && s.yil === yil && s.sinav === sinav)
     .sort((a, b) => (a.sira || 0) - (b.sira || 0))
   setSecim('yil', yil)
   setSecim('sinav', sinav)
   sinavBaslat(uygun, 'simulasyon')
   navigate('/sinav/coz')
 }

 const butonClass = `rounded-xl font-display font-semibold transition-all ${
   ayarlar.butonBoyutu === 'kucuk' ? 'px-3 py-2 text-xs' :
   ayarlar.butonBoyutu === 'buyuk' ? 'px-5 py-3 text-base' :
   'px-4 py-2.5 text-sm'
 }`

 // Tüm arşiv — sağ panel için
 const arsiv = Object.entries(
   cikmislar.reduce((acc, s) => {
     const key = `${s.yil} · ${s.sinav}`
     if (!acc[key]) acc[key] = { yil: s.yil, sinav: s.sinav, donem: s.donem, sayi: 0 }
     acc[key].sayi++
     return acc
   }, {})
 ).sort((a, b) => b[1].yil - a[1].yil)

 return (
   <motion.div
     initial={{ x: '100%', opacity: 0 }}
     animate={{ x: 0, opacity: 1 }}
     exit={{ x: '100%', opacity: 0 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
     className="w-full mx-auto flex flex-col relative overflow-hidden"
     style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text }}
   >
     <div className="absolute inset-0 pointer-events-none" style={{
       backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
     }} />
     <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
       <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(139,58,200,0.1)" strokeWidth="1"/>
       <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(139,58,200,0.1)" strokeWidth="1"/>
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

     <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10 border-b"
       style={{ borderColor: t.border }}>
       <button onClick={() => { sessionStorage.setItem('anaIndex', anaSayfaIndex); navigate('/') }}
         className="w-9 h-9 rounded-full flex items-center justify-center"
         style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
       <span className="font-display text-base font-semibold" style={{ color: t.text }}>Simülasyon Filtresi</span>
       <div className="w-9">
         {sinav && sayi > 0 && (
           <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Enter ↵</span>
         )}
       </div>
     </header>

     <div className="flex-1 flex overflow-hidden relative z-10">

       {/* Sol panel — filtreler */}
       <main className="flex-1 px-5 pb-6 flex flex-col gap-5 overflow-y-auto md:border-r md:max-w-md"
         style={{ borderColor: t.border }}>

         {/* Dönem */}
         <div className="flex flex-col gap-3 pt-4">
           <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>Dönem</span>
           <div className="flex gap-2 flex-wrap">
             {donemler.map(d => (
               <button key={d.id} onClick={() => { setDonem(d.id); setYil(null); setSinav(null) }}
                 className={butonClass}
                 style={{
                   background: donem === d.id ? t.accent : t.bg2,
                   color: donem === d.id ? '#F8E8FF' : t.dim,
                   border: `1px solid ${donem === d.id ? t.accent2 : t.border}`,
                   boxShadow: donem === d.id ? `0 4px 12px ${t.accent}40` : 'none'
                 }}>{d.ad}</button>
             ))}
           </div>
         </div>

         {/* Yıl */}
         {donem && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>Yıl</span>
             <div className="flex gap-2 flex-wrap">
               {yillar.map(y => (
                 <button key={y} onClick={() => { setYil(y); setSinav(null) }}
                   className={butonClass}
                   style={{
                     background: yil === y ? t.accent : t.bg2,
                     color: yil === y ? '#F8E8FF' : t.dim,
                     border: `1px solid ${yil === y ? t.accent2 : t.border}`,
                     boxShadow: yil === y ? `0 4px 12px ${t.accent}40` : 'none'
                   }}>{y}</button>
               ))}
             </div>
           </motion.div>
         )}

         {/* Sınav */}
         {yil && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>Sınav</span>
             <div className="flex gap-2 flex-wrap">
               {sinavlar.map(s => (
                 <button key={s} onClick={() => setSinav(s)}
                   className={butonClass}
                   style={{
                     background: sinav === s ? t.accent : t.bg2,
                     color: sinav === s ? '#F8E8FF' : t.dim,
                     border: `1px solid ${sinav === s ? t.accent2 : t.border}`,
                     boxShadow: sinav === s ? `0 4px 12px ${t.accent}40` : 'none'
                   }}>{s}</button>
               ))}
             </div>
           </motion.div>
         )}

         {/* Başla — telefonda */}
         {sinav && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-auto flex flex-col gap-3 md:hidden">
             <p className="text-center text-sm font-display" style={{ color: t.dim }}>
               {sayi} soru · Cevaplar sınav sonunda gösterilir
             </p>
             <motion.button whileTap={{ scale: 0.98 }} onClick={basla} disabled={sayi === 0}
               className="w-full rounded-2xl px-5 font-display font-semibold flex items-center justify-between disabled:opacity-40"
               style={{
                 background: `linear-gradient(135deg, ${t.accent}, #501878)`,
                 color: '#F8E8FF',
                 boxShadow: `0 6px 20px ${t.accent}40`,
                 paddingTop: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 paddingBottom: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 fontSize: ayarlar.butonBoyutu === 'kucuk' ? 13 : ayarlar.butonBoyutu === 'buyuk' ? 17 : 15,
               }}>
               Simülasyona Başla <span>→</span>
             </motion.button>
           </motion.div>
         )}
       </main>

       {/* Sağ panel — md+ */}
       <aside className="hidden md:flex flex-col flex-1 px-8 py-6 gap-5 overflow-y-auto">
         {!sinav ? (
           <>
             {/* Tüm arşiv listesi */}
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
               Tüm Arşiv
             </span>
             <div className="flex flex-col gap-2">
               {arsiv.map(([key, val]) => (
                 <button key={key}
                   onClick={() => {
                     setDonem(val.donem)
                     setYil(val.yil)
                     setSinav(val.sinav)
                   }}
                   className="flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left"
                   style={{ background: t.bg2, border: `1px solid ${t.border}` }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = `${t.accent}10` }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bg2 }}>
                   <div>
                     <p className="font-display text-sm font-semibold" style={{ color: t.text }}>{key}</p>
                     <p className="text-xs mt-0.5" style={{ color: t.dim }}>{val.sayi} soru</p>
                   </div>
                   <span style={{ color: t.accent }}>→</span>
                 </button>
               ))}
             </div>
           </>
         ) : (
           <>
             {/* Seçim özeti + başla */}
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
               Seçim Özeti
             </span>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Dönem', val: donemler.find(d => d.id === donem)?.ad },
                 { label: 'Yıl', val: yil },
                 { label: 'Sınav', val: sinav },
                 { label: 'Soru', val: `${sayi} soru` },
               ].map(({ label, val }) => (
                 <div key={label} className="flex flex-col gap-1 rounded-xl px-4 py-3"
                   style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
                   <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
                   <span className="font-display text-sm font-semibold" style={{ color: t.text }}>{val}</span>
                 </div>
               ))}
             </div>

             <div className="rounded-xl px-4 py-3"
               style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}30` }}>
               <p className="text-xs leading-relaxed" style={{ color: t.dim }}>
                 Simülasyon modunda cevaplar sınav sonunda gösterilir. Gerçek sınav koşullarını simüle eder.
               </p>
             </div>

             <motion.button whileTap={{ scale: 0.98 }} onClick={basla} disabled={sayi === 0}
               className="w-full rounded-2xl px-5 font-display font-semibold flex items-center justify-between disabled:opacity-40 mt-auto"
               style={{
                 background: `linear-gradient(135deg, ${t.accent}, #501878)`,
                 color: '#F8E8FF',
                 boxShadow: `0 6px 20px ${t.accent}40`,
                 paddingTop: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 paddingBottom: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 fontSize: ayarlar.butonBoyutu === 'kucuk' ? 13 : ayarlar.butonBoyutu === 'buyuk' ? 17 : 15,
               }}>
               Simülasyona Başla
               <span className="text-sm opacity-70">Enter ↵</span>
             </motion.button>
           </>
         )}
       </aside>
     </div>
   </motion.div>
 )
}
