/* ============================================
   MOSCOS — Ana Sayfa
   Orbit UI — döner yörünge filtre sistemi
   ============================================ */

import { db, auth } from '../firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================================
// STATE
// ============================================

const state = {
  kurullarData: null,
  sorular: [],
  kullanici: null,
  adim: 'baslangic', // baslangic | mod | donem | kurul | ders
  secim: {
    mod: null,      // 'sinav' | 'flashcard'
    donem: null,
    kurulId: null,
    ders: null
  }
};

// ============================================
// DOM
// ============================================

const orbitCenter = document.getElementById('orbitCenter');
const centerLogo = document.getElementById('centerLogo');
const centerLabel = document.getElementById('centerLabel');
const orbitRing = document.getElementById('orbitRing');
const orbitTrack = document.getElementById('orbitTrack');
const orbitBreadcrumb = document.getElementById('orbitBreadcrumb');
const breadcrumbItems = document.getElementById('breadcrumbItems');
const orbitFooter = document.getElementById('orbitFooter');
const availableInfo = document.getElementById('availableInfo');
const footerBtns = document.getElementById('footerBtns');
const startSinavBtn = document.getElementById('startSinavBtn');
const startFlashBtn = document.getElementById('startFlashBtn');
const girisBtn = document.getElementById('girisBtn');
const profilBtn = document.getElementById('profilBtn');
const profilFoto = document.getElementById('profilFoto');
const profilAd = document.getElementById('profilAd');

// ============================================
// AUTH
// ============================================

onAuthStateChanged(auth, (user) => {
  state.kullanici = user;
  if (user) {
    girisBtn.hidden = true;
    profilBtn.hidden = false;
    profilFoto.src = user.photoURL || '';
    profilAd.textContent = user.displayName?.split(' ')[0] || 'Profil';
  } else {
    girisBtn.hidden = false;
    profilBtn.hidden = true;
  }
});

girisBtn.addEventListener('click', async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (err) { console.error(err); }
});

profilBtn.addEventListener('click', () => { window.location.href = 'profil.html'; });

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle() {
  try {
    const kurullarRes = await fetch('data/kurullar.json');
    state.kurullarData = await kurullarRes.json();
    const snapshot = await getDocs(collection(db, 'sorular'));
    state.sorular = snapshot.docs.map(d => d.data());
  } catch (err) {
    console.error(err);
  }
}

// ============================================
// MERKEZ BUTON
// ============================================

orbitCenter.addEventListener('click', () => {
  if (state.adim === 'baslangic') {
    modlariGoster();
  }
});

// Çift tıkla geri
let sonTiklama = 0;
orbitCenter.addEventListener('dblclick', () => {
  geriGit();
});

orbitTrack.addEventListener('dblclick', () => {
  geriGit();
});

function geriGit() {
  switch (state.adim) {
    case 'mod':
      state.secim.mod = null;
      state.adim = 'baslangic';
      orbitRing.hidden = true;
      orbitBreadcrumb.hidden = true;
      orbitFooter.hidden = true;
      orbitCenter.classList.remove('active');
      centerLabel.textContent = 'Moscos';
      break;
    case 'donem':
      state.secim.donem = null;
      state.adim = 'mod';
      modlariGoster();
      break;
    case 'kurul':
      state.secim.kurulId = null;
      state.adim = 'donem';
      donemleriGoster();
      break;
    case 'ders':
      state.secim.ders = null;
      state.adim = 'kurul';
      kurullariGoster(state.secim.donem);
      break;
  }
  breadcrumbGuncelle();
}

// ============================================
// ADIMLAR
// ============================================

function modlariGoster() {
  state.adim = 'mod';
  orbitCenter.classList.add('active');
  centerLabel.textContent = 'Ne yapalım?';

  const modlar = [
    { id: 'sinav', label: 'Sınav' },
    { id: 'flashcard', label: 'Flashcard' }
  ];

  kartlariCiz(modlar, (mod) => {
    state.secim.mod = mod.id;
    state.adim = 'donem';
    centerLabel.textContent = mod.label;
    donemleriGoster();
    breadcrumbGuncelle();
  });

  orbitRing.hidden = false;
  orbitFooter.hidden = true;
  footerBtns.hidden = true;
  breadcrumbGuncelle();
}

function donemleriGoster() {
  state.adim = 'donem';

  const donemIdleri = new Set(state.sorular.map(s => s.donem));
  const donemler = state.kurullarData.donemler
    .filter(d => donemIdleri.has(d.id))
    .map(d => ({
      id: d.id,
      label: `Dönem ${d.id}`,
      sayi: state.sorular.filter(s => s.donem === d.id).length
    }));

  kartlariCiz(donemler, (donem) => {
    state.secim.donem = donem.id;
    state.adim = 'kurul';
    kurullariGoster(donem.id);
    breadcrumbGuncelle();
  });
}

function kurullariGoster(donemId) {
  state.adim = 'kurul';

  const donem = state.kurullarData.donemler.find(d => d.id === donemId);
  const kurulIdleri = new Set(
    state.sorular.filter(s => s.donem === donemId).map(s => s.kurulId)
  );
  const kurullar = donem.kurullar
    .filter(k => kurulIdleri.has(k.id))
    .map(k => ({
      id: k.id,
      label: k.ad,
      sayi: state.sorular.filter(s => s.donem === donemId && s.kurulId === k.id).length
    }));

  kartlariCiz(kurullar, (kurul) => {
    state.secim.kurulId = kurul.id;
    state.adim = 'ders';
    dersleriGoster(donemId, kurul.id);
    breadcrumbGuncelle();
  });
}

