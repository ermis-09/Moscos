/* ============================================
   KURUL SORU BANKASI - Sonuç Sayfası
   ============================================ */

const sonucState = {
  sorular: [],
  cevaplar: {},
  sadeceYanlislar: false
};

// DOM
const scoreBig = document.getElementById('scoreBig');
const scoreTotal = document.getElementById('scoreTotal');
const scorePercent = document.getElementById('scorePercent');
const scoreMessage = document.getElementById('scoreMessage');
const statCorrect = document.getElementById('statCorrect');
const statWrong = document.getElementById('statWrong');
const statBlank = document.getElementById('statBlank');
const dersList = document.getElementById('dersList');
const reviewList = document.getElementById('reviewList');
const filterToggle = document.getElementById('filterToggle');
const retryBtn = document.getElementById('retryBtn');
const newExamBtn = document.getElementById('newExamBtn');

// ============================================
// BAŞLATMA
// ============================================

function basla() {
  const sonucJson = sessionStorage.getItem('sinavSonuc');
  if (!sonucJson) {
    window.location.href = 'index.html';
    return;
  }

  const sonuc = JSON.parse(sonucJson);
  sonucState.sorular = sonuc.sorular;
  sonucState.cevaplar = sonuc.cevaplar;

  skoruCiz();
  derslerCiz();
  sorulariCiz();
}

// ============================================
// SKOR HESAPLAMA
// ============================================

function skorHesapla() {
  let dogru = 0, yanlis = 0, bos = 0;
  sonucState.sorular.forEach((s, i) => {
    const cevap = sonucState.cevaplar[i];
    if (!cevap) bos++;
    else if (cevap === s.dogruCevap) dogru++;
    else yanlis++;
  });
  return { dogru, yanlis, bos, toplam: sonucState.sorular.length };
}

function skoruCiz() {
  const { dogru, yanlis, bos, toplam } = skorHesapla();
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;

  scoreBig.textContent = dogru;
  scoreTotal.textContent = `/ ${toplam}`;
  scorePercent.textContent = `%${yuzde}`;
  scoreMessage.textContent = mesajSec(yuzde);

  statCorrect.textContent = dogru;
  statWrong.textContent = yanlis;
  statBlank.textContent = bos;

  // Yüzdeye göre üst paneli renklendir
  const header = document.querySelector('.result-header');
  header.classList.remove('tier-low', 'tier-mid', 'tier-high');
  if (yuzde >= 75) header.classList.add('tier-high');
  else if (yuzde >= 50) header.classList.add('tier-mid');
  else header.classList.add('tier-low');
}

function mesajSec(yuzde) {
  if (yuzde === 100) return 'Mükemmel! Tüm soruları doğru yaptın.';
  if (yuzde >= 85) return 'Harika gidiyorsun!';
  if (yuzde >= 70) return 'İyi iş, devam et.';
  if (yuzde >= 50) return 'Fena değil, biraz tekrar gerekli.';
  if (yuzde >= 25) return 'Bu konulara tekrar bakmakta fayda var.';
  return 'Tekrar zamanı. Pes etme!';
}

// ============================================
// DERS BAZINDA DAĞILIM
// ============================================

function derslerCiz() {
  const dersIstatistik = {};

  sonucState.sorular.forEach((s, i) => {
    if (!dersIstatistik[s.ders]) {
      dersIstatistik[s.ders] = { dogru: 0, yanlis: 0, bos: 0, toplam: 0 };
    }
    const stat = dersIstatistik[s.ders];
    stat.toplam++;
    const cevap = sonucState.cevaplar[i];
    if (!cevap) stat.bos++;
    else if (cevap === s.dogruCevap) stat.dogru++;
    else stat.yanlis++;
  });

  dersList.innerHTML = '';
  Object.keys(dersIstatistik).forEach(ders => {
    const stat = dersIstatistik[ders];
    const yuzde = Math.round((stat.dogru / stat.toplam) * 100);

    const item = document.createElement('div');
    item.className = 'ders-item';
    item.innerHTML = `
      <div class="ders-info">
        <span class="ders-ad">${ders}</span>
        <span class="ders-skor">${stat.dogru}/${stat.toplam}</span>
      </div>
      <div class="ders-bar">
        <div class="ders-bar-fill" style="width: ${yuzde}%"></div>
      </div>
    `;
    dersList.appendChild(item);
  });
}

// ============================================
// SORU LİSTESİ
// ============================================

function sorulariCiz() {
  reviewList.innerHTML = '';

  sonucState.sorular.forEach((s, i) => {
    const cevap = sonucState.cevaplar[i];
    const dogru = cevap === s.dogruCevap;
    const bos = !cevap;

    // Filtre: sadece yanlışlar
    if (sonucState.sadeceYanlislar && (dogru)) return;

    const durum = bos ? 'blank' : (dogru ? 'correct' : 'wrong');
    const ikon = bos ? '—' : (dogru ? '✓' : '✗');

    const item = document.createElement('div');
    item.className = `review-item review-${durum}`;
    item.innerHTML = `
      <div class="review-summary" data-index="${i}">
        <span class="review-num">${i + 1}</span>
        <span class="review-icon">${ikon}</span>
        <span class="review-preview">
          <span class="review-ders">${s.ders}</span>
          <span class="review-text">${kisalt(s.soru, 60)}</span>
        </span>
        <span class="review-toggle">▾</span>
      </div>
      <div class="review-detail" hidden>
        <p class="review-question">${s.soru}</p>
        <div class="review-options">
          ${secenekleriCiz(s, cevap)}
        </div>
        ${s.aciklama ? `
          <div class="review-rationale">
            <p class="rationale-label">Açıklama</p>
            <p class="rationale-text">${s.aciklama}</p>
          </div>
        ` : ''}
      </div>
    `;

    // Tıklama ile aç/kapa
    const summary = item.querySelector('.review-summary');
    const detail = item.querySelector('.review-detail');
    const toggle = item.querySelector('.review-toggle');
    summary.addEventListener('click', () => {
      detail.hidden = !detail.hidden;
      toggle.textContent = detail.hidden ? '▾' : '▴';
    });

    reviewList.appendChild(item);
  });

  if (reviewList.children.length === 0) {
    reviewList.innerHTML = '<p class="review-empty">Hiç yanlış yok. 👏</p>';
  }
}

function secenekleriCiz(soru, kullaniciCevap) {
  return ['A', 'B', 'C', 'D', 'E']
    .filter(h => soru.secenekler[h])
    .map(h => {
      let klas = 'review-opt';
      if (h === soru.dogruCevap) klas += ' review-opt-correct';
      else if (h === kullaniciCevap) klas += ' review-opt-wrong';
      return `
        <div class="${klas}">
          <span class="review-opt-letter">${h}</span>
          <span class="review-opt-text">${soru.secenekler[h]}</span>
        </div>
      `;
    })
    .join('');
}

function kisalt(metin, max) {
  if (metin.length <= max) return metin;
  return metin.substring(0, max).trim() + '…';
}

// ============================================
// EVENTS
// ============================================

filterToggle.addEventListener('click', () => {
  sonucState.sadeceYanlislar = !sonucState.sadeceYanlislar;
  filterToggle.classList.toggle('active', sonucState.sadeceYanlislar);
  filterToggle.textContent = sonucState.sadeceYanlislar ? 'Tümünü göster' : 'Sadece yanlışlar';
  sorulariCiz();
});

retryBtn.addEventListener('click', () => {
  // Aynı seçimle yeni sınav
  window.location.href = 'sinav.html';
});

newExamBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

basla();
