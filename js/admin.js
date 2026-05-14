/* ============================================
   ADMİN SAYFASI — Google Auth korumalı
   ============================================ */

import { db, auth } from '../firebase.js';
import {
  collection, addDoc, getDocs,
  deleteDoc, doc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = { donem: null, cevap: null };
const loginScreen = document.getElementById('loginScreen');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// ============================================
// AUTH KONTROLÜ
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Giriş yapılmamış — giriş ekranını göster
    loginScreen.classList.remove('hidden');
    return;
  }

  // Giriş yapılmış — admin listesinde mi kontrol et
  const adminDoc = await getDoc(doc(db, 'adminler', user.email));
  if (!adminDoc.exists() || adminDoc.data().aktif !== true) {
    loginError.textContent = `${user.email} adresi yetkili değil.`;
    loginScreen.classList.remove('hidden');
    return;
  }

  // Yetkili — giriş ekranını kapat
  loginScreen.classList.add('hidden');
});

// Google ile giriş
loginBtn.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    loginError.textContent = 'Giriş başarısız: ' + err.message;
  }
});

// ============================================
// SEKME YÖNETİMİ
// ============================================

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.hidden = true);
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).hidden = false;
    if (tab.dataset.tab === 'listele') soruListele();
  });
});

// ============================================
// DÖNEM SEÇİMİ
// ============================================

document.getElementById('adminDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('adminDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    form.donem = parseInt(btn.dataset.value);
  });
});

// ============================================
// CEVAP SEÇİMİ
// ============================================

document.getElementById('adminCevap').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('adminCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    form.cevap = btn.dataset.value;
  });
});

// ============================================
// SORU KAYDET
// ============================================

document.getElementById('kaydetBtn').addEventListener('click', async () => {
  const msg = document.getElementById('formMsg');

  const kurul = document.getElementById('adminKurul').value.trim();
  const ders = document.getElementById('adminDers').value.trim();
  const soru = document.getElementById('adminSoru').value.trim();
  const aciklama = document.getElementById('adminAciklama').value.trim();
  const hedef = document.getElementById('adminHedef').value.trim();

  const secenekler = {};
  document.querySelectorAll('.option-row').forEach(row => {
    const harf = row.dataset.harf;
    const deger = row.querySelector('input').value.trim();
    if (deger) secenekler[harf] = deger;
  });

  if (!form.donem) { mesajGoster(msg, 'Dönem seç!', 'error'); return; }
  if (!kurul) { mesajGoster(msg, 'Kurul gir!', 'error'); return; }
  if (!ders) { mesajGoster(msg, 'Ders gir!', 'error'); return; }
  if (!soru) { mesajGoster(msg, 'Soru metnini gir!', 'error'); return; }
  if (Object.keys(secenekler).length < 2) { mesajGoster(msg, 'En az 2 şık gir!', 'error'); return; }
  if (!form.cevap) { mesajGoster(msg, 'Doğru cevabı seç!', 'error'); return; }
  if (!secenekler[form.cevap]) { mesajGoster(msg, `Doğru cevap ${form.cevap} ama o şık boş!`, 'error'); return; }

  const yeniSoru = {
    donem: form.donem,
    kurulId: kurul.toUpperCase(),
    ders,
    soru,
    secenekler,
    dogruCevap: form.cevap,
    olusturulmaTarihi: new Date().toISOString()
  };

  if (hedef) yeniSoru.ogrenimHedefi = hedef;
  if (aciklama) yeniSoru.aciklama = aciklama;

  try {
    document.getElementById('kaydetBtn').disabled = true;
    await addDoc(collection(db, 'sorular'), yeniSoru);
    mesajGoster(msg, '✓ Soru kaydedildi!', 'success');
    formuSifirla();
  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
  } finally {
    document.getElementById('kaydetBtn').disabled = false;
  }
});

// ============================================
// SORU LİSTELE
// ============================================

