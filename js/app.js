/* ============================================
   MOSCOS — Ana Sayfa
   Retro Çark UI v2.0
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

// ============================================
// DOM
// ============================================

const wheel = document.getElementById('wheel');
const centerBtn = document.getElementById('centerBtn');
const centerHint = document.getElementById('centerHint');
const infoText = document.getElementById('infoText');
const footerBtns = document.getElementById('footerBtns');
const startBtn = document.getElementById('startBtn');
const breadcrumb = document.getElementById('breadcrumb');
const breadcrumbInner = document.getElementById('breadcrumbInner');
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
    const [kurullarRes, soruSnap, cikmisSnap] = await Promise.all([
      fetch('data/kurullar.json'),
      getDocs(collection(db, 'sorular')),
      getDocs(collection(db, 'cikmis_sorular'))
    ]);
    state.kurullarData = await kurullarRes.json();
    state.sorular = soruSnap.docs.map(d => d.data());
    state.cikmislar = cikmisSnap.docs.map(d => d.data());
  } catch (err) {
    console.error(err);
  }
}


// ============================================
// ÇARK MEKANİZMASI
// ============================================

const RADIUS = 125;
let currentAngle = 0;
let targetAngle = 0;
let animFrame = null;
let isDragging = false;
let orbitBtns = [];
let isOpen = false;
let mevcutItems = [];
let mevcutOnSecim = null;

function animate() {
  const diff = targetAngle - currentAngle;
  currentAngle += diff * 0.14;
  if (Math.abs(diff) > 0.05) {
    guncellePozisyonlar();
    animFrame = requestAnimationFrame(animate);
  } else {
    currentAngle = targetAngle;
    guncellePozisyonlar();
    animFrame = null;
  }
}

function startAnimate() {
  if (animFrame) cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(animate);
}

function guncellePozisyonlar() {
  const n = orbitBtns.length;
  if (n === 0) return;
  orbitBtns.forEach((btn, i) => {
    const baseAngle = (360 / n) * i;
    const totalAngle = baseAngle + currentAngle;
    const rad = (totalAngle * Math.PI) / 180;
    const cx = 170;
    const cy = 170;
    const x = cx + RADIUS * Math.sin(rad) - 42;
    const y = cy - RADIUS * Math.cos(rad) - 42;
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
    btn.style.transform = 'none';
    const inner = btn.querySelector('.orbit-btn-inner');
    inner.style.transform = `rotate(${totalAngle + 180}deg)`;

    // En üstteki butonu bul
    const normalizedTotal = ((totalAngle % 360) + 360) % 360;
    const isBottom = normalizedTotal > 150 && normalizedTotal < 210;
btn.classList.toggle('top-position', isBottom);

if (isBottom && isOpen && state.adim === 'mod') {
  const item = mevcutItems[i];
  if (item?.svg && aktifHologramSvg !== item.id) {
    aktifHologramSvg = item.id;
    hologramGoster(item.svg, 'rgba(200,119,26,0.9)');
  }
}

  });

  // Hiçbiri üstte değilse hologramı gizle
  const birUstte = orbitBtns.some((btn, i) => {
  const ba = (360 / orbitBtns.length) * i + currentAngle;
  const nt = ((ba % 360) + 360) % 360;
  return nt > 150 && nt < 210;
});


  if (!birUstte) {
    aktifHologramSvg = null;
    hologramGizle();
  }
}


function kartıEnUsteGetir(index) {
  const n = orbitBtns.length;
  const baseAngle = (360 / n) * index;
  // En alta getir (180 derece — bize yakın)
  const hedef = 180;
  const fark = ((( hedef - baseAngle - currentAngle) % 360) + 360) % 360;
  targetAngle = currentAngle + (fark > 180 ? fark - 360 : fark);
  startAnimate();
}


function kartlariCiz(items, onSecim) {
  orbitBtns.forEach(b => b.remove());
  orbitBtns = [];
  mevcutItems = items;
  mevcutOnSecim = onSecim;

  items.forEach((item, i) => {
    const btn = document.createElement('div');
    btn.className = 'orbit-btn';
    btn.dataset.id = String(item.id);
    btn.innerHTML = `
      <div class="orbit-btn-inner">
        <span class="orbit-btn-text">${item.label}</span>
        ${item.sayi !== undefined ? `<span class="orbit-btn-badge">${item.sayi}</span>` : ''}
      </div>
    `;

    btn.addEventListener('click', (e) => {
  if (isDragging) return;
  e.stopPropagation();
  orbitBtns.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  
  // Önce seçimi yap, sonra animasyon
  onSecim(item);
  kartıEnUsteGetir(i);
});


    wheel.insertBefore(btn, centerBtn);
    orbitBtns.push(btn);

    btn.style.opacity = '0';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      btn.style.transition = 'opacity 0.3s, background 0.25s, border-color 0.25s, box-shadow 0.25s';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }, i * 70 + 50);
  });

  guncellePozisyonlar();
}

function kartlariGizle() {
  orbitBtns.forEach((btn, i) => {
    setTimeout(() => {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }, i * 40);
  });
  setTimeout(() => {
    orbitBtns.forEach(b => b.remove());
    orbitBtns = [];
  }, orbitBtns.length * 40 + 300);
}

// ============================================
// ÇARK SÜRÜKLEME
// ============================================

function getAngleFromCenter(x, y) {
  const rect = wheel.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(x - cx, -(y - cy)) * (180 / Math.PI);
}

let dragStartAngle = 0;
let dragStartRot = 0;

wheel.addEventListener('mousedown', (e) => {
  if (e.target === centerBtn || centerBtn.contains(e.target)) return;
  if (!isOpen) return;
  isDragging = false;
  dragStartAngle = getAngleFromCenter(e.clientX, e.clientY);
  dragStartRot = currentAngle;
  if (animFrame) cancelAnimationFrame(animFrame);

  const onMove = (e) => {
    isDragging = true;
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    currentAngle = dragStartRot + (angle - dragStartAngle);
    targetAngle = currentAngle;
    guncellePozisyonlar();
    wheel.style.cursor = 'grabbing';
  };

  const onUp = () => {
    setTimeout(() => { isDragging = false; }, 50);
    wheel.style.cursor = 'grab';
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

let touchStartAngle = 0;
let touchStartRot = 0;

wheel.addEventListener('touchstart', (e) => {
  if (!isOpen) return;
  if (centerBtn.contains(e.target)) return;
  const touch = e.touches[0];
  touchStartAngle = getAngleFromCenter(touch.clientX, touch.clientY);
  touchStartRot = currentAngle;
  if (animFrame) cancelAnimationFrame(animFrame);
}, { passive: true });

wheel.addEventListener('touchmove', (e) => {
  if (!isOpen) return;
  isDragging = true;
  const touch = e.touches[0];
  const angle = getAngleFromCenter(touch.clientX, touch.clientY);
  currentAngle = touchStartRot + (angle - touchStartAngle);
  targetAngle = currentAngle;
  guncellePozisyonlar();
}, { passive: true });

wheel.addEventListener('touchend', () => {
  setTimeout(() => { isDragging = false; }, 80);
});

// Çift tıkla geri
let sonTik = 0;
wheel.addEventListener('click', (e) => {
  if (e.target === centerBtn || centerBtn.contains(e.target)) return;
  const simdi = Date.now();
  if (simdi - sonTik < 350) {
    // Başla modunda bile geri dönebilsin
    if (centerBtn.classList.contains('basla')) {
      centerNormaleGeri();
      footerBtns.hidden = true;
    }
    geriGit();
  }
  sonTik = simdi;
});


// ============================================
// MERKEZ BUTON
// ============================================

centerBtn.addEventListener('click', (e) => {
  e.stopPropagation();

  if (centerBtn.classList.contains('basla')) {
    startBtn.click();
    return;
  }

  if (!isOpen) {
    menuAc();
  } else {
    if (state.adim === 'mod') {
      menuKapat();
    } else {
      geriGit();
    }
  }
});

function menuAc() {
  isOpen = true;
  centerBtn.classList.add('open');
  centerHint.textContent = 'kapat';
  state.adim = 'mod';
  modlariGoster();
  breadcrumb.hidden = true;
}

function menuKapat() {
  hologramGizle();
  isOpen = false;
  centerBtn.classList.remove('open');
  centerBtn.classList.remove('basla');
  centerBtn.querySelector('.center-m').textContent = 'M';
  centerHint.textContent = 'aç';
  state.adim = 'kapali';
  state.secim = { mod: null, donem: null, kurulId: null, ders: null, yil: null, sinav: null };
  kartlariGizle();
  infoText.textContent = 'Çarkı döndür veya ortaya bas';
  infoText.classList.remove('ready');
  footerBtns.hidden = true;
  breadcrumb.hidden = true;
}

function geriGit() {
  hologramGizle();
  centerNormaleGeri();
  switch (state.adim) {
    case 'donem':
      state.secim.donem = null;
      state.adim = 'mod';
      modlariGoster();
      break;
    case 'kurul':
      state.secim.kurulId = null;
      state.adim = 'donem';
      if (state.secim.mod === 'simulasyon') {
        yillariGoster();
      } else {
        donemleriGoster();
      }
      break;
    case 'ders':
      state.secim.ders = null;
      state.adim = 'kurul';
      kurullariGoster(state.secim.donem);
      break;
    case 'sinav_sec':
      state.secim.sinav = null;
      state.adim = 'kurul';
      sinavlariGoster(state.secim.yil);
      break;
  }
  footerBtns.hidden = true;
  breadcrumbGuncelle();
}

function centerBaslaYap() {
  centerBtn.classList.add('basla');
  centerBtn.querySelector('.center-m').textContent = '▶';
  centerHint.textContent = 'başla';
  footerBtns.hidden = true;
}

function centerNormaleGeri() {
  centerBtn.classList.remove('basla');
  centerBtn.querySelector('.center-m').textContent = 'M';
  centerHint.textContent = 'kapat';
}

// ============================================
// ADIMLAR
// ============================================

function modlariGoster() {
  state.adim = 'mod';
  infoText.textContent = 'Mod seç';
  infoText.classList.remove('ready');
  footerBtns.hidden = true;
  centerNormaleGeri();

 kartlariCiz([
  { id: 'sinav', label: 'Sınav', svg: `
    <rect x="12" y="8" width="36" height="44" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <line x1="20" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="20" y1="28" x2="40" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="20" y1="36" x2="32" y2="36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="17" cy="20" r="2" fill="currentColor"/>
    <circle cx="17" cy="28" r="2" fill="currentColor"/>
    <circle cx="17" cy="36" r="2" fill="currentColor"/>
  `},
  { id: 'flashcard', label: 'Flash\ncard', svg: `
    <rect x="6" y="16" width="38" height="26" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <rect x="16" y="10" width="38" height="26" rx="3" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
    <line x1="18" y1="25" x2="32" y2="25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="18" y1="31" x2="28" y2="31" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
  `},
  { id: 'simulasyon', label: 'Simü\nlasyon', svg: `
    <circle cx="30" cy="30" r="20" stroke="currentColor" stroke-width="2.5" fill="none"/>
    <circle cx="30" cy="30" r="2.5" fill="currentColor"/>
    <line x1="30" y1="30" x2="30" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="30" y1="30" x2="42" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="22" y1="10" x2="24" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="38" y1="10" x2="36" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `}
], (item) => {
  state.secim.mod = item.id;
  hologramGizle();
  if (item.id === 'simulasyon') {
    state.adim = 'kurul';
    yillariGoster();
  } else {
    state.adim = 'donem';
    donemleriGoster();
  }
  breadcrumbGuncelle();
});

}

function donemleriGoster() {
  state.adim = 'donem';
  infoText.textContent = 'Dönem seç';
  infoText.classList.remove('ready');

  const donemIdleri = new Set(state.sorular.map(s => s.donem));
  const donemler = state.kurullarData.donemler
    .filter(d => donemIdleri.has(d.id))
    .map(d => ({
      id: d.id,
      label: `D${d.id}`,
      sayi: state.sorular.filter(s => s.donem === d.id).length
    }));

  kartlariCiz([...donemler, GERI_BTN], (item) => {
    if (item.geri) { geriGit(); return; }
    state.secim.donem = item.id;
    kurullariGoster(item.id);
    breadcrumbGuncelle();
  });
}

function kurullariGoster(donemId) {
  state.adim = 'kurul';
  infoText.textContent = 'Kurul seç';
  infoText.classList.remove('ready');

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

  kartlariCiz(kurullar, (item) => {
    state.secim.kurulId = item.id;
    dersleriGoster(donemId, item.id);
    breadcrumbGuncelle();
  });
}

function dersleriGoster(donemId, kurulId) {
  state.adim = 'ders';
  infoText.textContent = 'Ders seç';
  infoText.classList.remove('ready');

  const dersler = [...new Set(
    state.sorular
      .filter(s => s.donem === donemId && s.kurulId === kurulId)
      .map(s => s.ders)
  )].map(ders => ({
    id: ders,
    label: ders,
    sayi: state.sorular.filter(s => s.donem === donemId && s.kurulId === kurulId && s.ders === ders).length
  }));

  const tumDersler = {
    id: '',
    label: 'Tümü',
    sayi: state.sorular.filter(s => s.donem === donemId && s.kurulId === kurulId).length
  };

  kartlariCiz([tumDersler, ...dersler], (item) => {
    state.secim.ders = item.id;
    const uygun = uygunSorulariSay();
    infoText.textContent = `${uygun} soru`;
    infoText.classList.add('ready');
    centerBaslaYap();
    breadcrumbGuncelle();
  });
}

function yillariGoster() {
  state.adim = 'kurul';
  infoText.textContent = 'Yıl seç';
  infoText.classList.remove('ready');

  const yillar = [...new Set(state.cikmislar.map(s => s.yil))]
    .sort((a, b) => b - a)
    .map(yil => ({
      id: yil,
      label: String(yil),
      sayi: state.cikmislar.filter(s => s.yil === yil).length
    }));

  kartlariCiz(yillar, (item) => {
    state.secim.yil = item.id;
    sinavlariGoster(item.id);
    breadcrumbGuncelle();
  });
}

function sinavlariGoster(yil) {
  state.adim = 'sinav_sec';
  infoText.textContent = 'Sınav seç';
  infoText.classList.remove('ready');

  const sinavlar = [...new Set(
    state.cikmislar.filter(s => s.yil === yil).map(s => s.sinav)
  )].map(sinav => ({
    id: sinav,
    label: sinav,
    sayi: state.cikmislar.filter(s => s.yil === yil && s.sinav === sinav).length
  }));

  kartlariCiz(sinavlar, (item) => {
    state.secim.sinav = item.id;
    const sayi = state.cikmislar.filter(
      s => s.yil === state.secim.yil && s.sinav === item.id
    ).length;
    infoText.textContent = `${sayi} soru`;
    infoText.classList.add('ready');
    centerBaslaYap();
    breadcrumbGuncelle();
  });
}

// ============================================
// BREADCRUMB
// ============================================

function breadcrumbGuncelle() {
  breadcrumbInner.innerHTML = '';
  const parcalar = [];

  if (state.secim.mod) {
    const modLabel = { sinav: 'Sınav', flashcard: 'Flashcard', simulasyon: 'Simülasyon' };
    parcalar.push(modLabel[state.secim.mod] || state.secim.mod);
  }
  if (state.secim.donem) parcalar.push(`D${state.secim.donem}`);
  if (state.secim.yil) parcalar.push(String(state.secim.yil));
  if (state.secim.kurulId) parcalar.push(state.secim.kurulId);
  if (state.secim.sinav) parcalar.push(state.secim.sinav);
  if (state.secim.ders !== null && state.secim.ders !== undefined && state.adim === 'ders') {
    parcalar.push(state.secim.ders || 'Tümü');
  }

  if (parcalar.length === 0) {
    breadcrumb.hidden = true;
    return;
  }

  breadcrumb.hidden = false;
  parcalar.forEach((p, i) => {
    const span = document.createElement('span');
    span.className = 'bc-item';
    span.textContent = p;
    breadcrumbInner.appendChild(span);
    if (i < parcalar.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = '›';
      breadcrumbInner.appendChild(sep);
    }
  });
}

// ============================================
// YARDIMCILAR
// ============================================

function uygunSorulariSay() {
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

startBtn.addEventListener('click', () => {
  if (state.secim.mod === 'simulasyon') {
    const sorular = state.cikmislar
      .filter(s => s.yil === state.secim.yil && s.sinav === state.secim.sinav)
      .sort((a, b) => (a.sira || 0) - (b.sira || 0));
    sessionStorage.setItem('simulasyonSecim', JSON.stringify({
      sorular,
      yil: state.secim.yil,
      sinav: state.secim.sinav
    }));
    window.location.href = 'sinav.html?mod=simulasyon';
  } else if (state.secim.mod === 'flashcard') {
    const veri = {
      ...state.secim,
      sorular: state.sorular.filter(s => {
        if (s.donem !== state.secim.donem) return false;
        if (s.kurulId !== state.secim.kurulId) return false;
        if (state.secim.ders && s.ders !== state.secim.ders) return false;
        return true;
      })
    };
    sessionStorage.setItem('flashSecim', JSON.stringify(veri));
    window.location.href = 'flashcard.html';
  } else {
    const sorular = state.sorular.filter(s => {
      if (s.donem !== state.secim.donem) return false;
      if (s.kurulId !== state.secim.kurulId) return false;
      if (state.secim.ders && s.ders !== state.secim.ders) return false;
      return true;
    });
    const veri = {
      ...state.secim,
      sorular,
      kullaniciId: state.kullanici?.uid || null
    };
    sessionStorage.setItem('sinavSecim', JSON.stringify(veri));
    window.location.href = `sinav.html?data=${encodeURIComponent(JSON.stringify(veri))}`;
  }
});

// ============================================
// HOLOGRAM
// ============================================

const hologramBeam = document.getElementById('hologramBeam');
const hologramSvg = document.getElementById('hologramSvg');
let aktifHologramSvg = null;

function hologramGoster(svgContent, renk) {
  hologramSvg.innerHTML = svgContent;
  hologramSvg.style.color = renk || 'rgba(200,119,26,0.9)';
  hologramBeam.classList.add('visible');
}

function hologramGizle() {
  hologramBeam.classList.remove('visible');
}


// ============================================
// INIT
// ============================================

async function init() {
  await veriYukle();
  menuAc();
}

init();
