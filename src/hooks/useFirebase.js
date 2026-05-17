import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export function useSorular() {
  const [sorular, setSorular] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    async function yukle() {
      try {
        const snap = await getDocs(collection(db, 'sorular'))
        setSorular(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        setHata(err.message)
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [])

  return { sorular, yukleniyor, hata }
}

export function useCikmisSorular() {
  const [cikmislar, setCikmislar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    async function yukle() {
      try {
        const snap = await getDocs(collection(db, 'cikmis_sorular'))
        setCikmislar(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        setHata(err.message)
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [])

  return { cikmislar, yukleniyor, hata }
}

export function useFlashcardlar() {
  const [flashcardlar, setFlashcardlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function yukle() {
      try {
        const snap = await getDocs(collection(db, 'flashcardlar'))
        setFlashcardlar(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setYukleniyor(false)
      }
    }
    yukle()
  }, [])

  return { flashcardlar, yukleniyor }
}
