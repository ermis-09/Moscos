// Baz temalar
export const bazTemalar = {
  home: {
    bg: '#1A1710', bg2: '#221F15', bg3: '#2C2818',
    accent: '#C8771A', accent2: '#E09030', gold: '#F0B050',
    text: '#E8D5A3', dim: '#A89060',
    border: 'rgba(200,119,26,0.2)', borderS: 'rgba(200,119,26,0.45)',
    triangle: 'rgba(200,119,26,0.1)',
  },
  sinav: {
    bg: '#111820', bg2: '#182030', bg3: '#1E2838',
    accent: '#3A7CC8', accent2: '#5090E0', gold: '#80B8F8',
    text: '#C8DCF0', dim: '#6080A0',
    border: 'rgba(58,124,200,0.2)', borderS: 'rgba(58,124,200,0.45)',
    triangle: 'rgba(58,124,200,0.1)',
  },
  flash: {
    bg: '#101A14', bg2: '#162018', bg3: '#1C2A1E',
    accent: '#2E8B57', accent2: '#40A868', gold: '#70D090',
    text: '#B8E0C8', dim: '#508060',
    border: 'rgba(46,139,87,0.2)', borderS: 'rgba(46,139,87,0.45)',
    triangle: 'rgba(46,139,87,0.1)',
  },
  sim: {
    bg: '#181018', bg2: '#201520', bg3: '#281C28',
    accent: '#8B3AC8', accent2: '#A050E0', gold: '#C880F8',
    text: '#D8C0F0', dim: '#806090',
    border: 'rgba(139,58,200,0.2)', borderS: 'rgba(139,58,200,0.45)',
    triangle: 'rgba(139,58,200,0.1)',
  },
}

// Renk seçenekleri
export const renkSecenekleri = {
  sinav: {
    mavi:    { accent: '#3A7CC8', accent2: '#5090E0', bg: '#111820', bg2: '#182030', bg3: '#1E2838', text: '#C8DCF0', dim: '#6080A0', border: 'rgba(58,124,200,0.2)', borderS: 'rgba(58,124,200,0.45)', triangle: 'rgba(58,124,200,0.1)' },
    kirmizi: { accent: '#C83A3A', accent2: '#E05050', bg: '#201010', bg2: '#301818', bg3: '#381E1E', text: '#F0C8C8', dim: '#A06060', border: 'rgba(200,58,58,0.2)', borderS: 'rgba(200,58,58,0.45)', triangle: 'rgba(200,58,58,0.1)' },
    turkuaz: { accent: '#2A9B9B', accent2: '#35B8B8', bg: '#0E1A1A', bg2: '#142424', bg3: '#1A2E2E', text: '#B8E0E0', dim: '#508080', border: 'rgba(42,155,155,0.2)', borderS: 'rgba(42,155,155,0.45)', triangle: 'rgba(42,155,155,0.1)' },
  },
  flash: {
    yesil: { accent: '#2E8B57', accent2: '#40A868', bg: '#101A14', bg2: '#162018', bg3: '#1C2A1E', text: '#B8E0C8', dim: '#508060', border: 'rgba(46,139,87,0.2)', borderS: 'rgba(46,139,87,0.45)', triangle: 'rgba(46,139,87,0.1)' },
    pembe: { accent: '#C83A8B', accent2: '#E050A8', bg: '#200E18', bg2: '#301424', bg3: '#3A1A2C', text: '#F0C8E0', dim: '#A06088', border: 'rgba(200,58,139,0.2)', borderS: 'rgba(200,58,139,0.45)', triangle: 'rgba(200,58,139,0.1)' },
    sari:  { accent: '#B89020', accent2: '#D4AC30', bg: '#1A1808', bg2: '#242210', bg3: '#2E2C18', text: '#F0E0A0', dim: '#908040', border: 'rgba(184,144,32,0.2)', borderS: 'rgba(184,144,32,0.45)', triangle: 'rgba(184,144,32,0.1)' },
  },
  sim: {
    mor:     { accent: '#8B3AC8', accent2: '#A050E0', bg: '#181018', bg2: '#201520', bg3: '#281C28', text: '#D8C0F0', dim: '#806090', border: 'rgba(139,58,200,0.2)', borderS: 'rgba(139,58,200,0.45)', triangle: 'rgba(139,58,200,0.1)' },
    turuncu: { accent: '#C86020', accent2: '#E07838', bg: '#1A1008', bg2: '#241810', bg3: '#2E2018', text: '#F0D0B0', dim: '#A07040', border: 'rgba(200,96,32,0.2)', borderS: 'rgba(200,96,32,0.45)', triangle: 'rgba(200,96,32,0.1)' },
    gri:     { accent: '#7A8A9A', accent2: '#909FAF', bg: '#101418', bg2: '#181C22', bg3: '#20242C', text: '#C8D0D8', dim: '#607080', border: 'rgba(122,138,154,0.2)', borderS: 'rgba(122,138,154,0.45)', triangle: 'rgba(122,138,154,0.1)' },
  },
}

// Ana fonksiyon — ayarlara göre tema döndür
export function temaAl(theme, ayarlar) {
  const baz = { ...bazTemalar[theme] }
  if (!ayarlar) return baz

  const renkMap = {
    sinav: ayarlar.sinavRenk,
    flash: ayarlar.flashRenk,
    sim:   ayarlar.simRenk,
  }

  const secim = renkMap[theme]
  if (secim && renkSecenekleri[theme]?.[secim]) {
    return { ...baz, ...renkSecenekleri[theme][secim] }
  }

  return baz
}
