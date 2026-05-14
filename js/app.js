/* ============================================
   ANA SAYFA — Firebase'den veri çeker
   ============================================ */

import { db } from '../firebase.js';
import {
  collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const state = {
  kurullarData: null,
  sorular: [],
  secim: {
    donem: null,
    kurulId: null,
    ders: '',
    sayi: 30
  }
};

const donemChips = document.getElementById('donemChips');
const kurulChips = document.getElementById('kurulChips');
const dersChips = document.getElementById('dersChips');
const sayiChips = document.querySelector('.chip-row-equal');
const availableInfo = document.getElementById('availableInfo');
const startBtn = document.getElementById('startBtn');

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle() {
  try {
    // Kurullar JSON'dan
    const kurullarRes = await fetch('data/kurullar.json');
    state.kurullarData = await kurullarRes.json();

    // Sorular Firebase'den
    const snapshot = await getDocs(collection(db, 'sorular'));
    state.sorular = snapshot.docs.map(d => d.data());

    donemleriCiz();
  } catch (err) {
    availableInfo.textContent = 'Veri yüklenemedi.';
    console.error(err);
  }
}

// ============================================
// FİLTRELEME
// ============================================

function soruIcerenDonemler() {
  const donemIdleri = new Set(state.sorular.map(s => s.donem));
  return state.kurullarData.donemler.filter(d => donemIdleri.has(d.id));
}

function soruIcerenKurullar(donemId) {
  const donem = state.kurullarData.donemler.find(d => d.id === donemId);
  if (!donem) return [];
  const kurulIdleri = new Set(
    state.sorular.filter(s => s.donem === donemId).map(s => s.kurulId)
  );
  return donem.kurullar.filter(k => kurulIdleri.has(k.id));
}

function soruIcerenDersler(donemId, kurulId) {
  const dersAdlari = new Set(
    state.sorular
      .filter(s => s.donem === donemId && s.kurulId === kurulId)
      .map(s => s.ders)
  );
  return Array.from(dersAdlari);
}

// ============================================
// ÇİZİM
// ============================================

function donemleriCiz() {
  donemChips.innerHTML = '';
  const donemler = soruIcerenDonemler();
  if (donemler.length === 0) {
    const bos = chipOlustur('Henüz soru yok', null);
    bos.disabled = true;
    donemChips.appendChild(bos);
    return;
  }
  donemler.forEach(donem => {
    const btn = chipOlustur(donem.ad, () => donemSec(donem.id));
    btn.dataset.value = donem.id;
    donemChips.appendChild(btn);
  });
}

function kurullariCiz(donemId) {
  kurulChips.innerHTML = '';
  const kurullar = soruIcerenKurullar(donemId);
  kurullar.forEach(kurul => {
    const btn = chipOlustur(kurul.ad, () => kurulSec(kurul.id));
    btn.dataset.value = kurul.id;
    kurulChips.appendChild(btn);
  });
}

function dersleriCiz(donemId, kurulId) {
  dersChips.innerHTML = '';
  const hepsi = chipOlustur('Tüm dersler', () => dersSec(''));
  hepsi.classList.add('active');
  hepsi.dataset.value = '';
  dersChips.appendChild(hepsi);
  const dersler = soruIcerenDersler(donemId, kurulId);
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
  aktifIsaretle(donemChips, donemId);
  kurullariCiz(donemId);
  dersChips.innerHTML = '';
  const placeholder = chipOlustur('Önce kurul', null);
  placeholder.disabled = true;
  dersChips.appendChild(placeholder);
  durumGuncelle();
}

function kurulSec(kurulId) {
  state.secim.kurulId = kurulId;
  state.secim.ders = '';
  aktifIsaretle(kurulChips, kurulId);
  dersleriCiz(state.secim.donem, kurulId);
  durumGuncelle();
}

function dersSec(ders) {
  state.secim.ders = ders;
  aktifIsaretle(dersChips, ders);
  durumGuncelle();
}

function sayiSec(sayi) {
  state.secim.sayi = sayi;
  aktifIsaretle(sayiChips, sayi, 'count');
  durumGuncelle();
}

sayiChips.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => sayiSec(parseInt(btn.dataset.count)));
});

function aktifIsaretle(container, deger, dataKey = 'value') {
  container.querySelectorAll('.chip').forEach(btn => {
    const btnDeger = dataKey === 'count'
      ? parseInt(btn.dataset.count)
      : btn.dataset.value;
    btn.classList.toggle('active', btnDeger == deger);
  });
}

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
  if (!state.secim.donem) {
    availableInfo.textContent = 'Bir dönem seç';
    availableInfo.classList.remove('ready');
    startBtn.disabled = true;
    return;
  }
  if (!state.secim.kurulId) {
    availableInfo.textContent = 'Bir kurul seç';
    availableInfo.classList.remove('ready');
    startBtn.disabled = true;
    return;
  }
  if (uygun === 0) {
    availableInfo.textContent = 'Bu seçimde henüz soru yok';
    availableInfo.classList.remove('ready');
    startBtn.disabled = true;
    return;
  }
  const gercekSayi = Math.min(state.secim.sayi, uygun);
  availableInfo.textContent = `${uygun} uygun soru var, ${gercekSayi} tanesi sorulacak`;
  availableInfo.classList.add('ready');
  startBtn.disabled = false;
}

startBtn.addEventListener('click', () => {
  const secimData = {
    donem: state.secim.donem,
    kurulId: state.secim.kurulId,
    ders: state.secim.ders,
    sayi: state.secim.sayi,
    sorular: state.sorular
  };
  const encoded = encodeURIComponent(JSON.stringify(secimData));
  window.location.href = `sinav.html?data=${encoded}`;
});


veriYukle();
