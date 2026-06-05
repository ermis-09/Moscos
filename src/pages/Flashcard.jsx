import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useMemo, useEffect } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'

function karistir(arr) {
 const a = [...arr]
 for (let i = a.length - 1; i > 0; i--) {
   const j = Math.floor(Math.random() * (i + 1));
   [a[i], a[j]] = [a[j], a[i]]
 }
 return a
}

export default function Flashcard() {
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const t = temaAl('flash', ayarlar)
 const navigate = useNavigate()
 const location = useLocation()
 const { donem, kurulId, ders, kartSayisi, siralama } = location.state || {}
 const flashcardlar = useMoscosStore(s => s.flashcardlar)

 const kartlar = useMemo(() => {
   let liste = flashcardlar.filter(f => {
     if (f.donem !== donem) return false
     if (f.kurulId !== kurulId) return false
     if (ders && f.ders !== ders) return false
     return true
   })
   if (siralama === 'karisik') liste = karistir(liste)
   if (kartSayisi && kartSayisi > 0) liste = liste.slice(0, kartSayisi)
   return liste
 }, [])

 const [index, setIndex] = useState(0)
 const [cevrildimi, setCevrildimi] = useState(false)
 const [stats, setStats] = useState({ kolay: 0, zor: 0, atla: 0 })
 const [bitti, setBitti] = useState(false)
 const [swipeDir, setSwipeDir] = useState(null)

 const startX = useRef(0)
 const startY = useRef(0)
 const isDragging = useRef(false)
 const cardRef = useRef(null)
 const listeRef = useRef(null)

 useEffect(() => {
   function handleKey(e) {
     if (bitti) return
     if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCevrildimi(f => !f) }
     else if (e.key === 'ArrowRight') swipeYap('kolay')
     else if (e.key === 'ArrowLeft') swipeYap('zor')
     else if (e.key === 'ArrowUp') swipeYap('atla')
   }
   window.addEventListener('keydown', handleKey)
   return () => window.removeEventListener('keydown', handleKey)
 }, [index, bitti])

 if (!kartlar.length) {
   return (
     <div className="w-full mx-auto flex flex-col items-center justify-center gap-4"
       style={{ height: '100dvh', background: t.bg, color: t.dim }}>
       <p className="font-display text-lg">Bu seçimde kart yok.</p>
       <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-display text-sm font-semibold"
         style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>Geri Dön</button>
     </div>
   )
 }

 const kart = kartlar[index]
 const progress = ((index + 1) / kartlar.length) * 100
 const kalanKart = kartlar.length - index - 1

 function swipeYap(yon) {
   setStats(s => ({ ...s, [yon]: s[yon] + 1 }))
   setSwipeDir(yon)
   setTimeout(() => {
     setSwipeDir(null)
     setCevrildimi(false)
     if (index + 1 >= kartlar.length) {
       const sonDesteler = JSON.parse(localStorage.getItem('sonDesteler') || '[]')
       const yeniDeste = { donem, kurulId, ders: ders || null, kartSayisi: kartlar.length, siralama: siralama || 'karisik', tarih: new Date().toISOString() }
       const filtrelenmis = sonDesteler.filter(d => !(d.donem === yeniDeste.donem && d.kurulId === yeniDeste.kurulId && d.ders === yeniDeste.ders))
       localStorage.setItem('sonDesteler', JSON.stringify([yeniDeste, ...filtrelenmis].slice(0, 5)))
       setBitti(true)
     } else {
       const yeniIndex = index + 1
       setIndex(yeniIndex)
       // Listeyi otomatik scroll
       setTimeout(() => {
         const el = listeRef.current?.querySelector(`[data-idx="${yeniIndex}"]`)
         el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
       }, 50)
     }
   }, 350)
 }

 function onTouchStart(e) { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; isDragging.current = false }
 function onTouchMove(e) {
   const dx = e.touches[0].clientX - startX.current
   const dy = e.touches[0].clientY - startY.current
   if (!isDragging.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) isDragging.current = true
   if (!isDragging.current || !cardRef.current) return
   cardRef.current.style.transform = `translateX(${dx}px) translateY(${dy * 0.2}px) rotate(${dx * 0.06}deg)`
   if (Math.abs(dy) > Math.abs(dx) && dy < -30) cardRef.current.style.borderColor = '#6080C4'
   else if (dx > 40) cardRef.current.style.borderColor = '#2E8B57'
   else if (dx < -40) cardRef.current.style.borderColor = '#8B3A3A'
   else cardRef.current.style.borderColor = t.border
 }
 function onTouchEnd(e) {
   if (!isDragging.current) return
   isDragging.current = false
   const dx = e.changedTouches[0].clientX - startX.current
   const dy = e.changedTouches[0].clientY - startY.current
   if (cardRef.current) { cardRef.current.style.transform = ''; cardRef.current.style.borderColor = t.border }
   if (Math.abs(dy) > Math.abs(dx) && dy < -80) swipeYap('atla')
   else if (dx > 80) swipeYap('kolay')
   else if (dx < -80) swipeYap('zor')
 }

 const swipeColor = swipeDir === 'kolay' ? '#2E8B57' : swipeDir === 'zor' ? '#8B3A3A' : swipeDir === 'atla' ? '#6080C4' : null

 if (bitti) {
   return (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
       className="w-full mx-auto flex relative overflow-hidden"
       style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text }}>
       <div className="absolute inset-0 pointer-events-none" style={{
         backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
       }} />
       <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 md:border-r md:max-w-md" style={{ borderColor: t.border }}>
         <div className="font-display text-5xl font-bold" style={{ color: t.accent2 }}>✦</div>
         <h2 className="font-display text-3xl font-bold" style={{ color: t.text, letterSpacing: '-0.02em' }}>Tamamlandı!</h2>
         <p className="text-sm" style={{ color: t.dim }}>{kartlar.length} kart çalışıldı</p>
         <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
           {[{ num: stats.kolay, label: 'Kolay', color: '#70D090' }, { num: stats.atla, label: 'Atla', color: '#6080C4' }, { num: stats.zor, label: 'Zor', color: '#E08080' }].map(({ num, label, color }) => (
             <div key={label} className="flex flex-col items-center gap-1.5 py-4 rounded-2xl"
               style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
               <span className="font-display text-3xl font-bold leading-none" style={{ color }}>{num}</span>
               <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
             </div>
           ))}
         </div>
         <div className="flex flex-col gap-2.5 w-full max-w-sm mt-2">
           <motion.button whileTap={{ scale: 0.98 }}
             onClick={() => { setIndex(0); setCevrildimi(false); setStats({ kolay: 0, zor: 0, atla: 0 }); setBitti(false) }}
             className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
             style={{ background: `linear-gradient(135deg, ${t.accent}, #1A5030)`, color: '#E8FFF0' }}>Tekrar Çalış</motion.button>
           <button onClick={() => navigate('/')} className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
             style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>Ana Sayfa</button>
         </div>
       </div>
       <div className="hidden md:flex flex-1 flex-col items-center justify-center px-8 gap-6">
         <span className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t.accent }}>Oturum Özeti</span>
         <div className="w-full max-w-xs flex flex-col gap-4">
           {[{ num: stats.kolay, label: 'Kolay', color: '#70D090', icon: '→' }, { num: stats.atla, label: 'Atla', color: '#6080C4', icon: '↑' }, { num: stats.zor, label: 'Zor', color: '#E08080', icon: '←' }].map(({ num, label, color, icon }) => {
             const yuzde = kartlar.length > 0 ? Math.round((num / kartlar.length) * 100) : 0
             return (
               <div key={label} className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-baseline">
                   <span className="text-sm font-display font-semibold" style={{ color }}>{icon} {label}</span>
                   <span className="text-sm font-display font-bold" style={{ color }}>{num} kart · %{yuzde}</span>
                 </div>
                 <div className="h-2 rounded-full overflow-hidden" style={{ background: `${color}20` }}>
                   <motion.div className="h-full rounded-full" style={{ background: color }}
                     initial={{ width: 0 }} animate={{ width: `${yuzde}%` }} transition={{ duration: 0.8 }} />
                 </div>
               </div>
             )
           })}
         </div>
         <div className="w-full max-w-xs flex flex-col gap-2 mt-4">
           <motion.button whileTap={{ scale: 0.98 }}
             onClick={() => { setIndex(0); setCevrildimi(false); setStats({ kolay: 0, zor: 0, atla: 0 }); setBitti(false) }}
             className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
             style={{ background: `linear-gradient(135deg, ${t.accent}, #1A5030)`, color: '#E8FFF0' }}>Tekrar Çalış</motion.button>
           <button onClick={() => navigate('/flashcard/filtre')} className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
             style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>Farklı Deste</button>
         </div>
       </div>
     </motion.div>
   )
 }

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

     {/* ── TELEFON layout ── */}
     <div className="flex flex-col h-full md:hidden">
       <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 border-b" style={{ borderColor: t.border }}>
         <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
         <div className="flex-1 flex flex-col gap-1.5">
           <span className="font-display text-xs font-semibold" style={{ color: t.text }}>{index + 1} / {kartlar.length}</span>
           <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
             <motion.div className="h-full rounded-full" style={{ background: t.accent }}
               animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
           </div>
         </div>
       </header>
       <main className="flex-1 flex flex-col items-center justify-center px-5 gap-4 relative z-10">
         <div className="relative w-full" style={{ maxWidth: 320 }}>
           <div className="absolute inset-0 rounded-2xl" style={{ background: t.bg2, border: `1px solid ${t.border}`, transform: 'rotate(-3deg) translateY(8px)', opacity: 0.4 }} />
           <div className="absolute inset-0 rounded-2xl" style={{ background: t.bg2, border: `1px solid ${t.border}`, transform: 'rotate(2deg) translateY(5px)', opacity: 0.6 }} />
           <AnimatePresence mode="wait">
             <motion.div key={index} ref={cardRef}
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1, x: swipeDir === 'kolay' ? 400 : swipeDir === 'zor' ? -400 : 0, y: swipeDir === 'atla' ? -400 : 0, rotate: swipeDir === 'kolay' ? 20 : swipeDir === 'zor' ? -20 : 0 }}
               transition={{ duration: swipeDir ? 0.35 : 0.3 }}
               onClick={() => { if (!isDragging.current) setCevrildimi(f => !f) }}
               onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
               className="relative w-full rounded-2xl cursor-pointer select-none"
               style={{ height: 340, background: swipeColor ? `${swipeColor}15` : t.bg2, border: `1.5px solid ${swipeColor || t.border}`, boxShadow: swipeColor ? `0 0 30px ${swipeColor}30` : '0 20px 60px rgba(0,0,0,0.4)', perspective: 1200, transition: swipeDir ? 'all 0.35s ease' : 'border-color 0.2s, background 0.2s' }}>
               <div className="w-full h-full" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)', transform: cevrildimi ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                 <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-7 gap-4" style={{ backfaceVisibility: 'hidden' }}>
                   <span className="absolute top-4 left-5 text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>KAVRAM</span>
                   <p className="font-display text-xl font-semibold text-center leading-snug" style={{ color: t.text, letterSpacing: '-0.01em' }}>{kart.onYuz}</p>
                   <span className="absolute bottom-4 text-[10px] italic" style={{ color: `${t.dim}60` }}>dokunarak çevir</span>
                 </div>
                 <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-7 gap-4"
                   style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: t.bg3, border: `1.5px solid ${t.accent}` }}>
                   <span className="absolute top-4 left-5 text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent2 }}>AÇIKLAMA</span>
                   <p className="font-display text-base font-medium text-center leading-relaxed" style={{ color: t.text }}>{kart.arkaYuz}</p>
                 </div>
               </div>
             </motion.div>
           </AnimatePresence>
         </div>
         {cevrildimi && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6">
             <span className="text-xs font-bold font-display" style={{ color: '#E08080' }}>← Zor</span>
             <span className="text-xs font-bold font-display" style={{ color: '#6080C4' }}>↑ Atla</span>
             <span className="text-xs font-bold font-display" style={{ color: '#70D090' }}>Kolay →</span>
           </motion.div>
         )}
       </main>
       <footer className="flex justify-center gap-5 px-5 pb-6 flex-shrink-0">
         <span className="font-display text-sm font-semibold" style={{ color: '#70D090' }}>{stats.kolay} Kolay</span>
         <span className="font-display text-sm font-semibold" style={{ color: '#6080C4' }}>{stats.atla} Atla</span>
         <span className="font-display text-sm font-semibold" style={{ color: '#E08080' }}>{stats.zor} Zor</span>
       </footer>
     </div>

     {/* ── TABLET layout ── */}
     <div className="hidden md:flex flex-col h-full relative">

       {/* Header */}
       <header className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0 relative z-10">
         <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
         {/* Progress bar ortada */}
         <div className="flex-1 mx-8 flex flex-col gap-1.5">
           <div className="flex justify-between">
             <span className="font-display text-xs font-semibold" style={{ color: t.text }}>{index + 1} / {kartlar.length}</span>
             <span className="text-xs font-display" style={{ color: t.dim }}>{kalanKart} kart kaldı</span>
           </div>
           <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
             <motion.div className="h-full rounded-full" style={{ background: t.accent }}
               animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
           </div>
         </div>
         {/* Klavye ipucu */}
         <div className="flex items-center gap-3">
           {[['Space', 'çevir'], ['←', 'zor'], ['↑', 'atla'], ['→', 'kolay']].map(([key, label]) => (
             <div key={key} className="flex items-center gap-1">
               <span className="px-2 py-1 rounded-md font-display text-[10px] font-bold"
                 style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.accent }}>{key}</span>
               <span className="text-[9px]" style={{ color: t.dim }}>{label}</span>
             </div>
           ))}
         </div>
       </header>

       {/* Ana alan — kart ortada */}
       <div className="flex-1 flex items-center justify-center relative px-8 pb-6">

         {/* Sol alt köşe — istatistikler */}
         <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-10">
           {[
             { num: stats.kolay, label: 'Kolay', color: '#70D090', key: '→' },
             { num: stats.atla, label: 'Atla', color: '#6080C4', key: '↑' },
             { num: stats.zor, label: 'Zor', color: '#E08080', key: '←' },
           ].map(({ num, label, color }) => (
             <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
               style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
               <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
               <span className="font-display text-sm font-semibold w-5 text-right" style={{ color }}>{num}</span>
               <span className="text-xs font-display" style={{ color: t.dim }}>{label}</span>
             </div>
           ))}
         </div>

         {/* Merkez — büyük kart */}
         <div className="relative" style={{ width: 'min(480px, 60vw)' }}>
           {/* Arka kartlar */}
           <div className="absolute inset-0 rounded-3xl" style={{ background: t.bg2, border: `1px solid ${t.border}`, transform: 'rotate(-2deg) translateY(12px)', opacity: 0.35 }} />
           <div className="absolute inset-0 rounded-3xl" style={{ background: t.bg2, border: `1px solid ${t.border}`, transform: 'rotate(1.5deg) translateY(8px)', opacity: 0.55 }} />

           <AnimatePresence mode="wait">
             <motion.div key={index} ref={cardRef}
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1, x: swipeDir === 'kolay' ? 600 : swipeDir === 'zor' ? -600 : 0, y: swipeDir === 'atla' ? -600 : 0, rotate: swipeDir === 'kolay' ? 15 : swipeDir === 'zor' ? -15 : 0 }}
               transition={{ duration: swipeDir ? 0.35 : 0.3 }}
               onClick={() => { if (!isDragging.current) setCevrildimi(f => !f) }}
               onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
               className="relative w-full rounded-3xl cursor-pointer select-none"
               style={{
                 height: 'min(420px, 50vh)',
                 background: swipeColor ? `${swipeColor}15` : t.bg2,
                 border: `2px solid ${swipeColor || t.border}`,
                 boxShadow: swipeColor ? `0 0 40px ${swipeColor}30` : '0 24px 80px rgba(0,0,0,0.5)',
                 perspective: 1200,
                 transition: swipeDir ? 'all 0.35s ease' : 'border-color 0.2s, background 0.2s',
               }}>
               {/* Swipe gösterge okları */}
               <AnimatePresence>
                 {swipeColor && (
                   <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 flex items-center justify-center rounded-3xl z-10 pointer-events-none"
                     style={{ background: `${swipeColor}20` }}>
                     <span className="font-display text-6xl font-bold" style={{ color: swipeColor }}>
                       {swipeDir === 'kolay' ? '→' : swipeDir === 'zor' ? '←' : '↑'}
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="w-full h-full" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)', transform: cevrildimi ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                 {/* Ön yüz */}
                 <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-10 gap-4" style={{ backfaceVisibility: 'hidden' }}>
                   <span className="absolute top-6 left-7 text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>KAVRAM</span>
                   <p className="font-display text-2xl font-semibold text-center leading-snug"
                     style={{ color: t.text, letterSpacing: '-0.01em' }}>{kart.onYuz}</p>
                   <div className="absolute bottom-6 flex items-center gap-2">
                     <span className="text-[10px] italic" style={{ color: `${t.dim}60` }}>Space veya tıkla →</span>
                   </div>
                 </div>
                 {/* Arka yüz */}
                 <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-10 gap-4"
                   style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: t.bg3, border: `2px solid ${t.accent}` }}>
                   <span className="absolute top-6 left-7 text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent2 }}>AÇIKLAMA</span>
                   <p className="font-display text-lg font-medium text-center leading-relaxed" style={{ color: t.text }}>{kart.arkaYuz}</p>
                   {cevrildimi && (
                     <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                       className="absolute bottom-6 flex gap-6">
                       <span className="text-xs font-bold font-display" style={{ color: '#E08080' }}>← Zor</span>
                       <span className="text-xs font-bold font-display" style={{ color: '#6080C4' }}>↑ Atla</span>
                       <span className="text-xs font-bold font-display" style={{ color: '#70D090' }}>Kolay →</span>
                     </motion.div>
                   )}
                 </div>
               </div>
             </motion.div>
           </AnimatePresence>
         </div>

         {/* Sağ üst köşe — deste listesi */}
         <div className="absolute top-0 right-8 w-56 flex flex-col gap-1 z-10"
           style={{ maxHeight: 'calc(100% - 32px)', overflow: 'hidden' }}>
           <div className="flex items-center justify-between mb-1">
             <span className="font-display text-[9px] font-semibold tracking-widest uppercase" style={{ color: t.accent }}>
               Deste
             </span>
             <span className="text-[9px]" style={{ color: t.dim }}>{kartlar.length} kart</span>
           </div>
           <div ref={listeRef} className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
             {kartlar.map((k, i) => {
               const aktif = i === index
               const gecti = i < index
               return (
                 <button key={i} data-idx={i}
                   onClick={() => { setIndex(i); setCevrildimi(false) }}
                   className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all"
                   style={{
                     background: aktif ? `${t.accent}20` : 'transparent',
                     border: `1px solid ${aktif ? t.accent : 'transparent'}`,
                     opacity: gecti ? 0.35 : 1,
                   }}>
                   <span className="font-display text-[10px] font-bold flex-shrink-0 w-4 text-right"
                     style={{ color: aktif ? t.accent2 : `${t.dim}50` }}>{i + 1}</span>
                   <p className="text-[11px] font-display font-medium truncate flex-1"
                     style={{ color: aktif ? t.text : t.dim }}>{k.onYuz}</p>
                   {gecti && <span style={{ color: '#70D090', fontSize: 9 }}>✓</span>}
                 </button>
               )
             })}
           </div>
         </div>
       </div>
     </div>
   </motion.div>
 )
}
