/* ============================================
   MOSCOS — Ana Sayfa
   Kart tabanlı filtre, skeleton loader
   ============================================ */

import { db, auth } from '../firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const state = {
  kurullarData: null,
  sorular: [],
  secim: { donem: null, kurulId: null, ders: '', sayi: 30 },
  kullanici: null
};

// DOM
const skeleton = document.getElementById('skeleton');
const filterContent = document.getElementById('filterContent');
const stepDonem = document.getElementById('stepDonem');
const stepKurul = document.getElementById('stepKurul');
const stepDers = document.getElementById('stepDers');
const donemGrid = document.getElementById('donemGrid');
const kurulGrid = document.getElementById('kurulGrid');
const dersChips = document.getElementById('dersChips');
const availableInfo = document.getElementById('availableInfo');
const startBtn = document.getElementById('startBtn');
const footerInfo = document.getElementById('footerInfo');
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
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    console.error(err);
  }
});

profilBtn.addEventListener('click', () => {
  window.location.href = 'profil.html';
});

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle() {
  try {
    const kurullarRes = await fetch('data/kurullar.json');
    state.kurullarData = await kurullarRes.json();
    const snapshot = await getDocs(collection(db, 'sorular'));
    state.sorular = snapshot.docs.map(d => d.data());

    skeleton.hidden = true;
    filterContent.hidden = false;
    donemleriCiz();
  } catch (err) {
    skeleton.hidden = true;
    filterContent.hidden = false;
    console.error(err);
  }
}

// ============================================
// DÖNEM KARTLARI
// ============================================

function donemleriCiz() {
  donemGrid.innerHTML = '';
  const donemIdleri = new Set(state.sorular.map(s => s.donem));
  const donemler = state.kurullarData.donemler.filter(d => donemIdleri.has(d.id));

  if (donemler.length === 0) {
    donemGrid.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">Henüz soru yok.</p>';
    return;
  }

  donemler.forEach(donem => {
    const soruSayisi = state.sorular.filter(s => s.donem === donem.id).length;

    const kart = document.createElement('button');
    kart.className = 'donem-kart';
    kart.innerHTML = `
      <span class="donem-kart-num">${donem.id}</span>
      <span class="donem-kart-label">Dönem</span>
      <span class="donem-kart-sayi">${soruSayisi} soru</span>
    `;
    kart.addEventListener('click', () => donemSec(donem.id));
    donemGrid.appendChild(kart);
  });
}

// ============================================
// KURUL KARTLARI
// ============================================

function kurullariCiz(donemId) {
  kurulGrid.innerHTML = '';
  const donem = state.kurullarData.donemler.find(d => d.id === donemId);
  if (!donem) return;

  const kurulIdleri = new Set(
    state.sorular.filter(s => s.donem === donemId).map(s => s.kurulId)
  );
  const kurullar = donem.kurullar.filter(k => kurulIdleri.has(k.id));

  kurullar.forEach(kurul => {
    const soruSayisi = state.sorular.filter(
      s => s.donem === donemId && s.kurulId === kurul.id
    ).length;

    const kart = document.createElement('button');
    kart.className = 'kurul-kart';
    kart.innerHTML = `
      <span class="kurul-kart-ad">${kurul.ad}</span>
      <span class="kurul-kart-sayi">${soruSayisi} soru</span>
    `;
    kart.addEventListener('click', () => kurulSec(kurul.id));
    kurulGrid.appendChild(kart);
  });
}

// ============================================
// DERS CHİP'LERİ
// ============================================

function dersleriCiz(donemId, kurulId) {
  dersChips.innerHTML = '';

  const hepsi = chipOlustur('Tüm dersler', () => dersSec(''));
  hepsi.classList.add('active');
  hepsi.dataset.value = '';
  dersChips.appendChild(hepsi);

  const dersler = new Set(
    state.sorular
      .filter(s => s.donem === donemId && s.kurulId === kurulId)
      .map(s => s.ders)
  );

  dersler.forEach(ders => {
    const btn = chipOlustur(ders, () => dersSec(ders));
    btn.dataset.value = ders;
    dersChips.appendChild(btn);
  });
}

function chipOlustur(metin, onClick) {
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.textContent = metin;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

// ============================================
// SEÇİM MANTIĞI
// ============================================

function donemSec(donemId) {
  state.secim.donem = donemId;
  state.secim.kurulId = null;
  state.secim.ders = '';

  // Dönem kartını aktif yap
  donemGrid.querySelectorAll('.donem-kart').forEach(k => {
    k.classList.toggle('active', parseInt(k.querySelector('.donem-kart-num').textContent) === donemId);
  });

  kurullariCiz(donemId);

  // Kurul adımına geç
  stepDonem.hidden = true;
  stepKurul.hidden = false;
  stepDers.hidden = true;
  footerInfo.hidden = true;

  durumGuncelle();
}

function kurulSec(kurulId) {
  state.secim.kurulId = kurulId;
  state.secim.ders = '';

  kurulGrid.querySelectorAll('.kurul-kart').forEach(k => {
    const ad = k.querySelector('.kurul-kart-ad').textContent;
    const kurul = state.kurullarData.donemler
      .flatMap(d => d.kurullar)
      .find(ku => ku.ad === ad);
    k.classList.toggle('active', kurul?.id === kurulId);
  });

  dersleriCiz(state.secim.donem, kurulId);

  stepDers.hidden = false;
  footerInfo.hidden = false;

  durumGuncelle();
}

function dersSec(ders) {
  state.secim.ders = ders;
  dersChips.querySelectorAll('.chip').forEach(b => {
    b.classList.toggle('active', b.dataset.value === ders);
  });
  durumGuncelle();
}

// Geri butonları
document.getElementById('geriDonem').addEventListener('click', () => {
  state.secim.donem = null;
  state.secim.kurulId = null;
  state.secim.ders = '';
  stepDonem.hidden = false;
  stepKurul.hidden = true;
  stepDers.hidden = true;
  footerInfo.hidden = true;
  durumGuncelle();
});

document.getElementById('geriKurul').addEventListener('click', () => {
  state.secim.kurulId = null;
  state.secim.ders = '';
  stepKurul.hidden = true;
  stepDers.hidden = true;
  footerInfo.hidden = true;

  // Dönem adımına dön ama seçili kalma
  stepDonem.hidden = false;
  durumGuncelle();
});

// ============================================
// DURUM
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

function durumGuncelle() {
  const uygun = uygunSorulariSay();
  if (uygun === 0) {
    availableInfo.textContent = '';
    availableInfo.classList.remove('ready');
    startBtn.disabled = true;
    return;
  }

  // Soru sayısını dinamik tut
  state.secim.sayi = uygun;
  availableInfo.textContent = `${uygun} soru`;
  availableInfo.classList.add('ready');
  startBtn.disabled = false;
}

startBtn.addEventListener('click', () => {
  const veri = {
    ...state.secim,
    sorular: state.sorular,
    kullaniciId: state.kullanici?.uid || null
  };
  sessionStorage.setItem('sinavSecim', JSON.stringify(veri));
  window.location.href = `sinav.html?data=${encodeURIComponent(JSON.stringify(veri))}`;
});

veriYukle();
