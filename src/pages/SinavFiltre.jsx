import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'

export default function SinavFiltre() {
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const t = temaAl('sinav', ayarlar)
 const navigate = useNavigate()
 const sorular = useMoscosStore(s => s.sorular)
 const kurullarData = useMoscosStore(s => s.kurullarData)
 const setSecim = useMoscosStore(s => s.setSecim)
 const sinavBaslat = useMoscosStore(s => s.sinavBaslat)
 const anaSayfaIndex = useMoscosStore(s => s.anaSayfaIndex)

 const [donem, setDonem] = useState(null)
 const [kurulId, setKurulId] = useState(null)
 const [ders, setDers] = useState(null)
 const [soruSayisi, setSoruSayisi] = useState('')

 const donemler = kurullarData?.donemler.filter(d =>
   sorular.some(s => s.donem === d.id)
 ) || []

 const kurullar = donem
   ? (kurullarData?.donemler.find(d => d.id === donem)?.kurullar || [])
       .filter(k => sorular.some(s => s.donem === donem && s.kurulId === k.id))
   : []

 const dersler = (donem && kurulId)
   ? [...new Set(sorular.filter(s => s.donem === donem && s.kurulId === kurulId).map(s => s.ders))]
   : []

 const uygunSayisi = sorular.filter(s => {
   if (s.donem !== donem) return false
   if (s.kurulId !== kurulId) return false
   if (ders && s.ders !== ders) return false
   return true
 }).length

 // Klavye kısayolları
 useEffect(() => {
   function handleKey(e) {
     if (e.key === 'Enter' && kurulId && uygunSayisi > 0) basla()
   }
   window.addEventListener('keydown', handleKey)
   return () => window.removeEventListener('keydown', handleKey)
 }, [kurulId, uygunSayisi, donem, ders, soruSayisi])

 function basla() {
   let uygun = sorular.filter(s => {
     if (s.donem !== donem) return false
     if (s.kurulId !== kurulId) return false
     if (ders && s.ders !== ders) return false
     return true
   })
   uygun = [...uygun].sort(() => Math.random() - 0.5)
   if (soruSayisi && soruSayisi > 0) uygun = uygun.slice(0, soruSayisi)
   setSecim('donem', donem)
   setSecim('kurulId', kurulId)
   setSecim('ders', ders)
   sinavBaslat(uygun, 'sinav')
   navigate('/sinav/coz')
 }

 const butonClass = `rounded-xl font-display font-semibold transition-all ${
   ayarlar.butonBoyutu === 'kucuk' ? 'px-3 py-2 text-xs' :
   ayarlar.butonBoyutu === 'buyuk' ? 'px-5 py-3 text-base' :
   'px-4 py-2.5 text-sm'
 }`

 return (
   <motion.div
     initial={{ x: '100%', opacity: 0 }}
     animate={{ x: 0, opacity: 1 }}
     exit={{ x: '100%', opacity: 0 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
     className="w-full mx-auto flex flex-col relative overflow-hidden"
     style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text }}
   >
     {/* Izgara */}
     <div className="absolute inset-0 pointer-events-none" style={{
       backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
     }} />

     <svg className="absolute inset-0 pointer-events-none w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="none">
       <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(58,124,200,0.1)" strokeWidth="1"/>
       <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(58,124,200,0.1)" strokeWidth="1"/>
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

     {/* Header */}
     <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10 border-b"
       style={{ borderColor: t.border }}>
       <button onClick={() => { sessionStorage.setItem('anaIndex', anaSayfaIndex); navigate('/') }}
         className="w-9 h-9 rounded-full flex items-center justify-center"
         style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
       <span className="font-display text-base font-semibold" style={{ color: t.text }}>Sınav Filtresi</span>
       <div className="w-9">
         {kurulId && uygunSayisi > 0 && (
           <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>
             Enter ↵
           </span>
         )}
       </div>
     </header>

     {/* İçerik — geniş ekranda iki kolon */}
     <div className="flex-1 flex overflow-hidden relative z-10">

       {/* Sol panel — filtreler */}
       <main className="flex-1 px-5 pb-6 flex flex-col gap-5 overflow-y-auto md:border-r md:max-w-md"
         style={{ borderColor: t.border }}>

         {/* Dönem */}
         <div className="flex flex-col gap-3 pt-4">
           <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>
             Dönem
           </span>
           <div className="flex gap-2 flex-wrap">
             {donemler.map(d => (
               <button key={d.id}
                 onClick={() => { setDonem(d.id); setKurulId(null); setDers(null) }}
                 className={butonClass}
                 style={{
                   background: donem === d.id ? t.accent : t.bg2,
                   color: donem === d.id ? '#E8F4FF' : t.dim,
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
                   className={butonClass}
                   style={{
                     background: kurulId === k.id ? t.accent : t.bg2,
                     color: kurulId === k.id ? '#E8F4FF' : t.dim,
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
               <button onClick={() => setDers(null)} className={butonClass}
                 style={{
                   background: ders === null ? t.accent : t.bg2,
                   color: ders === null ? '#E8F4FF' : t.dim,
                   border: `1px solid ${ders === null ? t.accent2 : t.border}`,
                 }}>Tümü</button>
               {dersler.map(d => (
                 <button key={d} onClick={() => setDers(d)} className={butonClass}
                   style={{
                     background: ders === d ? t.accent : t.bg2,
                     color: ders === d ? '#E8F4FF' : t.dim,
                     border: `1px solid ${ders === d ? t.accent2 : t.border}`,
                   }}>{d}</button>
               ))}
             </div>
           </motion.div>
         )}

         {/* Soru sayısı + başla — telefonda burada */}
         {kurulId && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
             className="mt-auto flex flex-col gap-3 md:hidden">
             <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase"
               style={{ color: t.accent }}>Soru Sayısı</span>
             <div className="flex gap-2">
               {[5, 10, 25, 50].map(n => (
                 <button key={n} onClick={() => setSoruSayisi(soruSayisi === n ? '' : n)}
                   className="flex-1 py-3 rounded-xl font-display text-sm font-semibold transition-all"
                   style={{
                     background: soruSayisi === n ? t.accent : t.bg2,
                     color: soruSayisi === n ? '#E8F4FF' : t.dim,
                     border: `1.5px solid ${soruSayisi === n ? t.accent2 : t.border}`,
                   }}>{n}</button>
               ))}
             </div>
             <div className="relative rounded-2xl overflow-hidden"
               style={{ background: `${t.accent}15`, border: `1.5px solid ${t.accent}50` }}>
               <input type="number" value={soruSayisi || ''}
                 onChange={e => setSoruSayisi(e.target.value ? parseInt(e.target.value) : '')}
                 onKeyDown={e => e.key === 'Enter' && uygunSayisi > 0 && basla()}
                 placeholder={`Tümü  (${uygunSayisi} soru)`}
                 className="w-full px-5 py-4 font-display text-[15px] font-semibold bg-transparent outline-none text-center"
                 style={{ color: soruSayisi ? t.accent2 : t.dim }} />
               <span className="absolute right-5 top-1/2 -translate-y-1/2 font-display text-sm"
                 style={{ color: `${t.accent}80` }}>/{uygunSayisi}</span>
             </div>
             <motion.button whileTap={{ scale: 0.98 }} onClick={basla} disabled={uygunSayisi === 0}
               className="w-full rounded-2xl px-5 font-display font-semibold flex items-center justify-between disabled:opacity-40"
               style={{
                 background: `linear-gradient(135deg, ${t.accent}, #204878)`,
                 color: '#E8F4FF',
                 boxShadow: `0 6px 20px ${t.accent}40`,
                 paddingTop: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 paddingBottom: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 fontSize: ayarlar.butonBoyutu === 'kucuk' ? 13 : ayarlar.butonBoyutu === 'buyuk' ? 17 : 15,
               }}>
               Sınava Başla <span>→</span>
             </motion.button>
           </motion.div>
         )}
       </main>

       {/* Sağ panel — sadece md+ ekranlarda */}
       <aside className="hidden md:flex flex-col flex-1 px-8 py-6 gap-6 overflow-y-auto">
         {!kurulId ? (
           <div className="flex-1 flex flex-col items-center justify-center gap-3">
             <div className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{ background: `${t.accent}15`, border: `1px solid ${t.border}` }}>
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5">
                 <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
               </svg>
             </div>
             <p className="font-display text-sm font-semibold text-center" style={{ color: t.dim }}>
               Dönem ve kurul seçerek başla
             </p>
           </div>
         ) : (
           <>
             {/* Özet */}
             <div className="rounded-2xl p-5 flex flex-col gap-4"
               style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
               <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase"
                 style={{ color: t.accent }}>Seçim Özeti</span>
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: 'Dönem', val: donemler.find(d => d.id === donem)?.ad },
                   { label: 'Kurul', val: kurullar.find(k => k.id === kurulId)?.ad },
                   { label: 'Ders', val: ders || 'Tümü' },
                   { label: 'Toplam', val: `${uygunSayisi} soru` },
                 ].map(({ label, val }) => (
                   <div key={label} className="flex flex-col gap-1 rounded-xl px-4 py-3"
                     style={{ background: t.bg3, border: `1px solid ${t.border}` }}>
                     <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
                     <span className="font-display text-sm font-semibold" style={{ color: t.text }}>{val}</span>
                   </div>
                 ))}
               </div>
             </div>

             {/* Soru sayısı */}
             <div className="flex flex-col gap-3">
               <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase"
                 style={{ color: t.accent }}>Soru Sayısı</span>
               <div className="flex gap-2">
                 {[5, 10, 25, 50].map(n => (
                   <button key={n} onClick={() => setSoruSayisi(soruSayisi === n ? '' : n)}
                     className="flex-1 py-3 rounded-xl font-display text-sm font-semibold transition-all"
                     style={{
                       background: soruSayisi === n ? t.accent : t.bg2,
                       color: soruSayisi === n ? '#E8F4FF' : t.dim,
                       border: `1.5px solid ${soruSayisi === n ? t.accent2 : t.border}`,
                     }}>{n}</button>
                 ))}
               </div>
               <div className="relative rounded-2xl overflow-hidden"
                 style={{ background: `${t.accent}15`, border: `1.5px solid ${t.accent}50` }}>
                 <input type="number" value={soruSayisi || ''}
                   onChange={e => setSoruSayisi(e.target.value ? parseInt(e.target.value) : '')}
                   onKeyDown={e => e.key === 'Enter' && uygunSayisi > 0 && basla()}
                   placeholder={`Tümü  (${uygunSayisi} soru)`}
                   className="w-full px-5 py-4 font-display text-[15px] font-semibold bg-transparent outline-none text-center"
                   style={{ color: soruSayisi ? t.accent2 : t.dim }} />
                 <span className="absolute right-5 top-1/2 -translate-y-1/2 font-display text-sm"
                   style={{ color: `${t.accent}80` }}>/{uygunSayisi}</span>
               </div>
             </div>

             {/* Başla */}
             <motion.button whileTap={{ scale: 0.98 }} onClick={basla} disabled={uygunSayisi === 0}
               className="w-full rounded-2xl px-5 font-display font-semibold flex items-center justify-between disabled:opacity-40 mt-auto"
               style={{
                 background: `linear-gradient(135deg, ${t.accent}, #204878)`,
                 color: '#E8F4FF',
                 boxShadow: `0 6px 20px ${t.accent}40`,
                 paddingTop: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 paddingBottom: ayarlar.butonBoyutu === 'kucuk' ? 10 : ayarlar.butonBoyutu === 'buyuk' ? 16 : 14,
                 fontSize: ayarlar.butonBoyutu === 'kucuk' ? 13 : ayarlar.butonBoyutu === 'buyuk' ? 17 : 15,
               }}>
               Sınava Başla
               <span className="text-sm opacity-70">Enter ↵</span>
             </motion.button>
           </>
         )}
       </aside>
     </div>
   </motion.div>
 )
}
