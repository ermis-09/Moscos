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
    loginScreen.classList.remove('hidden');
    return;
  }

  const adminDoc = await getDoc(doc(db, 'adminler', user.email));
  if (!adminDoc.exists() || adminDoc.data().aktif !== true) {
    loginError.textContent = `${user.email} adresi yetkili değil.`;
    loginScreen.classList.remove('hidden');
    return;
  }

  loginScreen.classList.add('hidden');
});

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
  document.querySelectorAll('#tab-ekle .option-row').forEach(row => {
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
// ÇIKMIŞ SORU EKLE
// ============================================

const cikmisForm = { donem: null, cevap: null };

document.getElementById('cikmisDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('cikmisDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cikmisForm.donem = parseInt(btn.dataset.value);
  });
});

document.getElementById('cikmisCevap').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('cikmisCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cikmisForm.cevap = btn.dataset.value;
  });
});

document.getElementById('cikmisKaydetBtn').addEventListener('click', async () => {
  const msg = document.getElementById('cikmisMsg');

  const yil = parseInt(document.getElementById('cikmisYil').value);
  const sinav = document.getElementById('cikmisSinav').value.trim();
  const kurul = document.getElementById('cikmisKurul').value.trim().toUpperCase();
  const ders = document.getElementById('cikmisDers').value.trim();
  const sira = parseInt(document.getElementById('cikmisSira').value) || 0;
  const soru = document.getElementById('cikmisSoru').value.trim();
  const aciklama = document.getElementById('cikmisAciklama').value.trim();

  const secenekler = {};
  document.querySelectorAll('#tab-cikmis .option-row').forEach(row => {
    const harf = row.dataset.harf;
    const deger = row.querySelector('input').value.trim();
    if (deger) secenekler[harf] = deger;
  });

  if (!cikmisForm.donem) { mesajGoster(msg, 'Dönem seç!', 'error'); return; }
  if (!yil) { mesajGoster(msg, 'Yıl gir!', 'error'); return; }
  if (!sinav) { mesajGoster(msg, 'Sınav adı gir!', 'error'); return; }
  if (!kurul) { mesajGoster(msg, 'Kurul gir!', 'error'); return; }
  if (!ders) { mesajGoster(msg, 'Ders gir!', 'error'); return; }
  if (!soru) { mesajGoster(msg, 'Soru gir!', 'error'); return; }
  if (Object.keys(secenekler).length < 2) { mesajGoster(msg, 'En az 2 şık gir!', 'error'); return; }
  if (!cikmisForm.cevap) { mesajGoster(msg, 'Doğru cevabı seç!', 'error'); return; }

  const yeniSoru = {
    donem: cikmisForm.donem,
    yil,
    sinav,
    kurulId: kurul,
    ders,
    sira,
    soru,
    secenekler,
    dogruCevap: cikmisForm.cevap,
    olusturulmaTarihi: new Date().toISOString()
  };

  if (aciklama) yeniSoru.aciklama = aciklama;

  try {
    document.getElementById('cikmisKaydetBtn').disabled = true;
    await addDoc(collection(db, 'cikmis_sorular'), yeniSoru);
    mesajGoster(msg, '✓ Çıkmış soru kaydedildi!', 'success');

    ['cikmisYil','cikmisSinav','cikmisKurul','cikmisDers',
     'cikmisSira','cikmisSoru','cikmisAciklama']
      .forEach(id => document.getElementById(id).value = '');
    document.querySelectorAll('#tab-cikmis .option-row input')
      .forEach(i => i.value = '');
    document.getElementById('cikmisDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    document.getElementById('cikmisCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    cikmisForm.donem = null;
    cikmisForm.cevap = null;

  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
  } finally {
    document.getElementById('cikmisKaydetBtn').disabled = false;
  }
});

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

function formuSifirla() {
  document.getElementById('adminKurul').value = '';
  document.getElementById('adminDers').value = '';
  document.getElementById('adminHedef').value = '';
  document.getElementById('adminSoru').value = '';
  document.getElementById('adminAciklama').value = '';
  document.querySelectorAll('#tab-ekle .option-row input')
    .forEach(i => i.value = '');
  document.getElementById('adminDonem').querySelectorAll('.chip')
    .forEach(b => b.classList.remove('active'));
  document.getElementById('adminCevap').querySelectorAll('.chip')
    .forEach(b => b.classList.remove('active'));
  form.donem = null;
  form.cevap = null;
}
