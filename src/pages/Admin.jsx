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

const BOLUMLER = [
 { id: 'sorular', label: 'Sorular', tema: 'sinav', ikon: (
   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
     <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
     <rect x="9" y="3" width="6" height="4" rx="1"/>
     <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
   </svg>
 )},
 { id: 'cikmislar', label: 'Çıkmış Sorular', tema: 'sim', ikon: (
   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
   </svg>
 )},
 { id: 'flashcardlar', label: 'Flashcard', tema: 'flash', ikon: (
   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
     <rect x="2" y="5" width="20" height="14" rx="2"/>
     <line x1="2" y1="10" x2="22" y2="10"/>
   </svg>
 )},
 { id: 'iceriak', label: 'İçe Aktar', tema: 'home', ikon: (
   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
     <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
     <polyline points="7 10 12 15 17 10"/>
     <line x1="12" y1="15" x2="12" y2="3"/>
   </svg>
 )},
]

function soruSirala(items, sekme) {
 return [...items].sort((a, b) => {
   if (sekme === 'cikmislar') {
     if (a.donem !== b.donem) return a.donem - b.donem
     if (a.yil !== b.yil) return a.yil - b.yil
     if (a.sinav !== b.sinav) return (a.sinav || '').localeCompare(b.sinav || '')
     return (a.sira || 0) - (b.sira || 0)
   }
   if (a.donem !== b.donem) return a.donem - b.donem
   if ((a.kurulId || '') !== (b.kurulId || '')) return (a.kurulId || '').localeCompare(b.kurulId || '')
   return (a.sira || 0) - (b.sira || 0)
 })
}

function DuzenleForm({ item, alanlar, onKaydet, onKapat, onSonraki, onOnceki, siradakiVar, oncekiVar, soruIndex, toplamSoru, t, inline = false }) {
 const [form, setForm] = useState({ ...item })
 useEffect(() => { setForm({ ...item }) }, [item?.id])

 function guncelle(key, val) { setForm(f => ({ ...f, [key]: val })) }
 function secenekGuncelle(harf, val) { setForm(f => ({ ...f, secenekler: { ...f.secenekler, [harf]: val } })) }

 const icerik = (
   <div className="flex flex-col gap-4">
     {inline && (
       <div className="flex items-center justify-between py-2 px-3 rounded-xl"
         style={{ background: t.bg3, border: `1px solid ${t.border}` }}>
         <button onClick={onOnceki} disabled={!oncekiVar}
           className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
           style={{ background: t.bg2, color: t.dim }}>←</button>
         <span className="font-display text-xs font-semibold" style={{ color: t.dim }}>
           {soruIndex + 1} / {toplamSoru}
         </span>
         <button onClick={onSonraki} disabled={!siradakiVar}
           className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
           style={{ background: t.bg2, color: t.dim }}>→</button>
       </div>
     )}

     {inline && form.soru && (
       <div className="rounded-xl px-4 py-3" style={{ background: `${t.accent}08`, border: `1px solid ${t.accent}25` }}>
         <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ color: t.accent }}>Önizleme</p>
         <p className="text-sm leading-relaxed" style={{ color: t.text }}>{form.soru}</p>
         {form.secenekler && (
           <div className="flex flex-col gap-1 mt-2">
             {HARFLER.map(h => {
               if (!form.secenekler[h]) return null
               const dogru = h === form.dogruCevap
               return (
                 <div key={h} className="flex items-start gap-2 text-xs" style={{ color: dogru ? '#70D090' : `${t.dim}80` }}>
                   <span className="font-bold flex-shrink-0" style={{ color: dogru ? '#70D090' : `${t.accent}60` }}>{h})</span>
                   <span>{form.secenekler[h]}</span>
                 </div>
               )
             })}
           </div>
         )}
       </div>
     )}

     {alanlar.map(alan => (
       <div key={alan} className="flex flex-col gap-1.5">
         <label className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>{alan}</label>
         {alan === 'soru' || alan === 'aciklama' || alan === 'onYuz' || alan === 'arkaYuz' ? (
           <textarea value={form[alan] || ''} onChange={e => guncelle(alan, e.target.value)}
             rows={alan === 'soru' ? 4 : 3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
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
                 style={{ background: harf === form.dogruCevap ? '#2E8B57' : t.accent, color: '#fff' }}>{harf}</span>
               <input value={form.secenekler[harf] || ''} onChange={e => secenekGuncelle(harf, e.target.value)}
                 className="flex-1 px-3 py-2 rounded-xl text-sm"
                 style={{
                   background: harf === form.dogruCevap ? 'rgba(46,139,87,0.1)' : t.bg3,
                   border: `1px solid ${harf === form.dogruCevap ? '#2E8B57' : t.border}`,
                   color: t.text
                 }} />
             </div>
           )
         ))}
       </div>
     )}

     <div className="flex gap-2 pt-2">
       {onKapat && !inline && (
         <button onClick={onKapat} className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
           style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>İptal</button>
       )}
       <motion.button whileTap={{ scale: 0.98 }} onClick={() => onKaydet(form)}
         className="flex-1 py-4 rounded-2xl font-display text-sm font-semibold"
         style={{ background: `linear-gradient(135deg, ${t.accent}, #8B5020)`, color: '#FAF0D0' }}>
         Kaydet ✓
       </motion.button>
     </div>
   </div>
 )

 if (inline) return <div className="h-full">{icerik}</div>

 return (
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
     className="fixed inset-0 z-50 flex items-end justify-center"
     style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
     onClick={e => e.target === e.currentTarget && onKapat()}>
     <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
       className="w-full max-w-[390px] rounded-t-2xl flex flex-col"
       style={{ background: t.bg2, border: `1px solid ${t.border}`, maxHeight: '90vh' }}>
       <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: t.border }}>
         <span className="font-display text-base font-semibold" style={{ color: t.text }}>Düzenle</span>
         <button onClick={onKapat} className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
           style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>✕</button>
       </div>
       <div className="flex-1 overflow-y-auto px-5 py-4">{icerik}</div>
     </motion.div>
   </motion.div>
 )
}

