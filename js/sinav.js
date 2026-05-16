/* ============================================
   MOSCOS — Sınav Sayfası
   Normal + Simülasyon modu
   ============================================ */

const exam = {
  mod: 'sinav',
  sorular: [],
  aktifIndex: 0,
  cevaplar: {}
};

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

function basla() {
  const urlParams = new URLSearchParams(window.location.search);
  const mod = urlParams.get('mod');

  if (mod === 'simulasyon') {
    exam.mod = 'simulasyon';
    simulasyonBasla();
  } else {
    exam.mod = 'sinav';
    sinavBasla();
  }
}

function sinavBasla() {
  let secimJson = sessionStorage.getItem('sinavSecim');
  const urlParams = new URLSearchParams(window.location.search);
  const urlData = urlParams.get('data');
  if (urlData) secimJson = decodeURIComponent(urlData);

  if (!secimJson) { geriDon(); return; }

  const secim = JSON.parse(secimJson);
  const tumSorular = secim.sorular || [];

  const uygun = tumSorular.filter(s => {
    if (!s || !s.soru || !s.kurulId) return false;
    if (s.donem !== secim.donem) return false;
    if (s.kurulId !== secim.kurulId) return false;
    if (secim.ders && s.ders !== secim.ders) return false;
    return true;
  });

  if (uygun.length === 0) { geriDon(); return; }

  const karisik = karistir(uygun);
  exam.sorular = karisik.slice(0, Math.min(secim.sayi || uygun.length, karisik.length));
  soruyuGoster(0);
}

function simulasyonBasla() {
  const json = sessionStorage.getItem('simulasyonSecim');
  if (!json) { geriDon(); return; }

  const secim = JSON.parse(json);
  exam.sorular = secim.sorular || [];

  if (exam.sorular.length === 0) { geriDon(); return; }

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

function soruyuGoster(index) {
  exam.aktifIndex = index;
  const soru = exam.sorular[index];
  const kullaniciCevap = exam.cevaplar[index];
  const sonSoru = index === exam.sorular.length - 1;

  counter.textContent = `${index + 1} / ${exam.sorular.length}`;
  progressFill.style.width = `${((index + 1) / exam.sorular.length) * 100}%`;

  metaDers.textContent = soru.ders || '—';
  if (soru.ogrenimHedefi) {
    metaHedef.textContent = soru.ogrenimHedefi;
    metaHedef.hidden = false;
  } else {
    metaHedef.hidden = true;
  }

  questionText.textContent = soru.soru;
  optionsBox.innerHTML = '';

  const harfler = ['A', 'B', 'C', 'D', 'E'];

  harfler.forEach(harf => {
    const metin = soru.secenekler?.[harf];
    if (!metin) return;

    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = `
      <span class="option-letter">${harf}</span>
      <span class="option-text">${metin}</span>
    `;
    btn.dataset.harf = harf;

    if (exam.mod === 'simulasyon') {
      if (kullaniciCevap === harf) {
        btn.classList.add('selected');
      }
      btn.addEventListener('click', () => {
        exam.cevaplar[index] = harf;
        soruyuGoster(index);
      });
    } else {
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
    }

    optionsBox.appendChild(btn);
  });

  if (exam.mod === 'sinav' && kullaniciCevap && soru.aciklama) {
    rationaleText.textContent = soru.aciklama;
    rationale.hidden = false;
  } else {
    rationale.hidden = true;
  }

  prevBtn.disabled = index === 0;
  nextBtn.hidden = sonSoru;
  finishBtn.hidden = !sonSoru;
}

function cevapVer(harf) {
  exam.cevaplar[exam.aktifIndex] = harf;
  soruyuGoster(exam.aktifIndex);
}

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
    tarih: new Date().toISOString(),
    mod: exam.mod
  };
  sessionStorage.setItem('sinavSonuc', JSON.stringify(sonuc));
  window.location.href = exam.mod === 'simulasyon'
    ? 'sonuc.html?mod=simulasyon'
    : 'sonuc.html';
});

exitBtn.addEventListener('click', () => {
  if (Object.keys(exam.cevaplar).length > 0) {
    if (!confirm('Sınavı bırakmak istediğine emin misin?')) return;
  }
  geriDon();
});

function geriDon() {
  window.location.href = 'index.html';
}

basla();
