/* ============================================
   SİMÜLASYON SAYFASI
   Çıkmış sorular, sıralı, geri bildirim sonda
   ============================================ */

import { db } from '../firebase.js';
import {
  collection, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const sim = {
  tumSorular: [],
  secim: { donem: null, yil: null, sinav: null },
  sorular: [],
  aktifIndex: 0,
  cevaplar: {}
};

// Seçim ekranı DOM
const simDonemChips = document.getElementById('simDonemChips');
const simYilChips = document.getElementById('simYilChips');
const simSinavChips = document.getElementById('simSinavChips');
const simInfo = document.getElementById('simInfo');
const simBaslaBtn = document.getElementById('simBaslaBtn');

// Sınav ekranı DOM
const secimEkrani = document.getElementById('secimEkrani');
const sinavEkrani = document.getElementById('sinavEkrani');
const simCounter = document.getElementById('simCounter');
const simProgressFill = document.getElementById('simProgressFill');
const simMetaDers = document.getElementById('simMetaDers');
const simMetaHedef = document.getElementById('simMetaHedef');
const simQuestionText = document.getElementById('simQuestionText');
const simOptions = document.getElementById('simOptions');
const simPrevBtn = document.getElementById('simPrevBtn');
const simNextBtn = document.getElementById('simNextBtn');
const simFinishBtn = document.getElementById('simFinishBtn');
const simExitBtn = document.getElementById('simExitBtn');

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle() {
  try {
    const snapshot = await getDocs(collection(db, 'cikmis_sorular'));
    sim.tumSorular = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    donemleriCiz();
  } catch (err) {
    simInfo.textContent = 'Veri yüklenemedi.';
    console.error(err);
  }
}

// ============================================
// FİLTRELEME
// ============================================

function benzersiz(arr, alan) {
  return [...new Set(arr.map(s => s[alan]))].sort();
}

function donemleriCiz() {
  simDonemChips.innerHTML = '';
  const donemler = benzersiz(sim.tumSorular, 'donem');

  if (donemler.length === 0) {
    const btn = chipOlustur('Henüz soru yok', null);
    btn.disabled = true;
    simDonemChips.appendChild(btn);
    return;
  }

  donemler.forEach(donem => {
    const btn = chipOlustur(`Dönem ${donem}`, () => donemSec(donem));
    btn.dataset.value = donem;
    simDonemChips.appendChild(btn);
  });
}

function yillariCiz(donem) {
  simYilChips.innerHTML = '';
  const yillar = benzersiz(
    sim.tumSorular.filter(s => s.donem === donem), 'yil'
  );

  yillar.forEach(yil => {
    const btn = chipOlustur(String(yil), () => yilSec(yil));
    btn.dataset.value = yil;
    simYilChips.appendChild(btn);
  });
}

function sinavlariCiz(donem, yil) {
  simSinavChips.innerHTML = '';
  const sinavlar = benzersiz(
    sim.tumSorular.filter(s => s.donem === donem && s.yil === yil), 'sinav'
  );

  sinavlar.forEach(sinav => {
    const btn = chipOlustur(sinav, () => sinavSec(sinav));
    btn.dataset.value = sinav;
    simSinavChips.appendChild(btn);
  });
}

// ============================================
// SEÇİM MANTIĞI
// ============================================

function donemSec(donem) {
  sim.secim.donem = donem;
  sim.secim.yil = null;
  sim.secim.sinav = null;

  aktifIsaretle(simDonemChips, donem);
  yillariCiz(donem);

  simSinavChips.innerHTML = '';
  const p = chipOlustur('Önce yıl', null);
  p.disabled = true;
  simSinavChips.appendChild(p);

  durumGuncelle();
}

function yilSec(yil) {
  sim.secim.yil = yil;
  sim.secim.sinav = null;

  aktifIsaretle(simYilChips, yil);
  sinavlariCiz(sim.secim.donem, yil);

  durumGuncelle();
}

function sinavSec(sinav) {
  sim.secim.sinav = sinav;
  aktifIsaretle(simSinavChips, sinav);
  durumGuncelle();
}

function aktifIsaretle(container, deger) {
  container.querySelectorAll('.chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value == deger);
  });
}

