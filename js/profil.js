/* ============================================
   PROFİL SAYFASI
   ============================================ */

import { db, auth } from '../firebase.js';
import {
  collection, getDocs, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const profilGiris = document.getElementById('profilGiris');
const profilMain = document.getElementById('profilMain');
const profilGirisBtn = document.getElementById('profilGirisBtn');
const cikisBtn = document.getElementById('cikisBtn');

// ============================================
// AUTH
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    profilGiris.hidden = false;
    profilMain.hidden = true;
    return;
  }

  profilGiris.hidden = true;
  profilMain.hidden = false;

  document.getElementById('kullaniciFoto').src = user.photoURL || '';
  document.getElementById('kullaniciAd').textContent = user.displayName || '—';
  document.getElementById('kullaniciEmail').textContent = user.email || '—';

  console.log('Kullanıcı UID:', user.uid);
  await veriYukle(user.uid);
});

profilGirisBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    console.error(err);
  }
});

cikisBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// ============================================
// VERİ YÜKLEME
// ============================================

async function veriYukle(userId) {
  try {
    console.log('veriYukle başladı, userId:', userId);
    
    const q = query(
      collection(db, 'kullanici_sonuclari', userId, 'sonuclar')
    );
    
    console.log('Query oluşturuldu');
    
    const snapshot = await getDocs(q);
    
    console.log('Snapshot alındı, boyut:', snapshot.size);
    
    const sonuclar = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    genelIstatCiz(sonuclar);
    dersIstatCiz(sonuclar);
    gecmisSinavCiz(sonuclar);

  } catch (err) {
    console.error('Hata detayı:', err.message, err.code);
    document.getElementById('gegmisSinavList').innerHTML =
      '<p class="liste-bos">Veri yüklenemedi: ' + err.message + '</p>';
  }
}

// ============================================
// GENEL İSTATİSTİK
// ============================================

function genelIstatCiz(sonuclar) {
  if (sonuclar.length === 0) {
    document.getElementById('toplamSinav').textContent = '0';
    document.getElementById('toplamSoru').textContent = '0';
    document.getElementById('ortalamaYuzde').textContent = '—';
    document.getElementById('enYuksek').textContent = '—';
    return;
  }

  const toplamSoru = sonuclar.reduce((acc, s) => acc + (s.toplam || 0), 0);
  const buAy = sonuclar.filter(s => {
  const tarih = new Date(s.tarih);
  const simdi = new Date();
  return tarih.getMonth() === simdi.getMonth() &&
         tarih.getFullYear() === simdi.getFullYear();
}).length;

document.getElementById('enYuksek').textContent = buAy;


  document.getElementById('toplamSinav').textContent = sonuclar.length;
  document.getElementById('toplamSoru').textContent = toplamSoru;
  document.getElementById('ortalamaYuzde').textContent = `%${ortalama}`;
  document.getElementById('enYuksek').textContent = `%${enYuksek}`;
}

// ============================================
// DERS BAZINDA İSTATİSTİK
// ============================================

function dersIstatCiz(sonuclar) {
  const dersDetay = {};

  sonuclar.forEach(s => {
    if (!s.dersDetay) return;
    Object.entries(s.dersDetay).forEach(([ders, stat]) => {
      if (!dersDetay[ders]) dersDetay[ders] = { dogru: 0, toplam: 0 };
      dersDetay[ders].dogru += stat.dogru || 0;
      dersDetay[ders].toplam += stat.toplam || 0;
    });
  });

  const liste = document.getElementById('dersIstatList');

  if (Object.keys(dersDetay).length === 0) {
    liste.innerHTML = '<p class="liste-bos">Henüz veri yok.</p>';
    return;
  }

  liste.innerHTML = '';
  Object.entries(dersDetay)
    .sort((a, b) => b[1].toplam - a[1].toplam)
    .forEach(([ders, stat]) => {
      const yuzde = stat.toplam > 0
        ? Math.round((stat.dogru / stat.toplam) * 100)
        : 0;

      const item = document.createElement('div');
      item.className = 'ders-item';
      item.innerHTML = `
        <div class="ders-info">
          <span class="ders-ad">${ders}</span>
          <span class="ders-skor">${stat.dogru}/${stat.toplam} · %${yuzde}</span>
        </div>
        <div class="ders-bar">
          <div class="ders-bar-fill" style="width:${yuzde}%"></div>
        </div>
      `;
      liste.appendChild(item);
    });
}

// ============================================
// GEÇMİŞ SINAVLAR
// ============================================

function gecmisSinavCiz(sonuclar) {
  const liste = document.getElementById('gegmisSinavList');

  if (sonuclar.length === 0) {
    liste.innerHTML = '<p class="liste-bos">Henüz sınav yok.</p>';
    return;
  }

  liste.innerHTML = '';
  sonuclar.forEach(s => {
    const tarih = new Date(s.tarih).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const baslik = s.mod === 'simulasyon'
  ? `${s.yil} · ${s.kurulId || ''}`
  : `D${s.donem} · ${s.kurulId || ''}`;


    const renk = s.yuzde >= 75 ? '#4A7A4A' : s.yuzde >= 50 ? '#8B2635' : '#8B3838';

    const kart = document.createElement('div');
    kart.className = 'gecmis-kart';
    kart.innerHTML = `
      <div class="gecmis-kart-ust">
        <div>
          <p class="gecmis-baslik">${baslik}</p>
          <p class="gecmis-tarih">${tarih}</p>
        </div>
        <div class="gecmis-skor" style="color:${renk}">%${s.yuzde}</div>
      </div>
      <div class="gecmis-detay">
        <span class="gecmis-stat" style="color:#4A7A4A">✓ ${s.dogru}</span>
        <span class="gecmis-stat" style="color:#8B3838">✗ ${s.yanlis}</span>
        <span class="gecmis-stat" style="color:#8B5F62">— ${s.bos}</span>
        <span class="gecmis-stat">${s.toplam} soru</span>
      </div>
    `;
    liste.appendChild(kart);
  });
}
