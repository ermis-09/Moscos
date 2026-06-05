import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import Modal from '../components/Modal'

export default function SinavCoz() {
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const navigate = useNavigate()
 const aktivSinav = useMoscosStore(s => s.aktivSinav)
 const cevapVer = useMoscosStore(s => s.cevapVer)
 const aktifIndexGuncelle = useMoscosStore(s => s.aktifIndexGuncelle)
 const sinavTamamla = useMoscosStore(s => s.sinavTamamla)
 const kullanici = useMoscosStore(s => s.kullanici)
 const secim = useMoscosStore(s => s.secim)

 const t = temaAl(aktivSinav.mod === 'simulasyon' ? 'sim' : 'sinav', ayarlar)

 const [aktifIndex, setAktifIndex] = useState(aktivSinav.aktifIndex || 0)
 const [optikAcik, setOptikAcik] = useState(false)
 const [cikisModalAcik, setCikisModalAcik] = useState(false)

 const { sorular, cevaplar, mod } = aktivSinav

 if (!sorular.length) {
   navigate('/')
   return null
 }

 const soru = sorular[aktifIndex]
 const kullaniciCevap = cevaplar[aktifIndex]
 const sonSoru = aktifIndex === sorular.length - 1
 const harfler = ['A', 'B', 'C', 'D', 'E']
 const progress = ((aktifIndex + 1) / sorular.length) * 100

 function cevapla(harf) {
  if (kullaniciCevap && mod !== 'simulasyon') return
  cevapVer(aktifIndex, harf)
}
 function ileri() {
   if (sonSoru) bitir()
   else {
     const yeni = aktifIndex + 1
     setAktifIndex(yeni)
     aktifIndexGuncelle(yeni)
   }
 }

 function geri() {
   if (aktifIndex > 0) {
     const yeni = aktifIndex - 1
     setAktifIndex(yeni)
     aktifIndexGuncelle(yeni)
   }
 }

 // Klavye kısayolları
 useEffect(() => {
   function handleKey(e) {
     if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
     if (e.key === 'ArrowRight') ileri()
     else if (e.key === 'ArrowLeft') geri()
     else if (['a','b','c','d','e'].includes(e.key.toLowerCase())) {
       cevapla(e.key.toUpperCase())
     }
   }
   window.addEventListener('keydown', handleKey)
   return () => window.removeEventListener('keydown', handleKey)
 }, [aktifIndex, kullaniciCevap])

 async function kaydetVeCik() {
   if (kullanici) {
     try {
       const soruIdleri = sorular.map(s => s.id)
       await setDoc(doc(db, 'kullanici_aktif_sinav', kullanici.uid), {
         soruIdleri, cevaplar, mod, aktifIndex, secim,
         tarih: new Date().toISOString(),
       })
     } catch (err) { console.error('kaydetme hatası:', err) }
   }
   setCikisModalAcik(false)
   navigate('/')
 }

 async function kaydetmeyeCik() {
   if (kullanici) {
     try { await deleteDoc(doc(db, 'kullanici_aktif_sinav', kullanici.uid)) } catch {}
   }
   setCikisModalAcik(false)
   navigate('/')
 }

 function secenekStil(harf) {
   if (!kullaniciCevap) return {
     bg: t.bg2, border: t.border, text: t.text, letterBg: t.bg3, letterColor: t.accent
   }
   if (mod === 'simulasyon') {
     if (harf === kullaniciCevap) return { bg: `${t.accent}20`, border: t.accent, text: t.text, letterBg: t.accent, letterColor: '#F8E8FF' }
     return { bg: t.bg2, border: t.border, text: `${t.dim}80`, letterBg: t.bg3, letterColor: `${t.accent}60` }
   }
   if (harf === soru.dogruCevap) return { bg: 'rgba(46,139,87,0.2)', border: '#2E8B57', text: '#B8E0C8', letterBg: '#2E8B57', letterColor: 'white' }
   if (harf === kullaniciCevap) return { bg: 'rgba(139,58,58,0.2)', border: '#8B3A3A', text: '#E0B8B8', letterBg: '#8B3A3A', letterColor: 'white' }
   return { bg: t.bg2, border: t.border, text: `${t.dim}80`, letterBg: t.bg3, letterColor: `${t.accent}60` }
 }

 function optikRenk(i) {
   const c = cevaplar[i]
   if (!c) return { bg: t.bg3, border: t.border, color: t.dim }
   if (mod === 'simulasyon') return { bg: `${t.accent}30`, border: t.accent, color: t.accent2 }
   if (c === sorular[i].dogruCevap) return { bg: 'rgba(46,139,87,0.3)', border: '#2E8B57', color: '#70D090' }
   return { bg: 'rgba(139,58,58,0.3)', border: '#8B3A3A', color: '#E08080' }
 }

 async function bitir() {
   sinavTamamla()
   if (kullanici) {
     try { await deleteDoc(doc(db, 'kullanici_aktif_sinav', kullanici.uid)) } catch {}
   }
   if (mod === 'simulasyon') navigate('/simulasyon/sonuc')
   else navigate('/sinav/sonuc')
 }

 const gradientBg = `linear-gradient(135deg, ${t.accent}, ${mod === 'simulasyon' ? '#501878' : '#204878'})`
 const textColor = mod === 'simulasyon' ? '#F8E8FF' : '#E8F4FF'

 return (
   <motion.div
     initial={{ x: '100%', opacity: 0 }}
     animate={{ x: 0, opacity: 1 }}
     exit={{ x: '100%', opacity: 0 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
     className="w-full mx-auto flex relative overflow-hidden"
     style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text }}
   >
     <div className="absolute inset-0 pointer-events-none" style={{
       backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
     }} />

     {/* Sol / Ana panel */}
     <div className="flex-1 flex flex-col min-w-0 relative">
       <header className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 relative z-10 border-b"
         style={{ borderColor: t.border }}>
         <button onClick={() => setCikisModalAcik(true)}
           className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
         <div className="flex-1 flex flex-col gap-1.5">
           <span className="font-display text-xs font-semibold" style={{ color: t.text }}>
             {aktifIndex + 1} / {sorular.length}
           </span>
           <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}20` }}>
             <motion.div className="h-full rounded-full" style={{ background: t.accent }}
               animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
           </div>
         </div>
         {/* Optik butonu — sadece mobilde */}
         <button onClick={() => setOptikAcik(true)}
           className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 md:hidden"
           style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
             <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
           </svg>
         </button>
         {/* Klavye ipucu — sadece md+ */}
         <span className="hidden md:block text-[9px] font-display" style={{ color: t.dim }}>
           ← → A–E
         </span>
       </header>

       <main className="flex-1 px-5 py-4 flex flex-col gap-4 relative z-10 overflow-y-auto pb-24">
         <div className="flex items-center gap-2 flex-wrap">
           <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
             style={{ background: t.accent, color: textColor }}>{soru.ders}</span>
           {soru.ogrenimHedefi && (
             <span className="text-xs italic" style={{ color: t.dim }}>{soru.ogrenimHedefi}</span>
           )}
         </div>

         <AnimatePresence mode="wait">
           <motion.h2 key={aktifIndex}
             initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
             className="font-display text-lg font-medium leading-snug"
             style={{ color: t.text, letterSpacing: '-0.01em' }}>
             {soru.soru}
           </motion.h2>
         </AnimatePresence>

         <div className="flex flex-col gap-2">
           {harfler.map(harf => {
             const metin = soru.secenekler?.[harf]
             if (!metin) return null
             const s = secenekStil(harf)
             return (
               <motion.button key={harf} whileTap={{ scale: 0.98 }}
                 onClick={() => cevapla(harf)} disabled={!!kullaniciCevap}
                 className="flex items-start gap-3 w-full rounded-xl px-4 py-3 text-left transition-all"
                 style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                 <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-display text-sm font-semibold"
                   style={{ background: s.letterBg, color: s.letterColor }}>{harf}</span>
                 <span className="flex-1 text-sm leading-relaxed pt-0.5 font-medium" style={{ color: s.text }}>{metin}</span>
               </motion.button>
             )
           })}
         </div>

         {kullaniciCevap && soru.aciklama && mod !== 'simulasyon' && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
             className="rounded-xl px-4 py-3 border-l-2"
             style={{ background: t.bg2, borderColor: t.accent }}>
             <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: t.accent }}>Açıklama</p>
             <p className="text-sm leading-relaxed" style={{ color: t.dim }}>{soru.aciklama}</p>
           </motion.div>
         )}
       </main>

       <footer className="absolute bottom-0 left-0 right-0 flex gap-2 px-5 pb-6 pt-3 z-10"
         style={{ background: `linear-gradient(to top, ${t.bg} 70%, transparent)` }}>
         <button onClick={geri} disabled={aktifIndex === 0}
           className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30"
           style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>←</button>
         <motion.button whileTap={{ scale: 0.98 }} onClick={ileri}
           className="flex-1 h-12 rounded-xl font-display text-sm font-semibold flex items-center justify-between px-4"
           style={{ background: gradientBg, color: textColor }}>
           {sonSoru ? 'Sınavı Bitir' : 'Sonraki'} <span>{sonSoru ? '✓' : '→'}</span>
         </motion.button>
       </footer>
     </div>

     {/* Sağ panel — Optik (sadece md+) */}
     <div className="hidden md:flex flex-col border-l flex-shrink-0"
       style={{ width: 320, borderColor: t.border, background: t.bg }}>
       <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b flex-shrink-0"
         style={{ borderColor: t.border }}>
         <span className="font-display text-sm font-semibold" style={{ color: t.text }}>
           Optik
         </span>
         <span className="text-xs font-display" style={{ color: t.dim }}>
           {Object.keys(cevaplar).length}/{sorular.length} cevaplandı
         </span>
       </div>

       {/* Liste tarzı optik */}
       <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
         {sorular.map((s, i) => {
           const c = cevaplar[i]
           const aktif = i === aktifIndex
           const renk = optikRenk(i)
           return (
             <button key={i}
               onClick={() => { setAktifIndex(i); aktifIndexGuncelle(i) }}
               className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all text-left"
               style={{
                 background: aktif ? `${t.accent}15` : 'transparent',
                 border: `1px solid ${aktif ? t.accent : 'transparent'}`,
               }}>
               {/* Sıra numarası */}
               <span className="font-display text-xs font-bold flex-shrink-0 w-6 text-right"
                 style={{ color: aktif ? t.accent2 : t.dim }}>{i + 1}</span>

               {/* Şık butonları */}
               <div className="flex gap-1 flex-1">
                 {['A','B','C','D','E'].map(harf => {
                   const secildi = c === harf
                   const dogru = mod !== 'simulasyon' && harf === s.dogruCevap && c
                   const yanlis = mod !== 'simulasyon' && secildi && harf !== s.dogruCevap

                   let bg = t.bg3
                   let color = `${t.dim}60`
                   if (dogru) { bg = 'rgba(46,139,87,0.4)'; color = '#70D090' }
                   else if (yanlis) { bg = 'rgba(139,58,58,0.4)'; color = '#E08080' }
                   else if (secildi && mod === 'simulasyon') { bg = `${t.accent}40`; color = t.accent2 }

                   return (
                     <span key={harf}
                       className="w-6 h-6 rounded-lg flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0"
                       style={{ background: bg, color }}>
                       {harf}
                     </span>
                   )
                 })}
               </div>
             </button>
           )
         })}
       </div>

       <div className="px-4 pb-6 pt-3 flex-shrink-0 border-t" style={{ borderColor: t.border }}>
         <motion.button whileTap={{ scale: 0.98 }} onClick={bitir}
           className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
           style={{ background: gradientBg, color: textColor }}>
           Sınavı Bitir ✓
         </motion.button>
       </div>
     </div>

     {/* Mobil Optik Panel */}
     <AnimatePresence>
       {optikAcik && (
         <>
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setOptikAcik(false)}
             className="absolute inset-0 z-20"
             style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
           <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
             className="absolute right-0 top-0 bottom-0 z-30 flex flex-col"
             style={{ width: '85%', background: t.bg, borderLeft: `1px solid ${t.border}` }}>
             <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b flex-shrink-0"
               style={{ borderColor: t.border }}>
               <span className="font-display text-sm font-semibold" style={{ color: t.text }}>
                 Optik — {Object.keys(cevaplar).length}/{sorular.length}
               </span>
               <button onClick={() => setOptikAcik(false)}
                 className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                 style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}>✕</button>
             </div>
             <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
               {sorular.map((s, i) => {
                 const c = cevaplar[i]
                 const aktif = i === aktifIndex
                 return (
                   <button key={i}
                     onClick={() => { setAktifIndex(i); aktifIndexGuncelle(i); setOptikAcik(false) }}
                     className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all text-left"
                     style={{
                       background: aktif ? `${t.accent}15` : 'transparent',
                       border: `1px solid ${aktif ? t.accent : 'transparent'}`,
                     }}>
                     <span className="font-display text-xs font-bold flex-shrink-0 w-6 text-right"
                       style={{ color: aktif ? t.accent2 : t.dim }}>{i + 1}</span>
                     <div className="flex gap-1 flex-1">
                       {['A','B','C','D','E'].map(harf => {
                         const secildi = c === harf
                         const dogru = mod !== 'simulasyon' && harf === s.dogruCevap && c
                         const yanlis = mod !== 'simulasyon' && secildi && harf !== s.dogruCevap
                         let bg = t.bg3, color = `${t.dim}60`
                         if (dogru) { bg = 'rgba(46,139,87,0.4)'; color = '#70D090' }
                         else if (yanlis) { bg = 'rgba(139,58,58,0.4)'; color = '#E08080' }
                         else if (secildi && mod === 'simulasyon') { bg = `${t.accent}40`; color = t.accent2 }
                         return (
                           <span key={harf}
                             className="w-6 h-6 rounded-lg flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0"
                             style={{ background: bg, color }}>{harf}</span>
                         )
                       })}
                     </div>
                   </button>
                 )
               })}
             </div>
             <div className="px-4 pb-6 pt-3 flex-shrink-0 border-t" style={{ borderColor: t.border }}>
               <motion.button whileTap={{ scale: 0.98 }} onClick={bitir}
                 className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
                 style={{ background: gradientBg, color: textColor }}>
                 Sınavı Bitir ✓
               </motion.button>
             </div>
           </motion.div>
         </>
       )}
     </AnimatePresence>

     <Modal
       acik={cikisModalAcik}
       onKapat={() => setCikisModalAcik(false)}
       baslik="Sınavdan Çık"
       mesaj="Nerede kaldığını kaydetmek ister misin?"
       t={t}
       butonlar={[
         { label: 'Kaydet ve Çık', stil: 'primary', onClick: kaydetVeCik },
         { label: 'Kaydetme ve Çık', stil: 'danger', onClick: kaydetmeyeCik },
         { label: 'İptal', stil: 'ghost', onClick: () => setCikisModalAcik(false) },
       ]}
     />
   </motion.div>
 )
}