function durumGuncelle() {
  if (!sim.secim.donem) {
    simInfo.textContent = 'Dönem seç';
    simInfo.classList.remove('ready');
    simBaslaBtn.disabled = true;
    return;
  }
  if (!sim.secim.yil) {
    simInfo.textContent = 'Yıl seç';
    simInfo.classList.remove('ready');
    simBaslaBtn.disabled = true;
    return;
  }
  if (!sim.secim.sinav) {
    simInfo.textContent = 'Sınav seç';
    simInfo.classList.remove('ready');
    simBaslaBtn.disabled = true;
    return;
  }

  const sayi = sim.tumSorular.filter(s =>
    s.donem === sim.secim.donem &&
    s.yil === sim.secim.yil &&
    s.sinav === sim.secim.sinav
  ).length;

  simInfo.textContent = `${sayi} soru — sıralı, geri bildirim sonda`;
  simInfo.classList.add('ready');
  simBaslaBtn.disabled = false;
}

function chipOlustur(metin, onClick) {
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.textContent = metin;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

// ============================================
// SINAVI BAŞLAT
// ============================================

simBaslaBtn.addEventListener('click', () => {
  sim.sorular = sim.tumSorular
    .filter(s =>
      s.donem === sim.secim.donem &&
      s.yil === sim.secim.yil &&
      s.sinav === sim.secim.sinav
    )
    .sort((a, b) => (a.sira || 0) - (b.sira || 0));

  sim.aktifIndex = 0;
  sim.cevaplar = {};

  secimEkrani.hidden = true;
  sinavEkrani.hidden = false;

  soruyuGoster(0);
});

// ============================================
// SORU GÖSTERME — geri bildirim yok!
// ============================================

function soruyuGoster(index) {
  sim.aktifIndex = index;
  const soru = sim.sorular[index];

  simCounter.textContent = `${index + 1} / ${sim.sorular.length}`;
  simProgressFill.style.width = `${((index + 1) / sim.sorular.length) * 100}%`;

  simMetaDers.textContent = soru.ders;
  if (soru.ogrenimHedefi) {
    simMetaHedef.textContent = soru.ogrenimHedefi;
    simMetaHedef.hidden = false;
  } else {
    simMetaHedef.hidden = true;
  }

  simQuestionText.textContent = soru.soru;

  simOptions.innerHTML = '';
  const kullaniciCevap = sim.cevaplar[index];

  ['A', 'B', 'C', 'D', 'E'].forEach(harf => {
    const metin = soru.secenekler[harf];
    if (!metin) return;

    const btn = document.createElement('button');
    btn.className = 'option';

    // Sadece seçili olanı göster, doğru/yanlış renklendirme YOK
    if (kullaniciCevap === harf) {
      btn.classList.add('selected');
    }

    btn.innerHTML = `
      <span class="option-letter">${harf}</span>
      <span class="option-text">${metin}</span>
    `;

    btn.addEventListener('click', () => {
      sim.cevaplar[index] = harf;
      soruyuGoster(index);
    });

    simOptions.appendChild(btn);
  });

  simPrevBtn.disabled = index === 0;
  const sonSoru = index === sim.sorular.length - 1;
  simNextBtn.hidden = sonSoru;
  simFinishBtn.hidden = !sonSoru;
}

// ============================================
// NAVİGASYON
// ============================================

simPrevBtn.addEventListener('click', () => {
  if (sim.aktifIndex > 0) soruyuGoster(sim.aktifIndex - 1);
});

simNextBtn.addEventListener('click', () => {
  if (sim.aktifIndex < sim.sorular.length - 1) {
    soruyuGoster(sim.aktifIndex + 1);
  }
});

simFinishBtn.addEventListener('click', () => {
  const sonuc = {
    sorular: sim.sorular,
    cevaplar: sim.cevaplar,
    tarih: new Date().toISOString(),
    mod: 'simulasyon'
  };
  const encoded = encodeURIComponent(JSON.stringify(sonuc));
  sessionStorage.setItem('sinavSonuc', JSON.stringify(sonuc));
  window.location.href = `sonuc.html?data=${encoded}`;
});

simExitBtn.addEventListener('click', () => {
  if (Object.keys(sim.cevaplar).length > 0) {
    if (!confirm('Sınavı bırakmak istediğine emin misin?')) return;
  }
  secimEkrani.hidden = false;
  sinavEkrani.hidden = true;
  sim.cevaplar = {};
});

veriYukle();
