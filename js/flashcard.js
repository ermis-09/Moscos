/* ============================================
   MOSCOS — Flashcard Sayfası
   ============================================ */

import { db, auth } from '../firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const flash = {
  kartlar: [],
  aktifIndex: 0,
  cevrildimi: false,
  stats: { kolay: 0, zor: 0, atla: 0 }
};

// DOM
const flashCard = document.getElementById('flashCard');
const flashCardInner = document.getElementById('flashCardInner');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const flashCounter = document.getElementById('flashCounter');
const flashProgressFill = document.getElementById('flashProgressFill');
const flashBaslik = document.getElementById('flashBaslik');
const swipeHint = document.getElementById('swipeHint');
const statKolay = document.getElementById('statKolay');
const statAtla = document.getElementById('statAtla');
const statZor = document.getElementById('statZor');
const exitBtn = document.getElementById('exitBtn');
const flashMain = document.querySelector('.flash-main');

// ============================================
// BAŞLA
// ============================================

async function basla() {
  const json = sessionStorage.getItem('flashSecim');
  if (!json) { window.location.href = 'index.html'; return; }

  const secim = JSON.parse(json);

  try {
    let q;
    if (secim.ders) {
      q = query(
        collection(db, 'flashcardlar'),
        where('donem', '==', secim.donem),
        where('kurulId', '==', secim.kurulId),
        where('ders', '==', secim.ders)
      );
    } else {
      q = query(
        collection(db, 'flashcardlar'),
        where('donem', '==', secim.donem),
        where('kurulId', '==', secim.kurulId)
      );
    }

    const snapshot = await getDocs(q);
    flash.kartlar = karistir(snapshot.docs.map(d => d.data()));

    if (flash.kartlar.length === 0) {
      flashMain.innerHTML = `
        <div style="text-align:center; color:var(--metal-light); font-family:var(--font-display); font-size:18px;">
          Bu seçimde flashcard yok.
        </div>
      `;
      return;
    }

    flashBaslik.textContent = secim.kurulId || 'Flashcard';
    kartGoster(0);

  } catch (err) {
    console.error(err);
  }
}

function karistir(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================
// KART GÖSTER
// ============================================

function kartGoster(index) {
  flash.aktifIndex = index;
  flash.cevrildimi = false;

  const kart = flash.kartlar[index];
  cardFront.textContent = kart.onYuz;
  cardBack.textContent = kart.arkaYuz;

  flashCardInner.classList.remove('flipped');
  flashCard.classList.remove('swiping-right', 'swiping-left', 'swiping-up');
  flashCard.style.transform = '';
  flashCard.style.opacity = '';

  flashCounter.textContent = `${index + 1} / ${flash.kartlar.length}`;
  flashProgressFill.style.width = `${((index + 1) / flash.kartlar.length) * 100}%`;

  swipeHint.classList.remove('visible');
  istatGuncelle();
}

function istatGuncelle() {
  statKolay.textContent = `${flash.stats.kolay} Kolay`;
  statAtla.textContent = `${flash.stats.atla} Atla`;
  statZor.textContent = `${flash.stats.zor} Zor`;
}

// ============================================
// KART ÇEVİR
// ============================================

flashCard.addEventListener('click', (e) => {
  if (isDragging) return;
  flash.cevrildimi = !flash.cevrildimi;
  flashCardInner.classList.toggle('flipped', flash.cevrildimi);
  if (flash.cevrildimi) {
    swipeHint.classList.add('visible');
  }
});

// ============================================
// SWIPE
// ============================================

let startX = 0;
let startY = 0;
let isDragging = false;

flashCard.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isDragging = false;
}, { passive: true });

flashCard.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;

  if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    isDragging = true;
  }

  if (!isDragging) return;

  const rotate = dx * 0.08;
  flashCard.style.transform = `translateX(${dx}px) translateY(${dy * 0.3}px) rotate(${rotate}deg)`;

  // Renk değişimi
  flashCard.classList.remove('swiping-right', 'swiping-left', 'swiping-up');
  if (Math.abs(dy) > Math.abs(dx) && dy < -30) {
    flashCard.classList.add('swiping-up');
  } else if (dx > 40) {
    flashCard.classList.add('swiping-right');
  } else if (dx < -40) {
    flashCard.classList.add('swiping-left');
  }
}, { passive: true });

flashCard.addEventListener('touchend', (e) => {
  if (!isDragging) return;

  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  // Yeterli swipe mesafesi
  if (Math.abs(dy) > Math.abs(dx) && dy < -80) {
    swipeYap('atla');
  } else if (dx > 80) {
    swipeYap('kolay');
  } else if (dx < -80) {
    swipeYap('zor');
  } else {
    // Geri gel
    flashCard.style.transform = '';
    flashCard.classList.remove('swiping-right', 'swiping-left', 'swiping-up');
  }

  setTimeout(() => { isDragging = false; }, 50);
});

