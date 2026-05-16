# Moscos — Soru Bankası

> *Çoktan atılmış bir mızrak.*

Tıp fakültesi kurul sınavlarına yönelik kişisel soru bankası ve sınav hazırlık platformu.

---

## Özellikler

### 📝 Soru Bankası & Sınav Modu
- Dönem, kurul ve derse göre filtrelenmiş soru havuzu
- Rastgele karıştırılmış sorularla mini sınav
- Anında doğru/yanlış geri bildirimi ve açıklamalar
- Sınav sonunda ders bazında performans analizi

### 🏛️ Simülasyon Modu
- Gerçek çıkmış sınav soruları, orijinal sırasıyla
- Yıl ve sınava göre filtreleme
- Sınav bitmeden geri bildirim yok — gerçek sınav hissi
- Optik okuyucu tarzı sonuç ekranı ile net hesaplama

### 👤 Kişisel Profil & İstatistikler
- Google hesabıyla giriş
- Her sınavın otomatik kaydedilmesi
- Geçmiş sınav sonuçları ve gelişim takibi
- Ders bazında performans grafikleri

### ⚙️ Admin Paneli
- Google Auth korumalı
- Soru ekleme, düzenleme ve silme
- Çıkmış sınav soruları yönetimi
- Firebase Firestore entegrasyonu

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | HTML, CSS, Vanilla JS |
| Veritabanı | Firebase Firestore |
| Auth | Firebase Authentication (Google) |
| Hosting | Netlify |
| PWA | Service Worker + Web Manifest |

---

## Kurulum

Proje tamamen statik — klonla ve tarayıcıda aç.

```bash
git clone https://github.com/kullaniciadi/moscov.git
cd moscov
