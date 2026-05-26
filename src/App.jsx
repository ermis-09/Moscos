import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { db, auth } from './lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useMoscosStore } from './store'
import Home from './pages/Home'
import Sinav from './pages/Sinav'
import SinavFiltre from './pages/SinavFiltre'
import SinavCoz from './pages/SinavCoz'
import SinavSonuc from './pages/SinavSonuc'
import Flashcard from './pages/Flashcard'
import FlashFiltre from './pages/FlashFiltre'
import SimFiltre from './pages/SimFiltre'
import Profil from './pages/Profil'
import Admin from './pages/Admin'
import SimulasyonSonuc from './pages/SimulasyonSonuc'
import { doc, getDoc } from 'firebase/firestore'
import Ayarlar from './pages/Ayarlar'


function DataLoader() {
  const setVeri = useMoscosStore(s => s.setVeri)
  const setKullanici = useMoscosStore(s => s.setKullanici)
  const setAyarlar = useMoscosStore(s => s.setAyarlar)

  useEffect(() => {
    // Auth
    const unsub = onAuthStateChanged(auth, async user => {
  setKullanici(user)
  if (user) {
    try {
      const snap = await getDoc(doc(db, 'kullanici_ayarlari', user.uid))
      if (snap.exists()) setAyarlar(snap.data())
    } catch (err) {
      console.error(err)
    }
  }
})

    // Veriler
    async function yukle() {
  // Önce kurullar.json'ı yükle
  try {
    const kurullarRes = await fetch('../data/kurullar.json')
    setVeri('kurullarData', await kurullarRes.json())
  } catch (err) {
    console.error('kurullar.json hatası:', err)
  }

  // Sonra Firebase'i yükle
  try {
    const [soruSnap, cikmisSnap, flashSnap] = await Promise.all([
      getDocs(collection(db, 'sorular')),
      getDocs(collection(db, 'cikmis_sorular')),
      getDocs(collection(db, 'flashcardlar')),
    ])
    setVeri('sorular', soruSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setVeri('cikmislar', cikmisSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setVeri('flashcardlar', flashSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (err) {
    console.error('Firebase hatası:', err)
    setTimeout(yukle, 3000)
  } finally {
    setVeri('yukleniyor', false)
  }
}



    yukle()
    return () => unsub()
  }, [])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/sinav" element={<Sinav />} />
        <Route path="/sinav/filtre" element={<SinavFiltre />} />
        <Route path="/sinav/coz" element={<SinavCoz />} />
        <Route path="/sinav/sonuc" element={<SinavSonuc />} />
        <Route path="/flashcard" element={<Flashcard />} />
        <Route path="/flashcard/filtre" element={<FlashFiltre />} />
        <Route path="/simulasyon/filtre" element={<SimFiltre />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/simulasyon/sonuc" element={<SimulasyonSonuc />} />
        <Route path="/ayarlar" element={<Ayarlar />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DataLoader />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
