import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { useMoscosStore } from '../store'
import { themes } from '../components/AppShell'

const t = themes.home

export default function Profil() {
  const navigate = useNavigate()
  const kullanici = useMoscosStore(s => s.kullanici)
  const setKullanici = useMoscosStore(s => s.setKullanici)

  const [sonuclar, setSonuclar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => {
    if (!kullanici) return
    async function yukle() {
      setYukleniyor(true)
      try {
        const q = query(
          collection(db, 'kullanici_sonuclari', kullanici.uid, 'sonuclar'),
          orderBy('tarih', 'desc'),
          limit(3)
        )
        const snap = await getDocs(q)
        setSonuclar(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [kullanici])

  async function girisYap() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      setKullanici(result.user)
    } catch (err) {
      console.error(err)
    }
  }

  async function cikisYap() {
    await signOut(auth)
    setKullanici(null)
    setSonuclar([])
  }

  // İstatistikler
  const toplamSinav = sonuclar.length
  const toplamSoru = sonuclar.reduce((acc, s) => acc + (s.toplam || 0), 0)
  const ortalama = toplamSinav > 0
    ? Math.round(sonuclar.reduce((acc, s) => acc + (s.yuzde || 0), 0) / toplamSinav)
    : 0

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
        <polygon points="0,0 0,260 180,0" fill="none" stroke="rgba(200,119,26,0.08)" strokeWidth="1"/>
        <polygon points="390,844 390,584 210,844" fill="none" stroke="rgba(200,119,26,0.08)" strokeWidth="1"/>
      </svg>

      {/* Köşe süsler */}
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
      <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 relative z-10">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: `${t.accent}18`, border: `1px solid ${t.border}`, color: t.accent2 }}
        >←</button>
        <span className="font-display text-base font-semibold" style={{ color: t.text }}>Profil</span>
        <div className="w-9" />
      </header>

      {/* İçerik */}
      <main className="flex-1 px-5 pb-6 flex flex-col gap-4 relative z-10 overflow-y-auto">

        {!kullanici ? (
          /* Giriş ekranı */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${t.accent}15`, border: `1px solid ${t.border}` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="8" r="5"/>
                <path d="M3 21c0-5 4-9 9-9s9 4 9 9"/>
              </svg>
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: t.text, letterSpacing: '-0.02em' }}>
                Giriş Yap
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: t.dim }}>
                İstatistiklerini görmek ve sınav geçmişini takip etmek için giriş yap.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={girisYap}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl font-display text-sm font-semibold"
              style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.text }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google ile Giriş Yap
            </motion.button>
          </div>
        ) : (
          <>
            {/* Kullanıcı kartı */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
              <img src={kullanici.photoURL} alt=""
                className="w-12 h-12 rounded-full flex-shrink-0"
                style={{ border: `2px solid ${t.accent}` }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: t.text }}>{kullanici.displayName}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: t.dim }}>{kullanici.email}</p>
              </div>
              <button onClick={cikisYap}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: t.bg3, border: `1px solid ${t.border}`, color: t.dim }}>
                Çıkış
              </button>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { num: toplamSinav, label: 'Sınav' },
                { num: toplamSoru, label: 'Soru' },
                { num: `%${ortalama}`, label: 'Ortalama' },
              ].map(({ num, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 py-4 rounded-xl"
                  style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
                  <span className="font-display text-2xl font-semibold leading-none" style={{ color: t.accent2 }}>{num}</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: t.dim }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Son sınavlar */}
            <div>
              <p className="font-display text-[9px] font-semibold tracking-[0.22em] uppercase mb-3" style={{ color: t.accent }}>
                Son Sınavlar
              </p>
              {yukleniyor ? (
                <p className="text-sm italic text-center py-4" style={{ color: t.dim }}>Yükleniyor...</p>
              ) : sonuclar.length === 0 ? (
                <p className="text-sm italic text-center py-4" style={{ color: t.dim }}>Henüz sınav yok.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sonuclar.map(s => {
                    const tarih = new Date(s.tarih).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long'
                    })
                    const renk = s.yuzde >= 75 ? '#70D090' : s.yuzde >= 50 ? t.accent2 : '#E08080'
                    return (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: t.bg2, border: `1px solid ${t.border}` }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: t.text }}>
                            {s.mod === 'simulasyon' ? `${s.yil} · ${s.sinav}` : `D${s.donem} · ${s.kurulId}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: t.dim }}>{tarih}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-semibold" style={{ color: renk }}>%{s.yuzde}</p>
                          <p className="text-xs" style={{ color: t.dim }}>{s.dogru}/{s.toplam}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </motion.div>
  )
}