function SoruKart({ item, onDuzenle, onSil, tip, t, secimModu, secili, onSec, aktif, sirano }) {
 return (
   <div onClick={() => secimModu ? onSec(item.id) : onDuzenle(item)}
     className="rounded-xl px-4 py-3 flex items-start gap-3 transition-all cursor-pointer"
     style={{
       background: aktif ? `${t.accent}15` : secili ? `${t.accent}10` : t.bg2,
       border: `1.5px solid ${aktif ? t.accent : secili ? t.accent : t.border}`,
     }}>
     {secimModu && (
       <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
         style={{ background: secili ? t.accent : t.bg3, border: `1.5px solid ${secili ? t.accent2 : t.border}` }}>
         {secili && <span className="text-[10px] font-bold" style={{ color: '#FAF0D0' }}>✓</span>}
       </div>
     )}
     <span className="font-display text-xs font-bold flex-shrink-0 w-6 text-right mt-0.5"
       style={{ color: aktif ? t.accent2 : `${t.dim}50` }}>{sirano}</span>
     <div className="flex-1 min-w-0 flex flex-col gap-1.5">
       <div className="flex items-center gap-1.5 flex-wrap">
         <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
           style={{ background: `${t.accent}20`, color: t.accent }}>{item.kurulId}</span>
         <span className="text-[9px] font-semibold" style={{ color: t.dim }}>{item.ders}</span>
         {tip === 'cikmis' && (
           <span className="text-[9px]" style={{ color: `${t.dim}50` }}>{item.yil} · {item.sinav} · #{item.sira}</span>
         )}
       </div>
       <p className="text-sm leading-snug" style={{ color: t.text }}>
         {tip === 'flash' ? item.onYuz : item.soru?.slice(0, 90) + (item.soru?.length > 90 ? '...' : '')}
       </p>
     </div>
     {!secimModu && (
       <button onClick={e => { e.stopPropagation(); onSil(item) }}
         className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
         style={{ background: 'rgba(139,58,58,0.15)', color: '#E08080' }}>
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
           <polyline points="3 6 5 6 21 6"/>
           <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
         </svg>
       </button>
     )}
   </div>
 )
}