function dersleriGoster(donemId, kurulId) {
  state.adim = 'ders';

  const dersler = [...new Set(
    state.sorular
      .filter(s => s.donem === donemId && s.kurulId === kurulId)
      .map(s => s.ders)
  )].map(ders => ({
    id: ders,
    label: ders,
    sayi: state.sorular.filter(
      s => s.donem === donemId && s.kurulId === kurulId && s.ders === ders
    ).length
  }));

  // "Tüm dersler" seçeneği ekle
  const tumDersler = {
    id: '',
    label: 'Tüm Dersler',
    sayi: state.sorular.filter(
      s => s.donem === donemId && s.kurulId === kurulId
    ).length,
    tumDersler: true
  };

  kartlariCiz([tumDersler, ...dersler], (ders) => {
    state.secim.ders = ders.id;
    dersSec(ders);
  });
}

function dersSec(ders) {
  // Aktif kartı işaretle
  orbitTrack.querySelectorAll('.orbit-card').forEach(k => {
    k.classList.toggle('active', k.dataset.id === ders.id);
  });

  const uygun = uygunSorulariSay();
  orbitFooter.hidden = false;
  availableInfo.textContent = `${uygun} soru`;
  availableInfo.classList.add('ready');

  if (uygun > 0) {
    footerBtns.hidden = false;
  } else {
    footerBtns.hidden = true;
    availableInfo.textContent = 'Bu seçimde soru yok';
    availableInfo.classList.remove('ready');
  }

  breadcrumbGuncelle();
}

// ============================================
// KARTLARI ÇİZ + SWIPE
// ============================================

function kartlariCiz(items, onSecim) {
  orbitTrack.innerHTML = '';

  items.forEach((item, i) => {
    const kart = document.createElement('button');
    kart.className = 'orbit-card' + (item.tumDersler ? ' all-card' : '');
    kart.dataset.id = item.id;
    kart.style.animationDelay = `${i * 0.05}s`;
    kart.innerHTML = `
      <span class="orbit-card-text">${item.label}</span>
      ${item.sayi !== undefined ? `<span class="orbit-card-badge">${item.sayi}</span>` : ''}
    `;
    kart.addEventListener('click', () => {
      orbitTrack.querySelectorAll('.orbit-card').forEach(k => k.classList.remove('active'));
      kart.classList.add('active');
      onSecim(item);
    });
    orbitTrack.appendChild(kart);
  });

  // Ortaya scroll
  setTimeout(() => {
    const firstCard = orbitTrack.querySelector('.orbit-card');
    if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 100);

  swipeEkle();
}

// Swipe/drag desteği
function swipeEkle() {
  let startX = 0;
  let scrollStart = 0;
  let isDragging = false;

  orbitTrack.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    scrollStart = orbitTrack.scrollLeft;
    orbitTrack.classList.add('grabbing');
  });

  orbitTrack.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    orbitTrack.scrollLeft = scrollStart - (e.pageX - startX);
  });

  orbitTrack.addEventListener('mouseup', () => {
    isDragging = false;
    orbitTrack.classList.remove('grabbing');
  });

  orbitTrack.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX;
    scrollStart = orbitTrack.scrollLeft;
  }, { passive: true });

  orbitTrack.addEventListener('touchmove', (e) => {
    orbitTrack.scrollLeft = scrollStart - (e.touches[0].pageX - startX);
  }, { passive: true });
}

// ============================================
// BREADCRUMB
// ============================================

function breadcrumbGuncelle() {
  breadcrumbItems.innerHTML = '';

  const adimlar = [];
  if (state.secim.mod) adimlar.push({ label: state.secim.mod === 'sinav' ? 'Sınav' : 'Flashcard', adim: 'mod' });
  if (state.secim.donem) adimlar.push({ label: `D${state.secim.donem}`, adim: 'donem' });
  if (state.secim.kurulId) adimlar.push({ label: state.secim.kurulId, adim: 'kurul' });
  if (state.secim.ders !== null && state.adim === 'ders') {
    adimlar.push({ label: state.secim.ders || 'Tüm Dersler', adim: 'ders' });
  }

  if (adimlar.length === 0) {
    orbitBreadcrumb.hidden = true;
    return;
  }

  orbitBreadcrumb.hidden = false;
  adimlar.forEach((a, i) => {
    const span = document.createElement('span');
    span.className = 'breadcrumb-item';
    span.textContent = a.label;
    breadcrumbItems.appendChild(span);

    if (i < adimlar.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '›';
      breadcrumbItems.appendChild(sep);
    }
  });
}

// ============================================
// YARDIMCILAR
// ============================================

function uygunSorulariSay() {
  if (!state.secim.donem || !state.secim.kurulId) return 0;
  return state.sorular.filter(s => {
    if (s.donem !== state.secim.donem) return false;
    if (s.kurulId !== state.secim.kurulId) return false;
    if (state.secim.ders && s.ders !== state.secim.ders) return false;
    return true;
  }).length;
}

// ============================================
// BAŞLAT
// ============================================

startSinavBtn.addEventListener('click', () => {
  const veri = {
    ...state.secim,
    sayi: uygunSorulariSay(),
    sorular: state.sorular,
    kullaniciId: state.kullanici?.uid || null
  };
  sessionStorage.setItem('sinavSecim', JSON.stringify(veri));
  window.location.href = `sinav.html?data=${encodeURIComponent(JSON.stringify(veri))}`;
});

startFlashBtn.addEventListener('click', () => {
  const veri = {
    ...state.secim,
    sorular: state.sorular
  };
  sessionStorage.setItem('flashSecim', JSON.stringify(veri));
  window.location.href = 'flashcard.html';
});

// ============================================
// INIT
// ============================================

async function init() {
  await veriYukle();
}

init();
