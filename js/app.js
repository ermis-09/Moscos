/* ============================================
   MOSCOS — Ana Sayfa
   Retro Çark UI + Firebase
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
  cikmislar: [],
  kullanici: null,
  adim: 'kapali',
  secim: {
    mod: null,
    donem: null,
    kurulId: null,
    ders: null,
    yil: null,
    sinav: null
  }
};

// Çark state
let currentAngle = 0;
let targetAngle = 0;
let animFrame = null;
let isDragging = false;
let dragStartAngle = 0;
let dragStartRot = 0;
let orbitBtns = [];

const RADIUS = 105;

// ============================================
// DOM
// ============================================

const wheel = document.getElementById('wheel');
const centerBtn = document.getElementById('centerBtn');
const centerHint = document.getElementById('centerHint');
const breadcrumb = document.getElementById('breadcrumb');
const breadcrumbInner = document.getElementById('breadcrumbInner');
const infoText = document.getElementById('infoText');
const footerBtns = document.getElementById('footerBtns');
const startBtn = document.getElementById('startBtn');
const girisBtn = document.getElementById('girisBtn');
const profilBtn = document.getElementById('profilBtn');
const profilFoto = document.getElementById('profilFoto');

// ============================================
// AUTH
// ============================================

onAuthStateChanged(auth, (user) => {
  state.kullanici = user;
  if (user) {
    girisBtn.hidden = true;
    profilBtn.hidden = false;
    profilFoto.src = user.photoURL || '';
  } else {
    girisBtn.hidden = false;
    profilBtn.hidden = true;
  }
});

girisBtn.addEventListener('click', async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { console.error(e); }
});

profilBtn.addEventListener('click', () => { window.location.href = 'profil.html'; });

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle() {
  try {
    const kurullarRes = await fetch('data/kurullar.json');
    state.kurullarData = await kurullarRes.json();
    const snap1 = await getDocs(collection(db, 'sorular'));
    state.sorular = snap1.docs.map(d => d.data());
    const snap2 = await getDocs(collection(db, 'cikmis_sorular'));
    state.cikmislar = snap2.docs.map(d => d.data());
  } catch (err) {
    console.error(err);
  }
}

// ============================================
// ÇARK ANİMASYON
// ============================================

function animate() {
  const diff = targetAngle - currentAngle;
  currentAngle += diff * 0.12;
  updatePositions();
  if (Math.abs(diff) > 0.05) {
    animFrame = requestAnimationFrame(animate);
  } else {
    currentAngle = targetAngle;
    updatePositions();
    animFrame = null;
  }
}

function startAnimate() {
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(animate);
}

function updatePositions() {
  orbitBtns.forEach((btn, i) => {
    const n = orbitBtns.length;
    const baseAngle = (360 / n) * i;
    const totalAngle = baseAngle + currentAngle;
    const rad = (totalAngle * Math.PI) / 180;
    const cx = 145, cy = 145;
    const x = cx + RADIUS * Math.sin(rad) - 38;
    const y = cy - RADIUS * Math.cos(rad) - 38;
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
    // Yazıyı oku olacak şekilde döndür
    const inner = btn.querySelector('.r-orbit-inner');
    inner.style.transform = `rotate(${totalAngle}deg)`;
  });
}

// ============================================
// MERKEZ BUTON
// ============================================

centerBtn.addEventListener('click', () => {
  if (isDragging) return;
  if (state.adim === 'kapali') {
    menuyuAc();
  } else {
    geriGit();
  }
});

function menuyuAc() {
  state.adim = 'mod';
  centerBtn.classList.add('open');
  centerHint.textContent = 'kapat';
  infoText.textContent = 'Bir mod seç';
  infoText.classList.remove('active');

  const modlar = [
    { id: 'sinav', label: 'Sınav' },
    { id: 'flashcard', label: 'Flash\ncard' },
    { id: 'simulasyon', label: 'Simü\nlasyon' }
  ];

  kartlariCiz(modlar, (item) => {
    state.secim.mod = item.id;
    if (item.id === 'simulasyon') {
      state.adim = 'sim-yil';
      simYillariGoster();
    } else {
      state.adim = 'donem';
      donemleriGoster();
    }
    breadcrumbGuncelle();
  });
}

function geriGit() {
  switch (state.adim) {
    case 'mod':
      state.adim = 'kapali';
      state.secim = { mod: null, donem: null, kurulId: null, ders: null, yil: null, sinav: null };
      centerBtn.classList.remove('open');
      centerHint.textContent = 'aç';
      infoText.textContent = 'Çarkı döndür veya ortaya bas';
      infoText.classList.remove('active');
      orbitlariTemizle();
      footerBtns.hidden = true;
      breadcrumb.hidden = true;
      break;
    case 'donem':
      state.secim.donem = null;
      state.adim = 'mod';
      menuyuAc();
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
      footerBtns.hidden = true;
      break;
    case 'sim-yil':
      state.secim.yil = null;
      state.adim = 'mod';
      menuyuAc();
      break;
    case 'sim-sinav':
      state.secim.sinav = null;
      state.adim = 'sim-yil';
      simYillariGoster();
      footerBtns.hidden = true;
      break;
  }
  breadcrumbGuncelle();
}

// ============================================
// FİLTRE ADIMLARI
// ============================================

function donemleriGoster() {
  const donemIdleri = new Set(state.sorular.map(s => s.donem));
  const donemler = state.kurullarData.donemler
    .filter(d => donemIdleri.has(d.id))
    .map(d => ({
      id: d.id,
      label: `D${d.id}`,
      badge: state.sorular.filter(s => s.donem === d.id).length
    }));

  kartlariCiz(donemler, (item) => {
    state.secim.donem = item.id;
    state.adim = 'kurul';
    kurullariGoster(item.id);
    breadcrumbGuncelle();
  });
}

function kurullariGoster(donemId) {
  const donem = state.kurullarData.donemler.find(d => d.id === donemId);
  const kurulIdleri = new Set(
    state.sorular.filter(s => s.donem === donemId).map(s => s.kurulId)
  );
  const kurullar = donem.kurullar
    .filter(k => kurulIdleri.has(k.id))
    .map(k => ({
      id: k.id,
      label: k.ad,
      badge: state.sorular.filter(s => s.donem === donemId && s.kurulId === k.id).length
    }));

  kartlariCiz(kurullar, (item) => {
    state.secim.kurulId = item.id;
    state.adim = 'ders';
    dersleriGoster(donemId, item.id);
    breadcrumbGuncelle();
  });
}

function dersleriGoster(donemId, kurulId) {
  const dersler = [...new Set(
    state.sorular
      .filter(s => s.donem === donemId && s.kurulId === kurulId)
      .map(s => s.ders)
  )].map(ders => ({
    id: ders,
    label: ders,
    badge: state.sorular.filter(s => s.donem === donemId && s.kurulId === kurulId && s.ders === ders).length
  }));

  const tumDersler = {
    id: '',
    label: 'Tümü',
    badge: state.sorular.filter(s => s.donem === donemId && s.kurulId === kurulId).length,
    tumDersler: true
  };

  kartlariCiz([tumDersler, ...dersler], (item) => {
    state.secim.ders = item.id;
    orbitBtns.forEach(b => b.classList.toggle('selected', b.dataset.id === item.id));
    dersSec();
  });
}

function dersSec() {
  const uygun = uygunSorulariSay();
  if (uygun > 0) {
    infoText.textContent = `${uygun} soru hazır`;
    infoText.classList.add('active');
    footerBtns.hidden = false;
    startBtn.textContent = state.secim.mod === 'sinav' ? 'Sınava Başla →' : 'Flashcard Başla →';
  } else {
    infoText.textContent = 'Bu seçimde soru yok';
    infoText.classList.remove('active');
    footerBtns.hidden = true;
  }
}

// Simülasyon akışı
function simYillariGoster() {
  const yillar = [...new Set(state.cikmislar.map(s => s.yil))].sort((a, b) => b - a);
  const items = yillar.map(y => ({ id: y, label: String(y) }));

  kartlariCiz(items, (item) => {
    state.secim.yil = item.id;
    state.adim = 'sim-sinav';
    simSinavlariGoster(item.id);
    breadcrumbGuncelle();
  });
}

function simSinavlariGoster(yil) {
  const sinavlar = [...new Set(
    state.cikmislar.filter(s => s.yil === yil).map(s => s.sinav)
  )];
  const items = sinavlar.map(s => ({
    id: s,
    label: s,
    badge: state.cikmislar.filter(c => c.yil === yil && c.sinav === s).length
  }));

  kartlariCiz(items, (item) => {
    state.secim.sinav = item.id;
    orbitBtns.forEach(b => b.classList.toggle('selected', b.dataset.id === item.id));

    const uygun = state.cikmislar.filter(
      s => s.yil === state.secim.yil && s.sinav === item.id
    ).length;

    infoText.textContent = `${uygun} soru hazır`;
    infoText.classList.add('active');
    footerBtns.hidden = false;
    startBtn.textContent = 'Simülasyona Başla →';
    breadcrumbGuncelle();
  });
}

// ============================================
// KARTLARI ÇİZ
// ============================================

function kartlariCiz(items, onSecim) {
  orbitlariTemizle();
  footerBtns.hidden = true;
  infoText.classList.remove('active');

  items.forEach((item, i) => {
    const btn = document.createElement('div');
    btn.className = 'r-orbit-btn';
    btn.dataset.id = String(item.id);
    btn.innerHTML = `
      <div class="r-orbit-inner">
        <span class="r-orbit-text">${item.label}</span>
        ${item.badge !== undefined ? `<span class="r-orbit-badge">${item.badge}</span>` : ''}
      </div>
    `;
    btn.style.opacity = '0';
    btn.style.transition = 'opacity 0.3s';

    btn.addEventListener('click', () => {
      if (isDragging) return;
      onSecim(item);
    });

    wheel.insertBefore(btn, centerBtn);
    orbitBtns.push(btn);

    setTimeout(() => { btn.style.opacity = '1'; }, i * 60 + 50);
  });

  updatePositions();
}

function orbitlariTemizle() {
  orbitBtns.forEach(b => b.remove());
  orbitBtns = [];
}

// ============================================
// BREADCRUMB
// ============================================

function breadcrumbGuncelle() {
  breadcrumbInner.innerHTML = '';
  const adimlar = [];

  if (state.secim.mod) {
    const modLabel = { sinav: 'Sınav', flashcard: 'Flashcard', simulasyon: 'Simülasyon' };
    adimlar.push(modLabel[state.secim.mod]);
  }
  if (state.secim.donem) adimlar.push(`D${state.secim.donem}`);
  if (state.secim.kurulId) adimlar.push(state.secim.kurulId);
  if (state.secim.ders !== null && state.adim === 'ders') {
    adimlar.push(state.secim.ders || 'Tümü');
  }
  if (state.secim.yil) adimlar.push(String(state.secim.yil));
  if (state.secim.sinav) adimlar.push(state.secim.sinav);

  if (adimlar.length === 0) { breadcrumb.hidden = true; return; }

  breadcrumb.hidden = false;
  adimlar.forEach((a, i) => {
    const span = document.createElement('span');
    span.className = 'r-bc-item';
    span.textContent = a;
    breadcrumbInner.appendChild(span);
    if (i < adimlar.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'r-bc-sep';
      sep.textContent = '›';
      breadcrumbInner.appendChild(sep);
    }
  });
}

// ============================================
// SÜRÜKLEME
// ============================================

function getAngle(x, y) {
  const rect = wheel.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(x - cx, -(y - cy)) * (180 / Math.PI);
}

wheel.addEventListener('mousedown', (e) => {
  if (e.target === centerBtn || centerBtn.contains(e.target)) return;
  if (state.adim === 'kapali') return;
  isDragging = false;
  dragStartAngle = getAngle(e.clientX, e.clientY);
  dragStartRot = currentAngle;
  wheel.classList.add('spinning');
  if (animFrame) cancelAnimationFrame(animFrame);

  const onMove = (e) => {
    isDragging = true;
    const a = getAngle(e.clientX, e.clientY);
    currentAngle = dragStartRot + (a - dragStartAngle);
    targetAngle = currentAngle;
    updatePositions();
  };

  const onUp = () => {
    wheel.classList.remove('spinning');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    setTimeout(() => { isDragging = false; }, 50);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

wheel.addEventListener('touchstart', (e) => {
  if (centerBtn.contains(e.target)) return;
  if (state.adim === 'kapali') return;
  const touch = e.touches[0];
  isDragging = false;
  dragStartAngle = getAngle(touch.clientX, touch.clientY);
  dragStartRot = currentAngle;
  if (animFrame) cancelAnimationFrame(animFrame);
}, { passive: true });

wheel.addEventListener('touchmove', (e) => {
  isDragging = true;
  const touch = e.touches[0];
  const a = getAngle(touch.clientX, touch.clientY);
  currentAngle = dragStartRot + (a - dragStartAngle);
  targetAngle = currentAngle;
  updatePositions();
}, { passive: true });

wheel.addEventListener('touchend', () => {
  setTimeout(() => { isDragging = false; }, 50);
});

// ============================================
// BAŞLAT BUTONLARI
// ============================================

startBtn.addEventListener('click', () => {
  if (state.secim.mod === 'simulasyon') {
    const sorular = state.cikmislar
      .filter(s => s.yil === state.secim.yil && s.sinav === state.secim.sinav)
      .sort((a, b) => (a.sira || 0) - (b.sira || 0));

    const veri = {
      mod: 'simulasyon',
      sorular,
      yil: state.secim.yil,
      sinav: state.secim.sinav,
      kullaniciId: state.kullanici?.uid || null
    };
    sessionStorage.setItem('sinavSonuc', null);
    sessionStorage.setItem('sinavSecim', JSON.stringify(veri));
    window.location.href = `sinav.html?data=${encodeURIComponent(JSON.stringify(veri))}`;
  } else {
    const veri = {
      mod: state.secim.mod,
      donem: state.secim.donem,
      kurulId: state.secim.kurulId,
      ders: state.secim.ders,
      sayi: uygunSorulariSay(),
      sorular: state.sorular,
      kullaniciId: state.kullanici?.uid || null
    };
    sessionStorage.setItem('sinavSecim', JSON.stringify(veri));
    if (state.secim.mod === 'flashcard') {
      window.location.href = 'flashcard.html';
    } else {
      window.location.href = `sinav.html?data=${encodeURIComponent(JSON.stringify(veri))}`;
    }
  }
});

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
// INIT
// ============================================

veriYukle();
