import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
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

function SoruKart({ item, onDuzenle, onSil, tip, t }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
      <div className="flex items-center gap-2 flex-wrap">
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
    </div>
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
  const [filtre, setFiltre] = useState('')
  const [yilFiltre, setYilFiltre] = useState('')
  const [duzenleItem, setDuzenleItem] = useState(null)
  const [adminMi, setAdminMi] = useState(false)

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
    if (!adminMi) return
    yukle()
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

  async function girisYap() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    setKullanici(result.user)
  }

  const filtrelenmis = items.filter(item => {
    if (yilFiltre && item.yil !== yilFiltre) return false
    if (!filtre) return true
    const aramaMetni = filtre.toLowerCase()
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
  const yillar = [...new Set(items.map(i => i.yil).filter(Boolean))].sort((a, b) => b - a)

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
          <div className="flex gap-2 px-5 pb-3 flex-shrink-0">
            {[
              { id: 'sorular', label: 'Sorular' },
              { id: 'cikmislar', label: 'Çıkmışlar' },
              { id: 'flashcardlar', label: 'Flashcard' },
            ].map(s => (
              <button key={s.id} onClick={() => { setSekme(s.id); setYilFiltre('') }}
                className="flex-1 py-2.5 rounded-xl font-display text-xs font-semibold transition-all"
                style={{
                  background: sekme === s.id ? t.accent : t.bg2,
                  color: sekme === s.id ? '#FAF0D0' : t.dim,
                  border: `1px solid ${sekme === s.id ? t.accent2 : t.border}`,
                }}>{s.label}</button>
            ))}
          </div>

          <div className="px-5 pb-3 flex-shrink-0">
            <input value={filtre} onChange={e => setFiltre(e.target.value)}
              placeholder={sekme === 'cikmislar' ? "Kurul, ders, yıl veya sınav ara..." : "Kurul, ders veya soru ara..."}
              className="w-full px-4 py-2.5 rounded-xl text-sm"
              style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }} />
          </div>

          {sekme === 'cikmislar' && yillar.length > 0 && (
            <div className="px-5 pb-3 flex-shrink-0 flex gap-2 overflow-x-auto">
              <button onClick={() => setYilFiltre('')}
                className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold flex-shrink-0"
                style={{
                  background: yilFiltre === '' ? t.accent : t.bg2,
                  border: `1px solid ${yilFiltre === '' ? t.accent2 : t.border}`,
                  color: yilFiltre === '' ? '#FAF0D0' : t.dim,
                }}>Tümü</button>
              {yillar.map(yil => (
                <button key={yil} onClick={() => setYilFiltre(yil)}
                  className="px-3 py-1.5 rounded-lg font-display text-xs font-semibold flex-shrink-0"
                  style={{
                    background: yilFiltre === yil ? t.accent : t.bg2,
                    border: `1px solid ${yilFiltre === yil ? t.accent2 : t.border}`,
                    color: yilFiltre === yil ? '#FAF0D0' : t.dim,
                  }}>{yil}</button>
              ))}
            </div>
          )}

          <main className="flex-1 px-5 pb-6 overflow-y-auto flex flex-col gap-2 relative z-10">
            {yukleniyor ? (
              <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Yükleniyor...</p>
            ) : filtrelenmis.length === 0 ? (
              <p className="text-sm italic text-center py-8" style={{ color: t.dim }}>Kayıt bulunamadı.</p>
            ) : (
              filtrelenmis.map(item => (
                <SoruKart key={item.id} item={item}
                  tip={sekme === 'flashcardlar' ? 'flash' : sekme === 'cikmislar' ? 'cikmis' : 'soru'}
                  onDuzenle={setDuzenleItem} onSil={sil} t={t} />
              ))
            )}
          </main>
        </>
      )}

      <AnimatePresence>
        {duzenleItem && (
          <DuzenleModal item={duzenleItem} alanlar={alanlar}
            onKaydet={kaydet} onKapat={() => setDuzenleItem(null)} t={t} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
