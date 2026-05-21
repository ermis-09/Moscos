import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { db, auth } from '../lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { useMoscosStore } from '../store'
import { temaAl } from '../lib/renkler'

const SORU_ALANLARI = ['donem', 'kurulId', 'ders', 'ogrenimHedefi', 'soru', 'dogruCevap', 'aciklama']
const CIKMIS_ALANLARI = ['donem', 'kurulId', 'yil', 'sinav', 'sira', 'ders', 'ogrenimHedefi', 'soru', 'dogruCevap', 'aciklama']
const FLASH_ALANLARI = ['donem', 'kurulId', 'ders', 'onYuz', 'arkaYuz']
const HARFLER = ['A', 'B', 'C', 'D', 'E']

function DuzenleModal({ item, alanlar, onKaydet, onKapat, t }) {
 const [form, setForm] = useState({ ...item })

 function guncelle(key, val) {
   setForm(f => ({ ...f, [key]: val }))
 }

 function secenekGuncelle(harf, val) {
   setForm(f => ({ ...f, secenekler: { ...f.secenekler, [harf]: val } }))
 }

 return (
   <motion.div
     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
     className="fixed inset-0 z-50 flex items-end justify-center"
     style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
     onClick={e => e.target === e.currentTarget && onKapat()}
   >
     <motion.div
       initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
       className="w-full max-w-[390px] rounded-t-2xl flex flex-col"
       style={{ background: t.bg2, border: `1px solid ${t.border}`, maxHeight: '90vh' }}
     >
       <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
         style={{ borderColor: t.border }}>
         <span className="font-display text-base font-semibold" style={{ color: t.text }}>Düzenle</span>
         <button onClick={onKapat}
           className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
           style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>✕</button>
       </div>

       <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
         {alanlar.map(alan => (
           <div key={alan} className="flex flex-col gap-1.5">
             <label className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>
               {alan}
             </label>
             {alan === 'soru' || alan === 'aciklama' || alan === 'onYuz' || alan === 'arkaYuz' ? (
               <textarea value={form[alan] || ''}
                 onChange={e => guncelle(alan, e.target.value)}
                 rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                 style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.text }} />
             ) : (
               <input value={form[alan] || ''}
                 onChange={e => guncelle(alan, alan === 'donem' || alan === 'yil' || alan === 'sira' ? Number(e.target.value) : e.target.value)}
                 type={alan === 'donem' || alan === 'yil' || alan === 'sira' ? 'number' : 'text'}
                 className="w-full px-3 py-2.5 rounded-xl text-sm"
                 style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.text }} />
             )}
           </div>
         ))}

         {form.secenekler && (
           <div className="flex flex-col gap-2">
             <label className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>Şıklar</label>
             {HARFLER.map(harf => (
               form.secenekler[harf] !== undefined && (
                 <div key={harf} className="flex items-center gap-2">
                   <span className="w-7 h-7 rounded-full flex items-center justify-center font-display text-sm font-semibold flex-shrink-0"
                     style={{ background: t.accent, color: t.bg }}>{harf}</span>
                   <input value={form.secenekler[harf] || ''}
                     onChange={e => secenekGuncelle(harf, e.target.value)}
                     className="flex-1 px-3 py-2 rounded-xl text-sm"
                     style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.text }} />
                 </div>
               )
             ))}
           </div>
         )}
       </div>

       <div className="px-5 py-4 flex-shrink-0 border-t" style={{ borderColor: t.border }}>
         <motion.button whileTap={{ scale: 0.98 }} onClick={() => onKaydet(form)}
           className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
           style={{ background: `linear-gradient(135deg, ${t.accent}, #8B5020)`, color: '#FAF0D0' }}>
           Kaydet
         </motion.button>
       </div>
     </motion.div>
   </motion.div>
 )
}

