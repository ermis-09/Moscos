/* ============================================
   KURUL SORU BANKASI - Sonuç Sayfası
   Normal mod + Simülasyon (Optik) modu
   ============================================ */

// ============================================
// VERİ AL
// ============================================

function sonucVeriAl() {
  // Önce sessionStorage'a bak
  const json = sessionStorage.getItem('sinavSonuc');
  if (json) return JSON.parse(json);
  
  // Sonra URL'e bak
  const urlParams = new URLSearchParams(window.location.search);
  const urlData = urlParams.get('data');
  if (urlData) return JSON.parse(decodeURIComponent(urlData));
  
  window.location.href = 'index.html';
  return null;
}


const sonuc = sonucVeriAl();
if (!sonuc) throw new Error('Sonuç yok');

// Sonucu kaydet
sonucuKaydet(sonuc, sonuc.mod);

// Simülasyon modu mu?
if (sonuc.mod === 'simulasyon') {
  optikEkraniGoster(sonuc);
} else {
  normalEkraniGoster(sonuc);
}


// Sonucu Firebase'e kaydet (giriş yapmışsa)
async function sonucuKaydet(sonuc, mod) {
  const { auth, db } = await import('../firebase.js');
  const { collection, addDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  const { onAuthStateChanged } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
  );

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const { sorular, cevaplar } = sonuc;
    let dogru = 0, yanlis = 0, bos = 0;
    const dersDetay = {};

    sorular.forEach((s, i) => {
      const cevap = cevaplar[i];
      if (!dersDetay[s.ders]) dersDetay[s.ders] = { dogru: 0, yanlis: 0, bos: 0, toplam: 0 };
      dersDetay[s.ders].toplam++;
      if (!cevap) { bos++; dersDetay[s.ders].bos++; }
      else if (cevap === s.dogruCevap) { dogru++; dersDetay[s.ders].dogru++; }
      else { yanlis++; dersDetay[s.ders].yanlis++; }
    });

    const kayit = {
      tarih: new Date().toISOString(),
      mod: mod || 'sinav',
      donem: sorular[0]?.donem || null,
      kurulId: sorular[0]?.kurulId || null,
      sinav: sorular[0]?.sinav || null,
      yil: sorular[0]?.yil || null,
      toplam: sorular.length,
      dogru, yanlis, bos,
      yuzde: Math.round((dogru / sorular.length) * 100),
      dersDetay
    };

    try {
      await addDoc(
        collection(db, 'kullanici_sonuclari', user.uid, 'sonuclar'),
        kayit
      );
    } catch (err) {
      console.error('Sonuç kaydedilemedi:', err);
    }
  });
}


// ============================================
// OPTİK EKRANI
// ============================================

function optikEkraniGoster(sonuc) {
  document.getElementById('optikEkrani').hidden = false;

  const { sorular, cevaplar } = sonuc;

  // Sınav adı
  const ilkSoru = sorular[0];
  const sinavAdi = ilkSoru
    ? `${ilkSoru.yil || ''} · ${ilkSoru.sinav || ''}`
    : 'Simülasyon';
  document.getElementById('optikSinavAdi').textContent = sinavAdi;

  // Skor hesapla
  let dogru = 0, yanlis = 0, bos = 0;
  sorular.forEach((s, i) => {
    const cevap = cevaplar[i];
    if (!cevap) bos++;
    else if (cevap === s.dogruCevap) dogru++;
    else yanlis++;
  });

  const net = (dogru - yanlis / 4).toFixed(2);

  document.getElementById('optikDogru').textContent = dogru;
  document.getElementById('optikYanlis').textContent = yanlis;
  document.getElementById('optikBos').textContent = bos;
  document.getElementById('optikNet').textContent = net;

  // Başlık rengi
  const yuzde = sorular.length > 0 ? (dogru / sorular.length) * 100 : 0;
  const header = document.getElementById('optikHeader');
  if (yuzde >= 75) header.classList.add('tier-high');
  else if (yuzde >= 50) header.classList.add('tier-mid');
  else header.classList.add('tier-low');

  // Optik tablo
  const tablo = document.getElementById('optikTablo');
  tablo.innerHTML = '';

  sorular.forEach((s, i) => {
    const cevap = cevaplar[i];
    const dogruMu = cevap === s.dogruCevap;
    const bosMu = !cevap;

    const satir = document.createElement('div');
    satir.className = `optik-satir ${bosMu ? 'bos' : dogruMu ? 'dogru' : 'yanlis'}`;

    const seceneklerHtml = ['A', 'B', 'C', 'D', 'E']
      .filter(h => s.secenekler[h])
      .map(h => {
        let klas = 'optik-secenek';
        if (h === cevap && h === s.dogruCevap) klas += ' isaretli dogru-cevap';
        else if (h === cevap) klas += ' isaretli yanlis-cevap';
        else if (!cevap && h === s.dogruCevap) klas += ' dogru-cevap-bos';
        return `<div class="${klas}">${h}</div>`;
      }).join('');

    const durum = bosMu ? '—' : dogruMu ? '✓' : '✗';
    const durumRenk = bosMu ? '' : dogruMu ? 'color:#4A7A4A' : 'color:#8B3838';

    satir.innerHTML = `
      <span class="optik-no">${i + 1}</span>
      <div class="optik-secenekler">${seceneklerHtml}</div>
      <span class="optik-durum" style="${durumRenk}">${durum}</span>
    `;

    tablo.appendChild(satir);
  });

  document.getElementById('optikYeniBtn').addEventListener('click', () => {
    window.location.href = 'simulasyon.html';
  });
}

// ============================================
// NORMAL SONUÇ EKRANI
// ============================================

function normalEkraniGoster(sonuc) {
  document.getElementById('resultFrame') &&
    (document.getElementById('resultFrame').hidden = false);

  const sonucState = {
    sorular: sonuc.sorular,
    cevaplar: sonuc.cevaplar,
    sadeceYanlislar: false
  };

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

  function sorulariCiz() {
    reviewList.innerHTML = '';
    sonucState.sorular.forEach((s, i) => {
      const cevap = sonucState.cevaplar[i];
      const dogru = cevap === s.dogruCevap;
      const bos = !cevap;
      if (sonucState.sadeceYanlislar && dogru) return;

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
          <div class="review-options">${secenekleriCiz(s, cevap)}</div>
          ${s.aciklama ? `
            <div class="review-rationale">
              <p class="rationale-label">Açıklama</p>
              <p class="rationale-text">${s.aciklama}</p>
            </div>` : ''}
        </div>
      `;

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
      }).join('');
  }

  function kisalt(metin, max) {
    if (metin.length <= max) return metin;
    return metin.substring(0, max).trim() + '…';
  }

  filterToggle.addEventListener('click', () => {
    sonucState.sadeceYanlislar = !sonucState.sadeceYanlislar;
    filterToggle.classList.toggle('active', sonucState.sadeceYanlislar);
    filterToggle.textContent = sonucState.sadeceYanlislar ? 'Tümünü göster' : 'Sadece yanlışlar';
    sorulariCiz();
  });

  retryBtn.addEventListener('click', () => {
    window.location.href = 'sinav.html';
  });

  newExamBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  skoruCiz();
  derslerCiz();
  sorulariCiz();
}
