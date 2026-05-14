/* ============================================
   KURUL SORU BANKASI - Sınav Sayfası
   ============================================ */

const exam = {
  secim: null,
  sorular: [],
  aktifIndex: 0,
  cevaplar: {}
};

// DOM
const counter = document.getElementById('counter');
const progressFill = document.getElementById('progressFill');
const metaDers = document.getElementById('metaDers');
const metaHedef = document.getElementById('metaHedef');
const questionText = document.getElementById('questionText');
const optionsBox = document.getElementById('options');
const rationale = document.getElementById('rationale');
const rationaleText = document.getElementById('rationaleText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
const exitBtn = document.getElementById('exitBtn');

// ============================================
// BAŞLATMA
// ============================================

function basla() {
  const secimJson = sessionStorage.getItem('sinavSecim');
  if (!secimJson) { geriDon(); return; }

  const secim = JSON.parse(secimJson);
  exam.secim = secim;

  const tumSorular = secim.sorular || [];

  // Boş objeleri temizle
  const temizSorular = tumSorular.filter(s => s && s.soru && s.kurulId);

  const uygun = temizSorular.filter(s => {
    if (s.donem !== secim.donem) return false;
    if (s.kurulId !== secim.kurulId) return false;
    if (secim.ders && s.ders !== secim.ders) return false;
    return true;
  });

  if (uygun.length === 0) { geriDon(); return; }

  const karisik = karistir(uygun);
  exam.sorular = karisik.slice(0, Math.min(secim.sayi, karisik.length));
  soruyuGoster(0);
}


  if (uygun.length === 0) { geriDon(); return; }

  const karisik = karistir(uygun);
  exam.sorular = karisik.slice(0, Math.min(secim.sayi, karisik.length));
  soruyuGoster(0);
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
// SORU GÖSTERME
// ============================================

function soruyuGoster(index) {
  exam.aktifIndex = index;
  const soru = exam.sorular[index];

  counter.textContent = `${index + 1} / ${exam.sorular.length}`;
  progressFill.style.width = `${((index + 1) / exam.sorular.length) * 100}%`;

  metaDers.textContent = soru.ders;
  if (soru.ogrenimHedefi) {
    metaHedef.textContent = soru.ogrenimHedefi;
    metaHedef.hidden = false;
  } else {
    metaHedef.hidden = true;
  }

  questionText.textContent = soru.soru;

  optionsBox.innerHTML = '';
  const harfler = ['A', 'B', 'C', 'D', 'E'];
  const kullaniciCevap = exam.cevaplar[index];

  harfler.forEach(harf => {
    const metin = soru.secenekler[harf];
    if (!metin) return;

    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = `
      <span class="option-letter">${harf}</span>
      <span class="option-text">${metin}</span>
    `;
    btn.dataset.harf = harf;

    if (kullaniciCevap) {
      btn.disabled = true;
      if (harf === soru.dogruCevap) {
        btn.classList.add('correct');
      } else if (harf === kullaniciCevap) {
        btn.classList.add('wrong');
      } else {
        btn.classList.add('faded');
      }
    } else {
      btn.addEventListener('click', () => cevapVer(harf));
    }

    optionsBox.appendChild(btn);
  });

  if (kullaniciCevap && soru.aciklama) {
    rationaleText.textContent = soru.aciklama;
    rationale.hidden = false;
  } else {
    rationale.hidden = true;
  }

  prevBtn.disabled = index === 0;
  const sonSoru = index === exam.sorular.length - 1;
  nextBtn.hidden = sonSoru;
  finishBtn.hidden = !sonSoru;
}

// ============================================
// CEVAP VERME
// ============================================

function cevapVer(harf) {
  exam.cevaplar[exam.aktifIndex] = harf;
  soruyuGoster(exam.aktifIndex);
}

// ============================================
// NAVİGASYON
// ============================================

prevBtn.addEventListener('click', () => {
  if (exam.aktifIndex > 0) soruyuGoster(exam.aktifIndex - 1);
});

nextBtn.addEventListener('click', () => {
  if (exam.aktifIndex < exam.sorular.length - 1) {
    soruyuGoster(exam.aktifIndex + 1);
  }
});

finishBtn.addEventListener('click', () => {
  const sonuc = {
    sorular: exam.sorular,
    cevaplar: exam.cevaplar,
    tarih: new Date().toISOString()
  };
  sessionStorage.setItem('sinavSonuc', JSON.stringify(sonuc));
  window.location.href = 'sonuc.html';
});

exitBtn.addEventListener('click', () => {
  if (Object.keys(exam.cevaplar).length > 0) {
    if (!confirm('Sınavı bırakmak istediğine emin misin? Cevapların kaybolacak.')) {
      return;
    }
  }
  geriDon();
});

function geriDon() {
  window.location.href = 'index.html';
}

basla();