async function soruListele() {
  const listesi = document.getElementById('soruListesi');
  listesi.innerHTML = '<p class="liste-bos">Yükleniyor...</p>';

  const kurulFiltre = document.getElementById('listKurul').value.trim().toUpperCase();

  try {
    let q;
    if (kurulFiltre) {
      q = query(collection(db, 'sorular'), where('kurulId', '==', kurulFiltre));
    } else {
      q = query(collection(db, 'sorular'));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listesi.innerHTML = '<p class="liste-bos">Henüz soru yok.</p>';
      return;
    }

    listesi.innerHTML = '';
    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      const kart = document.createElement('div');
      kart.className = 'soru-kart';
      kart.innerHTML = `
        <div class="soru-kart-meta">
          <span class="soru-kart-pill">D${s.donem} · ${s.kurulId}</span>
          <span class="soru-kart-pill ders">${s.ders}</span>
        </div>
        <p class="soru-kart-metin">${kisalt(s.soru, 80)}</p>
        <div class="soru-kart-actions">
          <button class="action-btn sil" data-id="${docSnap.id}">Sil</button>
        </div>
      `;

      kart.querySelector('.action-btn.sil').addEventListener('click', async () => {
        if (!confirm('Bu soruyu silmek istediğine emin misin?')) return;
        await deleteDoc(doc(db, 'sorular', docSnap.id));
        kart.remove();
      });

      listesi.appendChild(kart);
    });

  } catch (err) {
    listesi.innerHTML = `<p class="liste-bos">Hata: ${err.message}</p>`;
  }
}

document.getElementById('listKurul').addEventListener('input', soruListele);

// ============================================
// YARDIMCILAR
// ============================================

function mesajGoster(el, metin, tip) {
  el.textContent = metin;
  el.className = `form-msg ${tip}`;
  setTimeout(() => { el.textContent = ''; el.className = 'form-msg'; }, 3000);
}

function kisalt(metin, max) {
  if (metin.length <= max) return metin;
  return metin.substring(0, max).trim() + '…';
}

// ============================================
// AI PARSE
// ============================================

let aiParsedSorular = [];
let aiDonem = null;

// Key'i localStorage'dan yükle
const geminiKeyInput = document.getElementById('geminiKey');
const savedKey = localStorage.getItem('geminiApiKey');
if (savedKey) geminiKeyInput.value = savedKey;

geminiKeyInput.addEventListener('change', () => {
  localStorage.setItem('geminiApiKey', geminiKeyInput.value.trim());
});

// Dönem seçimi
document.getElementById('aiDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('aiDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    aiDonem = parseInt(btn.dataset.value);
  });
});

// Parse Et butonu
document.getElementById('aiParseBtn').addEventListener('click', async () => {
  const msg = document.getElementById('aiMsg');
  const key = geminiKeyInput.value.trim();
  const metin = document.getElementById('aiMetin').value.trim();
  const kurul = document.getElementById('aiKurul').value.trim().toUpperCase();
  const ders = document.getElementById('aiDers').value.trim();

  if (!key) { mesajGoster(msg, 'API key gir!', 'error'); return; }
  if (!aiDonem) { mesajGoster(msg, 'Dönem seç!', 'error'); return; }
  if (!kurul) { mesajGoster(msg, 'Kurul gir!', 'error'); return; }
  if (!ders) { mesajGoster(msg, 'Ders gir!', 'error'); return; }
  if (!metin) { mesajGoster(msg, 'Metin yapıştır!', 'error'); return; }

  mesajGoster(msg, 'Gemini parse ediyor...', 'success');
  document.getElementById('aiParseBtn').disabled = true;

  const prompt = `
Aşağıdaki tıp sınavı sorularını JSON formatına çevir.

Kurallar:
- Her soru için şu alanları doldur: soru, secenekler (A/B/C/D/E), dogruCevap, aciklama (varsa)
- secenekler objesi: {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}
- dogruCevap sadece harf olsun: "A", "B", "C", "D" veya "E"
- aciklama yoksa o alanı ekleme
- Sadece JSON array döndür, başka hiçbir şey yazma
- Format: [{"soru":"...","secenekler":{"A":"..."},"dogruCevap":"A","aciklama":"..."},...]

Sorular:
${metin}
`;




  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API hatası');
    }

    const rawText = data.candidates[0].content.parts[0].text;

    // JSON'u temizle
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON bulunamadı');

    const sorular = JSON.parse(jsonMatch[0]);

    // Dönem/kurul/ders ekle
    aiParsedSorular = sorular.map(s => ({
      donem: aiDonem,
      kurulId: kurul,
      ders: ders,
      soru: s.soru,
      secenekler: s.secenekler,
      dogruCevap: s.dogruCevap,
      olusturulmaTarihi: new Date().toISOString(),
      ...(s.aciklama && { aciklama: s.aciklama }),
      ...(s.ogrenimHedefi && { ogrenimHedefi: s.ogrenimHedefi })
    }));

    onizlemeGoster(aiParsedSorular);
    mesajGoster(msg, `${aiParsedSorular.length} soru parse edildi!`, 'success');

  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
    console.error(err);
  } finally {
    document.getElementById('aiParseBtn').disabled = false;
  }
});

