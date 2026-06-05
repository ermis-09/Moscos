// ─── VARSAYILAN PALET ───────────────────────────────────────────────
export const VARSAYILAN_AYARLAR = {
  anaRenk: 'sicak',
  sinavAksent: '#4A8CD8',
  flashAksent: '#3A9B67',
  simAksent: '#9B4AD8',
  butonBoyutu: 'orta',
  yaziBoyutu: 'normal',
}

// Önerilen renkler paleti
export const RENK_PALETI = [
  // Maviler
  '#4A8CD8', '#5BA3E8', '#3A7CC8', '#2A6AB8',
  // Yeşiller
  '#3A9B67', '#2E8B57', '#4AB877', '#5ACC88',
  // Morlar
  '#9B4AD8', '#8B3AC8', '#B060F0', '#7030B0',
  // Kırmızılar
  '#D84A4A', '#C83A3A', '#E86060', '#B83030',
  // Turuncular
  '#D8804A', '#C87030', '#E89060', '#B86020',
  // Turkuazlar
  '#3AABB8', '#2A9BA8', '#4ABBC8', '#5ACCD8',
  // Pembe
  '#D84A9B', '#C83A8B', '#E860B0', '#B83080',
  // Sarılar
  '#C8A030', '#B89020', '#D8B040', '#A08020',
  // Gri
  '#7A8A9A', '#6A7A8A', '#8A9AAA', '#9AAAБА',
]

// Aksent renginden tam tema türet
function temaTuret(aksent, koyuluk = 'koyu') {
  const r = parseInt(aksent.slice(1, 3), 16)
  const g = parseInt(aksent.slice(3, 5), 16)
  const b = parseInt(aksent.slice(5, 7), 16)

  return {
    bg:      `rgb(${Math.round(r*0.05 + 8)}, ${Math.round(g*0.05 + 8)}, ${Math.round(b*0.05 + 8)})`,
    bg2:     `rgb(${Math.round(r*0.08 + 10)}, ${Math.round(g*0.08 + 10)}, ${Math.round(b*0.08 + 10)})`,
    bg3:     `rgb(${Math.round(r*0.11 + 12)}, ${Math.round(g*0.11 + 12)}, ${Math.round(b*0.11 + 12)})`,
    accent:  aksent,
    accent2: `rgb(${Math.min(255, Math.round(r*1.15 + 10))}, ${Math.min(255, Math.round(g*1.15 + 10))}, ${Math.min(255, Math.round(b*1.15 + 10))})`,
    // text ve dim daha soluk — beyaza değil griye yakın
    text:    `rgb(${Math.min(220, Math.round(r*0.25 + 140))}, ${Math.min(220, Math.round(g*0.25 + 140))}, ${Math.min(220, Math.round(b*0.25 + 140))})`,
    dim:     `rgb(${Math.min(160, Math.round(r*0.2 + 60))}, ${Math.min(160, Math.round(g*0.2 + 60))}, ${Math.min(160, Math.round(b*0.2 + 60))})`,
    border:  `rgba(${r}, ${g}, ${b}, 0.15)`,
    borderS: `rgba(${r}, ${g}, ${b}, 0.35)`,
    triangle:`rgba(${r}, ${g}, ${b}, 0.07)`,
  }
}


// Ana sayfa tonu varyantları
const ANA_TONLAR = {
  sicak: {
    bg: '#161410', bg2: '#1E1B14', bg3: '#262218',
    accent: '#C8771A', accent2: '#D8901A',
    text: '#E0CFA0', dim: '#907850',
    border: 'rgba(200,119,26,0.18)', borderS: 'rgba(200,119,26,0.40)',
    triangle: 'rgba(200,119,26,0.08)',
  },
  soguk: {
    bg: '#111416', bg2: '#181C20', bg3: '#20242A',
    accent: '#7A8A9A', accent2: '#90A0B0',
    text: '#C0CAD4', dim: '#586470',
    border: 'rgba(122,138,154,0.18)', borderS: 'rgba(122,138,154,0.40)',
    triangle: 'rgba(122,138,154,0.08)',
  },
  aydinlik: {
    bg: '#181714', bg2: '#222018', bg3: '#2C2A20',
    accent: '#A09070', accent2: '#B8A880',
    text: '#E8E0CC', dim: '#807060',
    border: 'rgba(160,144,112,0.18)', borderS: 'rgba(160,144,112,0.40)',
    triangle: 'rgba(160,144,112,0.08)',
  },
}

// Uyumlama haritası
export const UYUMLAMA = {
  sicak: {
    anaRenk: 'sicak',
    sinavAksent: '#D85050',
    flashAksent: '#C8A030',
    simAksent: '#C87030',
  },
  soguk: {
    anaRenk: 'soguk',
    sinavAksent: '#4A8CD8',
    flashAksent: '#3A9B67',
    simAksent: '#7A8A9A',
  },
  aydinlik: {
    anaRenk: 'aydinlik',
    sinavAksent: '#5090D0',
    flashAksent: '#3A9B67',
    simAksent: '#9B4AD8',
  },
}


// Ana fonksiyon
export function temaAl(theme, ayarlar) {
  if (!ayarlar) return temaTuret('#4A8CD8')

  if (theme === 'home') {
    return { ...ANA_TONLAR[ayarlar.anaRenk || 'sicak'] }
  }

  const aksentMap = {
    sinav: ayarlar.sinavAksent || VARSAYILAN_AYARLAR.sinavAksent,
    flash: ayarlar.flashAksent || VARSAYILAN_AYARLAR.flashAksent,
    sim:   ayarlar.simAksent   || VARSAYILAN_AYARLAR.simAksent,
  }

  return temaTuret(aksentMap[theme] || '#4A8CD8')
}