function FiltreDropdown({ acik, onKapat, sekme, items, filtreler, setFiltreler, t }) {
 const kurullar = [...new Set(items.map(i => i.kurulId).filter(Boolean))].sort()
 const dersler = [...new Set(items.filter(i =>
   !filtreler.kurulId.length || filtreler.kurulId.includes(i.kurulId)
 ).map(i => i.ders).filter(Boolean))].sort()
 const yillar = [...new Set(items.map(i => i.yil).filter(Boolean))].sort((a, b) => b - a)

 function toggle(key, val) {
   setFiltreler(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val] }))
 }
 function temizle() { setFiltreler({ kurulId: [], ders: [], yil: [] }) }
 const aktifSayisi = Object.values(filtreler).filter(a => a.length > 0).length

 return (
   <AnimatePresence>
     {acik && (
       <>
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           onClick={onKapat} className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }} />
         <motion.div
           initial={{ opacity: 0, y: -8, scale: 0.97 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -8, scale: 0.97 }}
           transition={{ type: 'spring', stiffness: 400, damping: 35 }}
           className="absolute right-0 z-40 rounded-2xl overflow-hidden"
           style={{ top: 'calc(100% + 8px)', minWidth: 280, background: t.bg2, border: `1px solid ${t.border}`, boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}>
           <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: t.border }}>
             <span className="font-display text-xs font-bold tracking-widest uppercase" style={{ color: t.accent }}>
               Filtrele {aktifSayisi > 0 && `(${aktifSayisi})`}
             </span>
             <div className="flex items-center gap-2">
               {aktifSayisi > 0 && (
                 <button onClick={temizle} className="text-[10px] font-semibold font-display px-2.5 py-1 rounded-lg"
                   style={{ background: 'rgba(139,58,58,0.15)', color: '#E08080' }}>Temizle</button>
               )}
               <button onClick={onKapat} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                 style={{ background: t.bg3, color: t.dim }}>✕</button>
             </div>
           </div>
           <div className="p-4 flex flex-col gap-4 max-h-72 overflow-y-auto">
             {/* KurulId */}
             {kurullar.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Kurul</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {kurullar.map(k => (
                     <button key={k} onClick={() => toggle('kurulId', k)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold transition-all"
                       style={{
                         background: filtreler.kurulId.includes(k) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.kurulId.includes(k) ? t.accent2 : t.border}`,
                         color: filtreler.kurulId.includes(k) ? '#FAF0D0' : t.dim,
                       }}>{k}</button>
                   ))}
                 </div>
               </div>
             )}
             {/* Ders — sadece sorular ve flashcard */}
             {sekme !== 'cikmislar' && dersler.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Ders</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {dersler.map(d => (
                     <button key={d} onClick={() => toggle('ders', d)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold transition-all"
                       style={{
                         background: filtreler.ders?.includes(d) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.ders?.includes(d) ? t.accent2 : t.border}`,
                         color: filtreler.ders?.includes(d) ? '#FAF0D0' : t.dim,
                       }}>{d}</button>
                   ))}
                 </div>
               </div>
             )}
             {/* Yıl — sadece çıkmışlar */}
             {sekme === 'cikmislar' && yillar.length > 0 && (
               <div className="flex flex-col gap-2">
                 <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>Yıl</span>
                 <div className="flex gap-1.5 flex-wrap">
                   {yillar.map(y => (
                     <button key={y} onClick={() => toggle('yil', y)}
                       className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold transition-all"
                       style={{
                         background: filtreler.yil.includes(y) ? t.accent : t.bg3,
                         border: `1px solid ${filtreler.yil.includes(y) ? t.accent2 : t.border}`,
                         color: filtreler.yil.includes(y) ? '#FAF0D0' : t.dim,
                       }}>{y}</button>
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
 const kullanici = useMoscosStore(s => s.kullanici)
 const setKullanici = useMoscosStore(s => s.setKullanici)

 const [sekme, setSekme] = useState(null) // null = ana ekran
 const [items, setItems] = useState([])
 const [yukleniyor, setYukleniyor] = useState(false)
 const [aramaFiltre, setAramaFiltre] = useState('')
 const [filtreler, setFiltreler] = useState({ kurulId: [], ders: [], yil: [] })
 const [filtreAcik, setFiltreAcik] = useState(false)
 const [duzenleItem, setDuzenleItem] = useState(null)
 const [adminMi, setAdminMi] = useState(false)
 const [jsonInput, setJsonInput] = useState('')
 const [jsonMesaj, setJsonMesaj] = useState('')
 const [jsonYukleniyor, setJsonYukleniyor] = useState(false)
 const [secimModu, setSecimModu] = useState(false)
 const [seciliIds, setSeciliIds] = useState(new Set())
 const [topluSilOnay, setTopluSilOnay] = useState(false)
 const listeRef = useRef(null)

 // Aktif tema — sekmeye göre
 const aktifTema = sekme ? BOLUMLER.find(b => b.id === sekme)?.tema || 'home' : 'home'
 const t = temaAl(aktifTema, ayarlar)
 const t0 = temaAl('home', ayarlar)

 const aktifFiltreSayisi = Object.values(filtreler).filter(a => a.length > 0).length

 useEffect(() => {
   if (!kullanici) return
   async function kontrol() {
     try {
       const snap = await getDocs(collection(db, 'adminler'))
       setAdminMi(snap.docs.map(d => d.id).includes(kullanici.email))
     } catch { setAdminMi(false) }
   }
   kontrol()
 }, [kullanici])

 useEffect(() => {
   if (!adminMi || !sekme || sekme === 'iceriak') return
   yukle()
   setFiltreler({ kurulId: [], ders: [], yil: [] })
   setAramaFiltre('')
   setFiltreAcik(false)
   setSecimModu(false)
   setSeciliIds(new Set())
   setDuzenleItem(null)
 }, [sekme, adminMi])

 async function yukle() {
   setYukleniyor(true)
   setItems([])
   try {
     const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
     const snap = await getDocs(collection(db, koleksiyon))
     setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
   } catch (err) { console.error(err) }
   finally { setYukleniyor(false) }
 }

 async function kaydet(form) {
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   const { id, ...data } = form
   await updateDoc(doc(db, koleksiyon, id), data)
   setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
   setDuzenleItem({ ...form })
 }

 async function sil(item) {
   if (!confirm('Bu kaydı silmek istediğine emin misin?')) return
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   await deleteDoc(doc(db, koleksiyon, item.id))
   if (duzenleItem?.id === item.id) setDuzenleItem(null)
   setItems(prev => prev.filter(i => i.id !== item.id))
 }

 async function topluSil() {
   const koleksiyon = sekme === 'sorular' ? 'sorular' : sekme === 'cikmislar' ? 'cikmis_sorular' : 'flashcardlar'
   try {
     for (const id of seciliIds) await deleteDoc(doc(db, koleksiyon, id))
     setItems(prev => prev.filter(i => !seciliIds.has(i.id)))
     setSeciliIds(new Set())
     setSecimModu(false)
     setTopluSilOnay(false)
   } catch (err) { console.error(err) }
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
   try { parsed = JSON.parse(jsonInput) }
   catch { setJsonMesaj('Geçersiz JSON formatı.'); setJsonYukleniyor(false); return }

   const soruArr = parsed.sorular || parsed.cikmislar || parsed.flashcardlar || parsed
   if (!Array.isArray(soruArr)) { setJsonMesaj('Veri bir dizi olmalı.'); setJsonYukleniyor(false); return }

   const ilk = soruArr[0] || {}
   let koleksiyon = 'sorular'
   if (ilk.yil && ilk.sinav) koleksiyon = 'cikmis_sorular'
   else if (ilk.onYuz || ilk.arkaYuz) koleksiyon = 'flashcardlar'

   try {
     let basarili = 0
     for (const item of soruArr) { await addDoc(collection(db, koleksiyon), item); basarili++ }
     setJsonInput('')
     setJsonMesaj(`✓ ${basarili} kayıt "${koleksiyon}" koleksiyonuna eklendi.`)
   } catch (err) { setJsonMesaj('Firebase hatası: ' + err.message) }
   finally { setJsonYukleniyor(false) }
 }

 function secToggle(id) {
   setSeciliIds(prev => { const y = new Set(prev); y.has(id) ? y.delete(id) : y.add(id); return y })
 }

 const sirali = soruSirala(items, sekme)
 const filtrelenmis = sirali.filter(item => {
   if (filtreler.kurulId.length && !filtreler.kurulId.includes(item.kurulId)) return false
   if (filtreler.ders?.length && !filtreler.ders.includes(item.ders)) return false
   if (filtreler.yil.length && !filtreler.yil.includes(item.yil)) return false
   if (!aramaFiltre) return true
   const a = aramaFiltre.toLowerCase()
   return item.kurulId?.toLowerCase().includes(a) || item.ders?.toLowerCase().includes(a) ||
     item.soru?.toLowerCase().includes(a) || item.onYuz?.toLowerCase().includes(a) ||
     item.yil?.toString().includes(a) || item.sinav?.toLowerCase().includes(a)
 })

 const tumSecili = filtrelenmis.length > 0 && seciliIds.size === filtrelenmis.length
 const duzenleIndex = filtrelenmis.findIndex(i => i.id === duzenleItem?.id)
 const alanlar = sekme === 'sorular' ? SORU_ALANLARI : sekme === 'cikmislar' ? CIKMIS_ALANLARI : FLASH_ALANLARI

 function sonrakiSoru() {
   if (duzenleIndex < filtrelenmis.length - 1) {
     setDuzenleItem(filtrelenmis[duzenleIndex + 1])
     setTimeout(() => document.getElementById(`soru-${filtrelenmis[duzenleIndex + 1].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
   }
 }

 function oncekiSoru() {
   if (duzenleIndex > 0) {
     setDuzenleItem(filtrelenmis[duzenleIndex - 1])
     setTimeout(() => document.getElementById(`soru-${filtrelenmis[duzenleIndex - 1].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
   }
 }

 // Seçili filtre chip'leri
 const aktifChipler = [
   ...filtreler.kurulId.map(v => ({ key: 'kurulId', val: v, label: v })),
   ...(filtreler.ders || []).map(v => ({ key: 'ders', val: v, label: v })),
   ...filtreler.yil.map(v => ({ key: 'yil', val: v, label: String(v) })),
 ]

 function chipKaldir(key, val) {
   setFiltreler(f => ({ ...f, [key]: f[key].filter(v => v !== val) }))
 }

 return (
   <motion.div
     initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
     transition={{ type: 'spring', stiffness: 300, damping: 30 }}
     className="w-full mx-auto flex flex-col relative overflow-hidden"
     style={{ height: '100dvh', maxHeight: '-webkit-fill-available', background: t.bg, color: t.text, transition: 'background 0.4s' }}
   >
     <div className="absolute inset-0 pointer-events-none" style={{
       backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(255,255,255,0.015) 44px, rgba(255,255,255,0.015) 45px)`
     }} />

     <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10 border-b"
       style={{ borderColor: t.border }}>
       <button onClick={() => sekme ? setSekme(null) : navigate(-1)}
         className="w-9 h-9 rounded-full flex items-center justify-center"
         style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}>←</button>
       <div className="flex flex-col items-center">
         <span className="font-display text-base font-semibold" style={{ color: t.text }}>Admin</span>
         {sekme && <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.accent }}>
           {BOLUMLER.find(b => b.id === sekme)?.label}
         </span>}
       </div>
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
     ) : !sekme ? (
       /* Ana ekran — bölüm seçimi */
       <div className="flex-1 flex flex-col px-5 py-6 gap-4 overflow-y-auto relative z-10">
         <p className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase" style={{ color: t0.accent }}>
           Bölümler
         </p>
         <div className="grid grid-cols-2 gap-3">
           {BOLUMLER.map(bolum => {
             const bt = temaAl(bolum.tema, ayarlar)
             return (
               <motion.button key={bolum.id} whileTap={{ scale: 0.97 }}
                 onClick={() => setSekme(bolum.id)}
                 className="flex flex-col items-start gap-4 p-5 rounded-2xl text-left transition-all"
                 style={{ background: bt.bg2, border: `1.5px solid ${bt.border}`, minHeight: 130 }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = bt.accent; e.currentTarget.style.background = `${bt.accent}10` }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = bt.border; e.currentTarget.style.background = bt.bg2 }}>
                 <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: `${bt.accent}15`, color: bt.accent }}>
                   {bolum.ikon}
                 </div>
                 <div>
                   <p className="font-display text-sm font-semibold" style={{ color: bt.text }}>{bolum.label}</p>
                   <p className="text-[10px] mt-0.5" style={{ color: bt.dim }}>
                     {bolum.id === 'sorular' ? 'Soru bankası' :
                      bolum.id === 'cikmislar' ? 'Arşiv sorular' :
                      bolum.id === 'flashcardlar' ? 'Kart havuzu' : 'JSON aktarımı'}
                   </p>
                 </div>
               </motion.button>
             )
           })}
         </div>

         {/* Kullanıcı bilgisi */}
         {kullanici && (
           <div className="mt-auto flex items-center gap-3 p-4 rounded-2xl"
             style={{ background: t0.bg2, border: `1px solid ${t0.border}` }}>
             <img src={kullanici.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0"
               style={{ border: `2px solid ${t0.accent}` }} />
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold truncate" style={{ color: t0.text }}>{kullanici.displayName}</p>
               <p className="text-xs truncate" style={{ color: t0.dim }}>{kullanici.email}</p>
             </div>
             <span className="text-[9px] font-bold px-2 py-1 rounded-full"
               style={{ background: `${t0.accent}20`, color: t0.accent }}>Admin</span>
           </div>
         )}
       </div>
     ) : sekme === 'iceriak' ? (
       <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 relative z-10">
         <div className="rounded-xl px-4 py-3" style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
           <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: t.accent }}>Format</p>
           <p className="text-xs leading-relaxed" style={{ color: t.dim }}>
             JSON formatında soru verisi yapıştır.
             <br /><span style={{ color: t.accent }}>{'{ "sorular": [...] }'}</span> veya direkt dizi.
           </p>
         </div>
         <textarea value={jsonInput} onChange={e => { setJsonInput(e.target.value); setJsonMesaj('') }}
           placeholder={'{\n  "sorular": [\n    {\n      "soru": "...",\n      ...\n    }\n  ]\n}'}
           rows={12} className="w-full px-4 py-3 rounded-xl text-xs font-mono resize-none"
           style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text, lineHeight: 1.6 }} />
         {jsonMesaj && (
           <p className="text-xs font-semibold font-display"
             style={{ color: jsonMesaj.startsWith('✓') ? '#70D090' : '#E08080' }}>{jsonMesaj}</p>
         )}
         <motion.button whileTap={{ scale: 0.98 }} onClick={topluIcerAktar}
           disabled={!jsonInput.trim() || jsonYukleniyor}
           className="w-full py-4 rounded-2xl font-display text-sm font-semibold disabled:opacity-40"
           style={{ background: `linear-gradient(135deg, ${t.accent}, #8B5020)`, color: '#FAF0D0' }}>
           {jsonYukleniyor ? 'Yükleniyor...' : 'Firebase\'e Aktar →'}
         </motion.button>
       </div>
     ) : (
       <div className="flex-1 flex overflow-hidden">

         {/* Sol — filtreler + liste */}
         <div className="flex-1 flex flex-col min-w-0 md:max-w-md md:border-r relative" style={{ borderColor: t.border }}>

           {/* Arama + Filtre bar */}
           <div className="px-5 py-3 flex-shrink-0 border-b flex flex-col gap-2" style={{ borderColor: t.border }}>
             <div className="flex gap-2 items-center">
               <input value={aramaFiltre} onChange={e => setAramaFiltre(e.target.value)}
                 placeholder="Ara..." className="flex-1 px-4 py-2 rounded-xl text-sm"
                 style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }} />

               {/* Filtre ikon butonu */}
               <div className="relative flex-shrink-0">
                 <button onClick={() => setFiltreAcik(f => !f)}
                   className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                   style={{
                     background: aktifFiltreSayisi > 0 ? `${t.accent}20` : t.bg2,
                     border: `1.5px solid ${aktifFiltreSayisi > 0 ? t.accent : t.border}`,
                     color: aktifFiltreSayisi > 0 ? t.accent : t.dim,
                   }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                     <line x1="4" y1="6" x2="20" y2="6"/>
                     <line x1="8" y1="12" x2="16" y2="12"/>
                     <line x1="11" y1="18" x2="13" y2="18"/>
                   </svg>
                   {aktifFiltreSayisi > 0 && (
                     <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                       style={{ background: t.accent, color: '#FAF0D0' }}>{aktifFiltreSayisi}</span>
                   )}
                 </button>
                 <FiltreDropdown acik={filtreAcik} onKapat={() => setFiltreAcik(false)}
                   sekme={sekme} items={items} filtreler={filtreler} setFiltreler={setFiltreler} t={t} />
               </div>

               <button onClick={() => { setSecimModu(f => !f); setSeciliIds(new Set()) }}
                 className="px-3 py-2 rounded-xl font-display text-xs font-semibold flex-shrink-0"
                 style={{
                   background: secimModu ? `${t.accent}20` : t.bg2,
                   border: `1.5px solid ${secimModu ? t.accent : t.border}`,
                   color: secimModu ? t.accent2 : t.dim,
                 }}>Seç</button>
             </div>

             {/* Aktif filtre chip'leri */}
             {aktifChipler.length > 0 && (
               <div className="flex gap-1.5 flex-wrap">
                 {aktifChipler.map(chip => (
                   <span key={`${chip.key}-${chip.val}`}
                     className="flex items-center gap-1 px-2.5 py-1 rounded-full font-display text-[10px] font-semibold"
                     style={{ background: `${t.accent}20`, border: `1px solid ${t.accent}40`, color: t.accent2 }}>
                     {chip.label}
                     <button onClick={() => chipKaldir(chip.key, chip.val)}
                       className="w-3.5 h-3.5 rounded-full flex items-center justify-center ml-0.5"
                       style={{ background: `${t.accent}40`, color: t.accent2 }}>×</button>
                   </span>
                 ))}
                 <button onClick={() => setFiltreler({ kurulId: [], ders: [], yil: [] })}
                   className="px-2.5 py-1 rounded-full font-display text-[10px] font-semibold"
                   style={{ background: 'rgba(139,58,58,0.15)', color: '#E08080' }}>Temizle</button>
               </div>
             )}

             {/* Durum */}
             <div className="flex items-center justify-between">
               <span className="text-[10px]" style={{ color: t.dim }}>{filtrelenmis.length} kayıt</span>
               {secimModu && (
                 <div className="flex items-center gap-2">
                   <button onClick={() => setSeciliIds(tumSecili ? new Set() : new Set(filtrelenmis.map(i => i.id)))}
                     className="text-[10px] font-semibold font-display" style={{ color: t.accent }}>
                     {tumSecili ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                   </button>
                   <span className="text-[10px]" style={{ color: t.dim }}>{seciliIds.size} seçili</span>
                 </div>
               )}
             </div>
           </div>

           {/* Liste */}
           <div ref={listeRef} className="flex-1 px-5 py-3 overflow-y-auto flex flex-col gap-1.5 relative z-10 pb-20">
             {yukleniyor ? (
               <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Yükleniyor...</p>
             ) : filtrelenmis.length === 0 ? (
               <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Kayıt bulunamadı.</p>
             ) : (
               filtrelenmis.map((item, idx) => (
                 <div key={item.id} id={`soru-${item.id}`}>
                   <SoruKart item={item}
                     tip={sekme === 'flashcardlar' ? 'flash' : sekme === 'cikmislar' ? 'cikmis' : 'soru'}
                     onDuzenle={setDuzenleItem} onSil={sil} t={t}
                     secimModu={secimModu} secili={seciliIds.has(item.id)} onSec={secToggle}
                     aktif={duzenleItem?.id === item.id} sirano={idx + 1} />
                 </div>
               ))
             )}
           </div>

           <AnimatePresence>
             {secimModu && seciliIds.size > 0 && (
               <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                 className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 z-20"
                 style={{ background: `linear-gradient(to top, ${t.bg} 60%, transparent)` }}>
                 <button onClick={() => setTopluSilOnay(true)}
                   className="w-full py-4 rounded-2xl font-display text-sm font-semibold"
                   style={{ background: 'linear-gradient(135deg, #8B3A3A, #6B2A2A)', color: '#FFD0D0' }}>
                   {seciliIds.size} kaydı sil
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
         </div>

         {/* Sağ — düzenleme paneli (md+) */}
         <div className="hidden md:flex flex-1 flex-col border-l overflow-hidden" style={{ borderColor: t.border }}>
           {duzenleItem ? (
             <>
               <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: t.border }}>
                 <div className="flex items-center gap-2">
                   <span className="font-display text-sm font-semibold" style={{ color: t.text }}>Düzenle</span>
                   <span className="text-xs px-2 py-0.5 rounded-full"
                     style={{ background: `${t.accent}20`, color: t.accent }}>#{duzenleIndex + 1}</span>
                 </div>
                 <button onClick={() => setDuzenleItem(null)}
                   className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                   style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.dim }}>✕</button>
               </div>
               <div className="flex-1 overflow-y-auto px-5 py-4">
                 <DuzenleForm item={duzenleItem} alanlar={alanlar} onKaydet={kaydet}
                   onKapat={() => setDuzenleItem(null)}
                   onSonraki={sonrakiSoru} onOnceki={oncekiSoru}
                   siradakiVar={duzenleIndex < filtrelenmis.length - 1}
                   oncekiVar={duzenleIndex > 0}
                   soruIndex={duzenleIndex} toplamSoru={filtrelenmis.length}
                   t={t} inline />
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center gap-3">
               <div className="w-14 h-14 rounded-full flex items-center justify-center"
                 style={{ background: `${t.accent}15`, border: `1px solid ${t.border}` }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5">
                   <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                   <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                 </svg>
               </div>
               <p className="font-display text-sm text-center" style={{ color: t.dim }}>Düzenlemek için bir kayda tıkla</p>
               <p className="text-xs text-center" style={{ color: `${t.dim}60` }}>{filtrelenmis.length} kayıt</p>
             </div>
           )}
         </div>
       </div>
     )}

     {/* Toplu silme onay */}
     <AnimatePresence>
       {topluSilOnay && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center px-6"
           style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
             className="w-full max-w-[320px] rounded-2xl p-6 flex flex-col gap-4"
             style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
             <div className="text-center">
               <p className="font-display text-lg font-bold mb-2" style={{ color: t.text }}>Emin misin?</p>
               <p className="text-sm" style={{ color: t.dim }}>{seciliIds.size} kayıt kalıcı olarak silinecek.</p>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setTopluSilOnay(false)} className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                 style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>İptal</button>
               <button onClick={topluSil} className="flex-1 py-3 rounded-xl font-display text-sm font-semibold"
                 style={{ background: 'linear-gradient(135deg, #8B3A3A, #6B2A2A)', color: '#FFD0D0' }}>Sil</button>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>

     {/* Mobil düzenleme modal */}
     <AnimatePresence>
       {duzenleItem && (
         <div className="md:hidden">
           <DuzenleForm item={duzenleItem} alanlar={alanlar} onKaydet={kaydet} onKapat={() => setDuzenleItem(null)}
             onSonraki={sonrakiSoru} onOnceki={oncekiSoru}
             siradakiVar={duzenleIndex < filtrelenmis.length - 1}
             oncekiVar={duzenleIndex > 0}
             soruIndex={duzenleIndex} toplamSoru={filtrelenmis.length}
             t={t} />
         </div>
       )}
     </AnimatePresence>
   </motion.div>
 )
}