function SoruKart({ item, onDuzenle, onSil, tip, t, secimModu, secili, onSec }) {
 return (
   <div
     onClick={() => secimModu && onSec(item.id)}
     className="rounded-xl p-4 flex flex-col gap-2 transition-all"
     style={{
       background: secili ? `${t.accent}15` : t.bg2,
       border: `1.5px solid ${secili ? t.accent : t.border}`,
       cursor: secimModu ? 'pointer' : 'default',
     }}>
     <div className="flex items-center gap-2 flex-wrap">
       {secimModu && (
         <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
           style={{
             background: secili ? t.accent : t.bg3,
             border: `1.5px solid ${secili ? t.accent2 : t.border}`,
           }}>
           {secili && <span className="text-[10px] font-bold" style={{ color: '#FAF0D0' }}>✓</span>}
         </div>
       )}
       <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
         style={{ background: t.accent, color: '#FAF0D0' }}>{item.kurulId}</span>
       <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
         style={{ background: `${t.accent}20`, color: t.accent, border: `1px solid ${t.border}` }}>{item.ders}</span>
       {tip === 'cikmis' && (
         <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
           style={{ background: `${t.accent}10`, color: t.dim }}>{item.yil} · {item.sinav}</span>
       )}
       {tip === 'flash' && (
         <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
           style={{ background: `${t.accent}10`, color: t.dim }}>Flashcard</span>
       )}
     </div>
     <p className="text-sm leading-relaxed" style={{ color: t.text }}>
       {tip === 'flash' ? item.onYuz : item.soru?.slice(0, 80) + (item.soru?.length > 80 ? '...' : '')}
     </p>
     {!secimModu && (
       <div className="flex gap-2 justify-end mt-1">
         <button onClick={() => onDuzenle(item)}
           className="px-3 py-1.5 rounded-lg text-xs font-semibold"
           style={{ background: `${t.accent}15`, border: `1px solid ${t.border}`, color: t.accent }}>
           Düzenle
         </button>
         <button onClick={() => onSil(item)}
           className="px-3 py-1.5 rounded-lg text-xs font-semibold"
           style={{ background: 'rgba(139,58,58,0.15)', border: '1px solid rgba(139,58,58,0.3)', color: '#E08080' }}>
           Sil
         </button>
       </div>
     )}
   </div>
 )
}

