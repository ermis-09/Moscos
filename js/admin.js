/* ============================================
   ADMİN SAYFASI — Google Auth korumalı
   ============================================ */

import { db, auth } from '../firebase.js';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = { donem: null, cevap: null };
const loginScreen = document.getElementById('loginScreen');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// ============================================
// AUTH
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) { loginScreen.classList.remove('hidden'); return; }
  const adminDoc = await getDoc(doc(db, 'adminler', user.email));
  if (!adminDoc.exists() || adminDoc.data().aktif !== true) {
    loginError.textContent = `${user.email} adresi yetkili değil.`;
    loginScreen.classList.remove('hidden');
    return;
  }
  loginScreen.classList.add('hidden');
});

loginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    loginError.textContent = 'Giriş başarısız: ' + err.message;
  }
});

// ============================================
// SEKME
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
// SORU EKLE
// ============================================

document.getElementById('adminDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('adminDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    form.donem = parseInt(btn.dataset.value);
  });
});

document.getElementById('adminCevap').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('adminCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    form.cevap = btn.dataset.value;
  });
});

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

  const yeniSoru = {
    donem: form.donem, kurulId: kurul.toUpperCase(), ders, soru,
    secenekler, dogruCevap: form.cevap,
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
// SORU LİSTELE + DÜZENLE
// ============================================

let editAktifId = null;
const editDonem = { val: null };
const editCevap = { val: null };

async function soruListele() {
  const listesi = document.getElementById('soruListesi');
  listesi.innerHTML = '<p class="liste-bos">Yükleniyor...</p>';
  const kurulFiltre = document.getElementById('listKurul').value.trim().toUpperCase();

  try {
    const q = kurulFiltre
      ? query(collection(db, 'sorular'), where('kurulId', '==', kurulFiltre))
      : query(collection(db, 'sorular'));

    const snapshot = await getDocs(q);
    if (snapshot.empty) { listesi.innerHTML = '<p class="liste-bos">Henüz soru yok.</p>'; return; }

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
          <button class="action-btn duzenle" data-id="${docSnap.id}">Düzenle</button>
          <button class="action-btn sil" data-id="${docSnap.id}">Sil</button>
        </div>
      `;

      kart.querySelector('.action-btn.duzenle').addEventListener('click', () => {
        soruModalAc(docSnap.id, s);
      });

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

function soruModalAc(id, s) {
  editAktifId = id;

  // Alanları doldur
  document.getElementById('editKurul').value = s.kurulId || '';
  document.getElementById('editDers').value = s.ders || '';
  document.getElementById('editHedef').value = s.ogrenimHedefi || '';
  document.getElementById('editSoru').value = s.soru || '';
  document.getElementById('editA').value = s.secenekler?.A || '';
  document.getElementById('editB').value = s.secenekler?.B || '';
  document.getElementById('editC').value = s.secenekler?.C || '';
  document.getElementById('editD').value = s.secenekler?.D || '';
  document.getElementById('editE').value = s.secenekler?.E || '';
  document.getElementById('editAciklama').value = s.aciklama || '';

  // Dönem chip
  editDonem.val = s.donem;
  document.getElementById('editDonem').querySelectorAll('.chip').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.value) === s.donem);
  });

  // Cevap chip
  editCevap.val = s.dogruCevap;
  document.getElementById('editCevap').querySelectorAll('.chip').forEach(b => {
    b.classList.toggle('active', b.dataset.value === s.dogruCevap);
  });

  document.getElementById('soruModal').hidden = false;
}

// Edit dönem chip
document.getElementById('editDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('editDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    editDonem.val = parseInt(btn.dataset.value);
  });
});

// Edit cevap chip
document.getElementById('editCevap').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('editCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    editCevap.val = btn.dataset.value;
  });
});

document.getElementById('modalKapat').addEventListener('click', () => {
  document.getElementById('soruModal').hidden = true;
});

document.getElementById('editKaydetBtn').addEventListener('click', async () => {
  const msg = document.getElementById('editMsg');
  if (!editAktifId) return;

  const guncelleme = {
    donem: editDonem.val,
    kurulId: document.getElementById('editKurul').value.trim().toUpperCase(),
    ders: document.getElementById('editDers').value.trim(),
    soru: document.getElementById('editSoru').value.trim(),
    secenekler: {
      A: document.getElementById('editA').value.trim(),
      B: document.getElementById('editB').value.trim(),
      C: document.getElementById('editC').value.trim(),
      D: document.getElementById('editD').value.trim(),
      E: document.getElementById('editE').value.trim(),
    },
    dogruCevap: editCevap.val,
    guncellemeTarihi: new Date().toISOString()
  };

  const hedef = document.getElementById('editHedef').value.trim();
  const aciklama = document.getElementById('editAciklama').value.trim();
  if (hedef) guncelleme.ogrenimHedefi = hedef;
  if (aciklama) guncelleme.aciklama = aciklama;

  try {
    document.getElementById('editKaydetBtn').disabled = true;
    await updateDoc(doc(db, 'sorular', editAktifId), guncelleme);
    mesajGoster(msg, '✓ Güncellendi!', 'success');
    setTimeout(() => {
      document.getElementById('soruModal').hidden = true;
      soruListele();
    }, 1000);
  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
  } finally {
    document.getElementById('editKaydetBtn').disabled = false;
  }
});

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
    donem: cikmisForm.donem, yil, sinav, kurulId: kurul,
    ders, sira, soru, secenekler, dogruCevap: cikmisForm.cevap,
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
    document.querySelectorAll('#tab-cikmis .option-row input').forEach(i => i.value = '');
    document.getElementById('cikmisDonem').querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
    document.getElementById('cikmisCevap').querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
    cikmisForm.donem = null;
    cikmisForm.cevap = null;
    cikmisListele();
  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
  } finally {
    document.getElementById('cikmisKaydetBtn').disabled = false;
  }
});

// ============================================
// ÇIKMIŞ LİSTELE + DÜZENLE
// ============================================

let ceditAktifId = null;
const ceditDonem = { val: null };
const ceditCevap = { val: null };

async function cikmisListele() {
  const listesi = document.getElementById('cikmisListesi');
  listesi.innerHTML = '<p class="liste-bos">Yükleniyor...</p>';
  const kurulFiltre = document.getElementById('cikmisListKurul').value.trim().toUpperCase();

  try {
    const q = kurulFiltre
      ? query(collection(db, 'cikmis_sorular'), where('kurulId', '==', kurulFiltre))
      : query(collection(db, 'cikmis_sorular'));

    const snapshot = await getDocs(q);
    if (snapshot.empty) { listesi.innerHTML = '<p class="liste-bos">Henüz soru yok.</p>'; return; }

    listesi.innerHTML = '';
    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      const kart = document.createElement('div');
      kart.className = 'soru-kart';
      kart.innerHTML = `
        <div class="soru-kart-meta">
          <span class="soru-kart-pill">${s.yil} · ${s.sinav}</span>
          <span class="soru-kart-pill ders">${s.ders}</span>
        </div>
        <p class="soru-kart-metin">${kisalt(s.soru, 80)}</p>
        <div class="soru-kart-actions">
          <button class="action-btn duzenle" data-id="${docSnap.id}">Düzenle</button>
          <button class="action-btn sil" data-id="${docSnap.id}">Sil</button>
        </div>
      `;

      kart.querySelector('.action-btn.duzenle').addEventListener('click', () => {
        cikmisModalAc(docSnap.id, s);
      });

      kart.querySelector('.action-btn.sil').addEventListener('click', async () => {
        if (!confirm('Bu soruyu silmek istediğine emin misin?')) return;
        await deleteDoc(doc(db, 'cikmis_sorular', docSnap.id));
        kart.remove();
      });

      listesi.appendChild(kart);
    });
  } catch (err) {
    listesi.innerHTML = `<p class="liste-bos">Hata: ${err.message}</p>`;
  }
}

document.getElementById('cikmisListKurul').addEventListener('input', cikmisListele);

function cikmisModalAc(id, s) {
  ceditAktifId = id;

  document.getElementById('ceditYil').value = s.yil || '';
  document.getElementById('ceditSinav').value = s.sinav || '';
  document.getElementById('ceditKurul').value = s.kurulId || '';
  document.getElementById('ceditDers').value = s.ders || '';
  document.getElementById('ceditSira').value = s.sira || '';
  document.getElementById('ceditSoru').value = s.soru || '';
  document.getElementById('ceditA').value = s.secenekler?.A || '';
  document.getElementById('ceditB').value = s.secenekler?.B || '';
  document.getElementById('ceditC').value = s.secenekler?.C || '';
  document.getElementById('ceditD').value = s.secenekler?.D || '';
  document.getElementById('ceditE').value = s.secenekler?.E || '';
  document.getElementById('ceditAciklama').value = s.aciklama || '';

  ceditDonem.val = s.donem;
  document.getElementById('ceditDonem').querySelectorAll('.chip').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.value) === s.donem);
  });

  ceditCevap.val = s.dogruCevap;
  document.getElementById('ceditCevap').querySelectorAll('.chip').forEach(b => {
    b.classList.toggle('active', b.dataset.value === s.dogruCevap);
  });

  document.getElementById('cikmisModal').hidden = false;
}

document.getElementById('ceditDonem').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('ceditDonem').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ceditDonem.val = parseInt(btn.dataset.value);
  });
});

document.getElementById('ceditCevap').querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('ceditCevap').querySelectorAll('.chip')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ceditCevap.val = btn.dataset.value;
  });
});

document.getElementById('cikmisModalKapat').addEventListener('click', () => {
  document.getElementById('cikmisModal').hidden = true;
});

document.getElementById('ceditKaydetBtn').addEventListener('click', async () => {
  const msg = document.getElementById('ceditMsg');
  if (!ceditAktifId) return;

  const guncelleme = {
    donem: ceditDonem.val,
    yil: parseInt(document.getElementById('ceditYil').value),
    sinav: document.getElementById('ceditSinav').value.trim(),
    kurulId: document.getElementById('ceditKurul').value.trim().toUpperCase(),
    ders: document.getElementById('ceditDers').value.trim(),
    sira: parseInt(document.getElementById('ceditSira').value) || 0,
    soru: document.getElementById('ceditSoru').value.trim(),
    secenekler: {
      A: document.getElementById('ceditA').value.trim(),
      B: document.getElementById('ceditB').value.trim(),
      C: document.getElementById('ceditC').value.trim(),
      D: document.getElementById('ceditD').value.trim(),
      E: document.getElementById('ceditE').value.trim(),
    },
    dogruCevap: ceditCevap.val,
    guncellemeTarihi: new Date().toISOString()
  };

  const aciklama = document.getElementById('ceditAciklama').value.trim();
  if (aciklama) guncelleme.aciklama = aciklama;

  try {
    document.getElementById('ceditKaydetBtn').disabled = true;
    await updateDoc(doc(db, 'cikmis_sorular', ceditAktifId), guncelleme);
    mesajGoster(msg, '✓ Güncellendi!', 'success');
    setTimeout(() => {
      document.getElementById('cikmisModal').hidden = true;
      cikmisListele();
    }, 1000);
  } catch (err) {
    mesajGoster(msg, 'Hata: ' + err.message, 'error');
  } finally {
    document.getElementById('ceditKaydetBtn').disabled = false;
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
  document.querySelectorAll('#tab-ekle .option-row input').forEach(i => i.value = '');
  document.getElementById('adminDonem').querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  document.getElementById('adminCevap').querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  form.donem = null;
  form.cevap = null;
}
