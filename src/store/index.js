import { create } from 'zustand'

export const useMoscosStore = create((set, get) => ({
  // Veriler
  sorular: [],
  cikmislar: [],
  flashcardlar: [],
  kurullarData: null,
  yukleniyor: true,

  // Seçimler
  secim: {
    mod: null,       // 'sinav' | 'flashcard' | 'simulasyon'
    donem: null,
    kurulId: null,
    ders: null,
    yil: null,
    sinav: null,
  },

  // Auth
  kullanici: null,

  // Aktif sınav
  aktivSinav: {
  sorular: [],
  cevaplar: {},
  mod: null,
  aktifIndex: 0,
  tamamlandi: false,
},

anaSayfaIndex: 0,

ayarlar: {
  sinavRenk: 'mavi',
  flashRenk: 'yesil',
  simRenk: 'mor',
  butonBoyutu: 'orta',
  yaziBoyutu: 'normal',
},


  // Actions
setAnaSayfaIndex: (index) => set({ anaSayfaIndex: index }),

setAyarlar: (yeniAyarlar) => set(state => ({
  ayarlar: { ...state.ayarlar, ...yeniAyarlar }
})),

  setVeri: (key, val) => set({ [key]: val }),

  setSecim: (key, val) => set(state => ({
    secim: { ...state.secim, [key]: val }
  })),

  secimSifirla: () => set({
    secim: {
      mod: null, donem: null, kurulId: null,
      ders: null, yil: null, sinav: null,
    }
  }),

  setKullanici: (kullanici) => set({ kullanici }),

  sinavBaslat: (sorular, mod) => set({
    aktivSinav: { sorular, cevaplar: {}, mod }
  }),

  cevapVer: (index, harf) => set(state => ({
    aktivSinav: {
      ...state.aktivSinav,
      cevaplar: { ...state.aktivSinav.cevaplar, [index]: harf }
    }
  })),

  aktifIndexGuncelle: (index) => set(state => ({
  aktivSinav: { ...state.aktivSinav, aktifIndex: index }
})),

sinavTamamla: () => set(state => ({
  aktivSinav: { ...state.aktivSinav, tamamlandi: true }
})),



  // Filtrelenmiş sorular
  uygunSorular: () => {
    const { sorular, secim } = get()
    return sorular.filter(s => {
      if (secim.donem && s.donem !== secim.donem) return false
      if (secim.kurulId && s.kurulId !== secim.kurulId) return false
      if (secim.ders && s.ders !== secim.ders) return false
      return true
    })
  },

  uygunCikmislar: () => {
    const { cikmislar, secim } = get()
    return cikmislar
      .filter(s => {
        if (secim.yil && s.yil !== secim.yil) return false
        if (secim.sinav && s.sinav !== secim.sinav) return false
        return true
      })
      .sort((a, b) => (a.sira || 0) - (b.sira || 0))
  },
}))