// Mouse desteği
flashCard.addEventListener('mousedown', (e) => {
  startX = e.clientX;
  startY = e.clientY;
  isDragging = false;

  const onMove = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isDragging = true;
    }

    if (!isDragging) return;

    const rotate = dx * 0.08;
    flashCard.style.transform = `translateX(${dx}px) translateY(${dy * 0.3}px) rotate(${rotate}deg)`;

    flashCard.classList.remove('swiping-right', 'swiping-left', 'swiping-up');
    if (Math.abs(dy) > Math.abs(dx) && dy < -30) {
      flashCard.classList.add('swiping-up');
    } else if (dx > 40) {
      flashCard.classList.add('swiping-right');
    } else if (dx < -40) {
      flashCard.classList.add('swiping-left');
    }
  };

  const onUp = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (isDragging) {
      if (Math.abs(dy) > Math.abs(dx) && dy < -80) {
        swipeYap('atla');
      } else if (dx > 80) {
        swipeYap('kolay');
      } else if (dx < -80) {
        swipeYap('zor');
      } else {
        flashCard.style.transform = '';
        flashCard.classList.remove('swiping-right', 'swiping-left', 'swiping-up');
      }
    }

    setTimeout(() => { isDragging = false; }, 50);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// ============================================
// SWIPE ANIMASYON
// ============================================

function swipeYap(sonuc) {
  flash.stats[sonuc]++;

  // Uçuş animasyonu
  let tx = 0, ty = 0, rot = 0;
  if (sonuc === 'kolay') { tx = 400; rot = 20; }
  else if (sonuc === 'zor') { tx = -400; rot = -20; }
  else { ty = -400; }

  flashCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
  flashCard.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`;
  flashCard.style.opacity = '0';

  setTimeout(() => {
    flashCard.style.transition = '';

    const sonrakiIndex = flash.aktifIndex + 1;
    if (sonrakiIndex >= flash.kartlar.length) {
      sonucGoster();
    } else {
      kartGoster(sonrakiIndex);
    }
  }, 400);
}

// ============================================
// SONUÇ
// ============================================

function sonucGoster() {
  const main = document.querySelector('.flash-main');
  const footer = document.querySelector('.flash-footer');
  footer.hidden = true;

  const toplam = flash.kartlar.length;
  const { kolay, zor, atla } = flash.stats;

  main.innerHTML = `
    <div class="flash-sonuc">
      <div style="font-size:48px;">✦</div>
      <h2 class="flash-sonuc-baslik">Tamamlandı!</h2>
      <p style="font-size:14px; color:var(--metal-light); font-family:var(--font-display);">${toplam} kart çalışıldı</p>
      <div class="flash-sonuc-grid">
        <div class="flash-sonuc-kart">
          <span class="flash-sonuc-num" style="color:#6BBF6B">${kolay}</span>
          <span class="flash-sonuc-label">Kolay</span>
        </div>
        <div class="flash-sonuc-kart">
          <span class="flash-sonuc-num" style="color:#6080C4">${atla}</span>
          <span class="flash-sonuc-label">Atla</span>
        </div>
        <div class="flash-sonuc-kart">
          <span class="flash-sonuc-num" style="color:#C46060">${zor}</span>
          <span class="flash-sonuc-label">Zor</span>
        </div>
      </div>
      <button class="start-btn" id="tekrarBtn" style="margin-top:8px;">
        Tekrar Çalış
      </button>
      <button class="start-btn" id="bitirBtn" style="background:var(--bg2); color:var(--text); border:1px solid var(--border); box-shadow:none; margin-top:4px;">
        Ana Sayfaya Dön
      </button>
    </div>
  `;

  document.getElementById('tekrarBtn').addEventListener('click', () => {
    flash.kartlar = karistir(flash.kartlar);
    flash.stats = { kolay: 0, zor: 0, atla: 0 };
    footer.hidden = false;
    main.innerHTML = `
      <div class="card-stack" id="cardStack">
        <div class="card-back card-back-2"></div>
        <div class="card-back card-back-1"></div>
      </div>
      <div class="flash-card" id="flashCard">
        <div class="flash-card-inner" id="flashCardInner">
          <div class="flash-card-front">
            <div class="card-side-label">KAVRAM</div>
            <p class="card-main-text" id="cardFront">—</p>
            <div class="card-tap-hint">dokunarak çevir</div>
          </div>
          <div class="flash-card-back">
            <div class="card-side-label back">AÇIKLAMA</div>
            <p class="card-main-text" id="cardBack">—</p>
          </div>
        </div>
      </div>
      <div class="swipe-hint" id="swipeHint">
        <span class="hint-left">✗ Zor</span>
        <span class="hint-up">↑ Atla</span>
        <span class="hint-right">✓ Kolay</span>
      </div>
    `;
    // Event listener'ları yeniden bağla
    basla();
  });

  document.getElementById('bitirBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

// ============================================
// ÇIKIŞ
// ============================================

exitBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

basla();