function FiltrePanel({ acik, onKapat, sekme, items, filtreler, setFiltreler, t }) {
 const donemler = [...new Set(items.map(i => i.donem).filter(Boolean))].sort()
 const kurullar = [...new Set(items.filter(i =>
   !filtreler.donem.length || filtreler.donem.includes(i.donem)
 ).map(i => i.kurulId).filter(Boolean))].sort()
 const dersler = [...new Set(items.filter(i => {
   if (filtreler.donem.length && !filtreler.donem.includes(i.donem)) return false
   if (filtreler.kurulId.length && !filtreler.kurulId.includes(i.kurulId)) return false
   return true
 }).map(i => i.ders).filter(Boolean))].sort()
 const yillar = [...new Set(items.map(i => i.yil).filter(Boolean))].sort((a, b) => b - a)
 const sinavlar = [...new Set(items.filter(i =>
   !filtreler.yil.length || filtreler.yil.includes(i.yil)
 ).map(i => i.sinav).filter(Boolean))].sort()

 function toggle(key, val) {
   setFiltreler(f => ({
     ...f,
     [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
   }))
 }

 function temizle() {
   setFiltreler({ donem: [], kurulId: [], ders: [], yil: [], sinav: [] })
 }

 const aktifSayisi = Object.values(filtreler).filter(arr => arr.length > 0).length

 return (
   <AnimatePresence>
     {acik && (
       <>
         <motion.div
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={onKapat}
           className="fixed inset-0 z-30"
           style={{ background: 'rgba(0,0,0,0.4)' }}
         />
         <motion.div
           initial={{ opacity: 0, y: -8 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -8 }}
           transition={{ type: 'spring', stiffness: 400, damping: 35 }}
           className="absolute left-0 right-0 z-40 rounded-2xl overflow-hidden"
           style={{ top: 4, background: t.bg2, border: `1px solid ${t.border}`, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
         >
           <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: t.border }}>
             <span className="font-display text-xs font-bold tracking-widest uppercase" style={{ color: t.accent }}>
               Filtrele {aktifSayisi > 0 && `(${aktifSayisi})`}
             </span>
             <div className="flex items-center gap-2">
               {aktifSayisi > 0 && (
                 <button onClick={temizle}
                   className="text-[10px] font-semibold font-display px-2.5 py-1 rounded-lg"
                   style={{ background: 'rgba(139,58,58,0.15)', color: '#E08080' }}>
                   Temizle
                 </button>
               )}
               <button onClick={onKapat}
                 className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                 style={{ background: t.bg3, color: t.dim }}>✕</button>
             </div>
           </div>

           <div className="p-4 flex flex-col gap-4 max-h-80 overflow-y-auto">
             {donemler.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Dönem</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {donemler.map(d => (
                     <button key={d} onClick={() => toggle('donem', d)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                       style={{
                         background: filtreler.donem.includes(d) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.donem.includes(d) ? t.accent2 : t.border}`,
                         color: filtreler.donem.includes(d) ? '#FAF0D0' : t.dim,
                       }}>D{d}</button>
                   ))}
                 </div>
               </div>
             )}

             {sekme === 'cikmislar' && yillar.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Yıl</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {yillar.map(y => (
                     <button key={y} onClick={() => toggle('yil', y)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                       style={{
                         background: filtreler.yil.includes(y) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.yil.includes(y) ? t.accent2 : t.border}`,
                         color: filtreler.yil.includes(y) ? '#FAF0D0' : t.dim,
                       }}>{y}</button>
                   ))}
                 </div>
               </div>
             )}

             {sekme === 'cikmislar' && sinavlar.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Sınav</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {sinavlar.map(s => (
                     <button key={s} onClick={() => toggle('sinav', s)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                       style={{
                         background: filtreler.sinav.includes(s) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.sinav.includes(s) ? t.accent2 : t.border}`,
                         color: filtreler.sinav.includes(s) ? '#FAF0D0' : t.dim,
                       }}>{s}</button>
                   ))}
                 </div>
               </div>
             )}

             {kurullar.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Kurul</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {kurullar.map(k => (
                     <button key={k} onClick={() => toggle('kurulId', k)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                       style={{
                         background: filtreler.kurulId.includes(k) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.kurulId.includes(k) ? t.accent2 : t.border}`,
                         color: filtreler.kurulId.includes(k) ? '#FAF0D0' : t.dim,
                       }}>{k}</button>
                   ))}
                 </div>
               </div>
             )}

             {dersler.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Ders</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {dersler.map(d => (
                     <button key={d} onClick={() => toggle('ders', d)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                       style={{
                         background: filtreler.ders.includes(d) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.ders.includes(d) ? t.accent2 : t.border}`,
                         color: filtreler.ders.includes(d) ? '#FAF0D0' : t.dim,
                       }}>{d}</button>
                   ))}
                 </div>
               </div>
             )}
           </div>
         </motion.div>
       </>
     )}
   </AnimatePresence>
 )
}

export default function Admin() {
 const navigate = useNavigate()
 const ayarlar = useMoscosStore(s => s.ayarlar)
 const t = temaAl('home', ayarlar)
 const kullanici = useMoscosStore(s => s.kullanici)
 const setKullanici = useMoscosStore(s => s.setKullanici)

 const [sekme, setSekme] = useState('sorular')
 const [items, setItems] = useState([])
 const [yukleniyor, setYukleniyor] = useState(false)
 const [aramaFiltre, setAramaFiltre] = useState('')
 const [filtreler, setFiltreler] = useState({ donem: [], kurulId: [], ders: [], yil: [], sinav: [] })
 const [filtreAcik, setFiltreAcik] = useState(false)
 const [duzenleItem, setDuzenleItem] = useState(null)
 const [adminMi, setAdminMi] = useState(false)
 const [jsonInput, setJsonInput] = useState('')
 const [jsonMesaj, setJsonMesaj] = useState('')
 const [jsonYukleniyor, setJsonYukleniyor] = useState(false)
 const [secimModu, setSecimModu] = useState(false)
 const [seciliIds, setSeciliIds] = useState(new Set())
 const [topluSilOnay, setTopluSilOnay] = useState(false)
 const filtreRef = useRef(null)

 const aktifFiltreSayisi = Object.values(filtreler).filter(arr => arr.length > 0).length

 useEffect(() => {
   if (!kullanici) return
   async function kontrol() {
     try {
       const snap = await getDocs(collection(db, 'adminler'))
       const adminler = snap.docs.map(d => d.id)
       setAdminMi(adminler.includes(kullanici.email))
     } catch { setAdminMi(false) }
   }
   kontrol()
 }, [kullanici])

 useEffect(() => {
   if (!adminMi || sekme === 'iceriak') return
   yukle()
   setFiltreler({ donem: [], kurulId: [], ders: [], yil: [], sinav: [] })
   setAramaFiltre('')
   setFiltreAcik(false)
   setSecimModu(false)
   setSeciliIds(new Set())
 }, [sekme, adminMi])

 async function yukle() {
   setYukleniyor(true)
   setItems([])
   try {
     const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
     const snap = await getDocs(collection(db, koleksiyon))
     setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
   } catch (err) {
     console.error(err)
   } finally {
     setYukleniyor(false)
   }
 }

 async function kaydet(form) {
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   const { id, ...data } = form
   await updateDoc(doc(db, koleksiyon, id), data)
   setDuzenleItem(null)
   yukle()
 }

 async function sil(item) {
   if (!confirm('Bu kaydı silmek istediğine emin misin?')) return
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   await deleteDoc(doc(db, koleksiyon, item.id))
   yukle()
 }

 async function topluSil() {
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   try {
     for (const id of seciliIds) {
       await deleteDoc(doc(db, koleksiyon, id))
     }
     setSeciliIds(new Set())
     setSecimModu(false)
     setTopluSilOnay(false)
     yukle()
   } catch (err) {
     console.error(err)
   }
 }

 async function girisYap() {
   const provider = new GoogleAuthProvider()
   const result = await signInWithPopup(auth, provider)
   setKullanici(result.user)
 }

 async function topluIcerAktar() {
   setJsonMesaj('')
   setJsonYukleniyor(true)
   let parsed
   try {
     parsed = JSON.parse(jsonInput)
   } catch {
     setJsonMesaj('Geçersiz JSON formatı.')
     setJsonYukleniyor(false)
     return
   }

   const soruArr = parsed.sorular || parsed.cikmislar || parsed.flashcardlar || parsed
   if (!Array.isArray(soruArr)) {
     setJsonMesaj('Veri bir dizi olmalı.')
     setJsonYukleniyor(false)
     return
   }

   const ilk = soruArr[0] || {}
   let koleksiyon = 'sorular'
   if (ilk.yil && ilk.sinav) koleksiyon = 'cikmis_sorular'
   else if (ilk.onYuz || ilk.arkaYuz) koleksiyon = 'flashcardlar'

   try {
     let basarili = 0
     for (const item of soruArr) {
       await addDoc(collection(db, koleksiyon), item)
       basarili++
     }
     setJsonInput('')
     setJsonMesaj(`✓ ${basarili} kayıt "${koleksiyon}" koleksiyonuna eklendi.`)
   } catch (err) {
     setJsonMesaj('Firebase hatası: ' + err.message)
   } finally {
     setJsonYukleniyor(false)
   }
 }

 function secToggle(id) {
   setSeciliIds(prev => {
     const yeni = new Set(prev)
     if (yeni.has(id)) yeni.delete(id)
     else yeni.add(id)
     return yeni
   })
 }

 function tumunuSec() {
   if (seciliIds.size === filtrelenmis.length) {
     setSeciliIds(new Set())
   } else {
     setSeciliIds(new Set(filtrelenmis.map(i => i.id)))
   }
 }

 const filtrelenmis = items.filter(item => {
   if (filtreler.donem.length && !filtreler.donem.includes(item.donem)) return false
   if (filtreler.kurulId.length && !filtreler.kurulId.includes(item.kurulId)) return false
   if (filtreler.ders.length && !filtreler.ders.includes(item.ders)) return false
   if (filtreler.yil.length && !filtreler.yil.includes(item.yil)) return false
   if (filtreler.sinav.length && !filtreler.sinav.includes(item.sinav)) return false
   if (!aramaFiltre) return true
   const aramaMetni = aramaFiltre.toLowerCase()
   return (
     item.kurulId?.toLowerCase().includes(aramaMetni) ||
     item.ders?.toLowerCase().includes(aramaMetni) ||
     item.soru?.toLowerCase().includes(aramaMetni) ||
     item.onYuz?.toLowerCase().includes(aramaMetni) ||
     item.yil?.toString().includes(aramaMetni) ||
     item.sinav?.toLowerCase().includes(aramaMetni)
   )
 })

 const alanlar = sekme === 'sorular' ? SORU_ALANLARI : sekme === 'cikmislar' ? CIKMIS_ALANLARI : FLASH_ALANLARI
 const tumSecili = filtrelenmis.length > 0 && seciliIds.size === filtrelenmis.length

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

     <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
       <button onClick={() => navigate(-1)}
         className="w-9 h-9 rounded-full flex items-center justify-center"
         style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
       <span className="font-display text-base font-semibold" style={{ color: t.text }}>Admin</span>
       <div className="w-9" />
     </header>

     {!kullanici ? (
       <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
         <h2 className="font-display text-2xl font-bold" style={{ color: t.text }}>Admin Girişi</h2>
         <p className="text-sm text-center" style={{ color: t.dim }}>Devam etmek için Google hesabınla giriş yap.</p>
         <motion.button whileTap={{ scale: 0.98 }} onClick={girisYap}
           className="flex items-center gap-3 px-6 py-4 rounded-2xl font-display text-sm font-semibold"
           style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}>
           <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
             <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
             <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
             <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
             <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
           </svg>
           Google ile Giriş Yap
         </motion.button>
       </div>
     ) : !adminMi ? (
       <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
         <p className="font-display text-xl font-bold" style={{ color: '#E08080' }}>Erişim Reddedildi</p>
         <p className="text-sm text-center" style={{ color: t.dim }}>Bu hesabın admin yetkisi yok.</p>
       </div>
     ) : (
       <>
         <div className="flex gap-2 px-5 pb-3 flex-shrink-0 overflow-x-auto">
           {[
             { id: 'sorular', label: 'Sorular' },
             { id: 'cikmislar', label: 'Çıkmışlar' },
             { id: 'flashcardlar', label: 'Flashcard' },
             { id: 'iceriak', label: 'İçe Aktar' },
           ].map(s => (
             <button key={s.id} onClick={() => setSekme(s.id)}
               className="flex-1 py-2.5 rounded-xl font-display text-xs font-semibold transition-all flex-shrink-0"
               style={{
                 background: sekme === s.id ? t.accent : t.bg2,
                 color: sekme === s.id ? '#FAF0D0' : t.dim,
                 border: `1px solid ${sekme === s.id ? t.accent2 : t.border}`,
               }}>{s.label}</button>
           ))}
         </div>

         {sekme === 'iceriak' ? (
           <div className="flex-1 px-5 pb-6 overflow-y-auto flex flex-col gap-4 relative z-10">
             <div className="rounded-xl px-4 py-3" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
               <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: t.accent }}>Format</p>
               <p className="text-xs leading-relaxed" style={{ color: t.dim }}>
                 JSON formatında soru verisi yapıştır.
                 <br />
                 <span style={{ color: t.accent }}>{'{ "sorular": [...] }'}</span> veya direkt dizi.
               </p>
             </div>
             <textarea value={jsonInput}
               onChange={e => { setJsonInput(e.target.value); setJsonMesaj('') }}
               placeholder={'{\n  "sorular": [\n    {\n      "soru": "...",\n      ...\n    }\n  ]\n}'}
               rows={12}
               className="w-full px-4 py-3 rounded-xl text-xs font-mono resize-none"
               style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text, lineHeight: 1.6 }}
             />
             {jsonMesaj && (
               <p className="text-xs font-semibold font-display"
                 style={{ color: jsonMesaj.startsWith('✓') ? '#70D090' : '#E08080' }}>
                 {jsonMesaj}
               </p>
             )}
             <motion.button whileTap={{ scale: 0.98 }} onClick={topluIcerAktar}
               disabled={!jsonInput.trim() || jsonYukleniyor}
               className="w-full py-4 rounded-2xl font-display text-sm font-semibold disabled:opacity-40"
               style={{ background: `linear-gradient(135deg, ${t.accent}, #8B5020)`, color: '#FAF0D0' }}>
               {jsonYukleniyor ? 'Yükleniyor...' : 'Firebase\'e Aktar →'}
             </motion.button>
           </div>
         ) : (
           <>
             {/* Arama + Filtre + Seç */}
             <div className="px-5 pb-3 flex-shrink-0 flex gap-2 relative" ref={filtreRef}>
               <input value={aramaFiltre} onChange={e => setAramaFiltre(e.target.value)}
                 placeholder="Ara..."
                 className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                 style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }} />

               <button onClick={() => setFiltreAcik(f => !f)}
                 className="relative px-3 py-2.5 rounded-xl font-display text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                 style={{
                   background: aktifFiltreSayisi > 0 ? `${t.accent}20` : t.bg2,
                   border: `1.5px solid ${aktifFiltreSayisi > 0 ? t.accent : t.border}`,
                   color: aktifFiltreSayisi > 0 ? t.accent2 : t.dim,
                 }}>
                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                   <line x1="4" y1="6" x2="20" y2="6"/>
                   <line x1="8" y1="12" x2="16" y2="12"/>
                   <line x1="11" y1="18" x2="13" y2="18"/>
                 </svg>
                 {aktifFiltreSayisi > 0 && (
                   <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                     style={{ background: t.accent, color: '#FAF0D0' }}>{aktifFiltreSayisi}</span>
                 )}
               </button>

               <button
                 onClick={() => {
                   setSecimModu(f => !f)
                   setSeciliIds(new Set())
                 }}
                 className="px-3 py-2.5 rounded-xl font-display text-xs font-semibold flex-shrink-0"
                 style={{
                   background: secimModu ? `${t.accent}20` : t.bg2,
                   border: `1.5px solid ${secimModu ? t.accent : t.border}`,
                   color: secimModu ? t.accent2 : t.dim,
                 }}>
                 Seç
               </button>

               <div className="absolute left-5 right-5 z-40" style={{ top: '100%' }}>
                 <FiltrePanel
                   acik={filtreAcik}
                   onKapat={() => setFiltreAcik(false)}
                   sekme={sekme}
                   items={items}
                   filtreler={filtreler}
                   setFiltreler={setFiltreler}
                   t={t}
                 />
               </div>
             </div>

             {/* Seçim modu toolbar */}
             {secimModu && (
               <div className="px-5 pb-3 flex-shrink-0 flex items-center justify-between">
                 <button onClick={tumunuSec}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-display text-xs font-semibold"
                   style={{
                     background: tumSecili ? `${t.accent}20` : t.bg2,
                     border: `1px solid ${tumSecili ? t.accent : t.border}`,
                     color: tumSecili ? t.accent2 : t.dim,
                   }}>
                   <div className="w-4 h-4 rounded-md flex items-center justify-center"
                     style={{ background: tumSecili ? t.accent : t.bg3, border: `1.5px solid ${tumSecili ? t.accent2 : t.border}` }}>
                     {tumSecili && <span className="text-[9px] font-bold" style={{ color: '#FAF0D0' }}>✓</span>}
                   </div>
                   Tümünü Seç ({filtrelenmis.length})
                 </button>
                 <span className="text-xs font-display" style={{ color: t.dim }}>
                   {seciliIds.size} seçili
                 </span>
               </div>
             )}

             {/* Sonuç sayısı */}
             {(aktifFiltreSayisi > 0 || aramaFiltre) && !secimModu && (
               <div className="px-5 pb-2 flex-shrink-0">
                 <span className="text-xs" style={{ color: t.dim }}>{filtrelenmis.length} kayıt</span>
               </div>
             )}

             <main className="flex-1 px-5 pb-24 overflow-y-auto flex flex-col gap-2 relative z-10">
               {yukleniyor ? (
                 <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Yükleniyor...</p>
               ) : filtrelenmis.length === 0 ? (
                 <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Kayıt bulunamadı.</p>
               ) : (
                 filtrelenmis.map(item => (
                   <SoruKart key={item.id} item={item}
                     tip={sekme === 'flashcardlar' ? 'flash' : sekme === 'cikmislar' ? 'cikmis' : 'soru'}
                     onDuzenle={setDuzenleItem} onSil={sil} t={t}
                     secimModu={secimModu}
                     secili={seciliIds.has(item.id)}
                     onSec={secToggle}
                   />
                 ))
               )}
             </main>

             {/* Toplu silme action bar */}
             <AnimatePresence>
               {secimModu && seciliIds.size > 0 && (
                 <motion.div
                   initial={{ y: 80, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   exit={{ y: 80, opacity: 0 }}
                   className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 z-20"
                   style={{ background: `linear-gradient(to top, ${t.bg} 60%, transparent)` }}
                 >
                   <button
                     onClick={() => setTopluSilOnay(true)}
                     className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
                     style={{ background: 'linear-gradient(135deg, #8B3A3A, #6B2A2A)', color: '#FFD0D0' }}>
                     {seciliIds.size} kaydı sil
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
           </>
         )}
       </>
     )}

     {/* Toplu silme onay modal */}
     <AnimatePresence>
       {topluSilOnay && (
         <motion.div
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center px-6"
           style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
         >
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="w-full max-w-[320px] rounded-2xl p-6 flex flex-col gap-4"
             style={{ background: t.bg2, border: `1px solid ${t.border}` }}
           >
             <div className="text-center">
               <p className="font-display text-lg font-bold mb-2" style={{ color: t.text }}>
                 Emin misin?
               </p>
               <p className="text-sm" style={{ color: t.dim }}>
                 {seciliIds.size} kayıt kalıcı olarak silinecek.
               </p>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setTopluSilOnay(false)}
                 className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                 style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>
                 İptal
               </button>
               <button onClick={topluSil}
                 className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                 style={{ background: 'linear-gradient(135deg, #8B3A3A, #6B2A2A)', color: '#FFD0D0' }}>
                 Sil
               </button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>

     <AnimatePresence>
       {duzenleItem && (
         <DuzenleModal item={duzenleItem} alanlar={alanlar}
           onKaydet={kaydet} onKapat={() => setDuzenleItem(null)} t={t} />
       )}
     </AnimatePresence>
   </motion.div>
 )
}