function onizlemeGoster(sorular) {
  const onizleme = document.getElementById('aiOnizleme');
  const liste = document.getElementById('aiSoruListesi');
  const sayac = document.getElementById('aiSoruSayisi');

  sayac.textContent = `${sorular.length} soru bulundu`;
  liste.innerHTML = '';

  sorular.forEach((s, i) => {
    const kart = document.createElement('div');
    kart.className = 'ai-soru-kart';

    const seceneklerHtml = Object.entries(s.secenekler)
      .map(([harf, metin]) => `
        <div class="ai-secenek ${harf === s.dogruCevap ? 'dogru' : ''}">
          <strong>${harf})</strong> ${metin}
        </div>
      `).join('');

    kart.innerHTML = `
      <div class="soru-kart-meta">
        <span class="soru-kart-pill">${s.kurulId}</span>
        <span class="soru-kart-pill ders">${s.ders}</span>
        <span class="soru-kart-pill ders">#${i + 1}</span>
      </div>
      <p class="ai-soru-metin">${s.soru}</p>
      <div class="ai-secenekler">${seceneklerHtml}</div>
      ${s.aciklama ? `<p class="ai-aciklama">💡 ${s.aciklama}</p>` : ''}
    `;

    liste.appendChild(kart);
  });

  onizleme.hidden = false;
}

// Firebase'e toplu kaydet
document.getElementById('aiKaydetBtn').addEventListener('click', async () => {
  const msg = document.getElementById('aiMsg');
  if (aiParsedSorular.length === 0) return;

  mesajGoster(msg, 'Kaydediliyor...', 'success');
  document.getElementById('aiKaydetBtn').disabled = true;

  try {
    const batch = aiParsedSorular.map(s =>
      addDoc(collection(db, 'sorular'), s)
    );
    await Promise.all(batch);

    mesajGoster(msg, `✓ ${aiParsedSorular.length} soru kaydedildi!`, 'success');
    document.getElementById('aiOnizleme').hidden = true;
    document.getElementById('aiMetin').value = '';
    aiParsedSorular = [];

  } catch (err) {
    mesajGoster(msg, 'Kayıt hatası: ' + err.message, 'error');
  } finally {
    document.getElementById('aiKaydetBtn').disabled = false;
  }
});


function formuSifirla() {
  document.getElementById('adminKurul').value = '';
  document.getElementById('adminDers').value = '';
  document.getElementById('adminHedef').value = '';
  document.getElementById('adminSoru').value = '';
  document.getElementById('adminAciklama').value = '';
  document.querySelectorAll('.option-row input').forEach(i => i.value = '');
  document.getElementById('adminDonem').querySelectorAll('.chip')
    .forEach(b => b.classList.remove('active'));
  document.getElementById('adminCevap').querySelectorAll('.chip')
    .forEach(b => b.classList.remove('active'));
  form.donem = null;
  form.cevap = null;
}
