# 🏢 Visitor Management Solution  

> Ziyaretçi giriş-çıkışlarını **QR Kod** ile takip eden tam entegre çözüm:  
> **ASP.NET Core Web API + Admin Panel (React) + Katılım Formu (React) + Mobil QR Uygulama (Expo/React Native).**  

<p align="center">
  <img src="https://img.shields.io/badge/ASP.NET%20Core-8.0-blue?logo=dotnet" />
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" />
  <img src="https://img.shields.io/badge/React%20Native-Expo-000000?logo=expo" />
  <img src="https://img.shields.io/badge/Database-Entity%20Framework%20Core-2ecc71?logo=sqlite" />
  <img src="https://img.shields.io/badge/Tests-xUnit-orange?logo=githubactions" />
</p>

---

## ✨ Özellikler

- ✅ **Ziyaretçi Kayıt & QR Kod Üretimi**  
- ✅ **QR Kod ile Giriş / Çıkış Takibi**  
- ✅ **Admin Paneli**: Ziyaretçi listesi, filtreleme, raporlama  
- ✅ **Katılım Formu (Web)**: Ziyaretçinin kendi kaydını yapabilmesi  
- ✅ **Mobil Uygulama (Expo)**: QR tarayıcı ile giriş/çıkış işlemleri  
- ✅ **Testler (xUnit)**: API fonksiyonlarının otomatik testleri  
- ✅ **SignalR** ile anlık bildirimler  

---

## 📂 Proje Yapısı  

VisitorManagementSolution/
│
├── VisitorManagement/ # ASP.NET Core Web API
│ ├── Controllers/
│ ├── Entities/
│ ├── VisitorManagement.Api.Tests/ # Test projesi (xUnit)
│ └── ...
│
├── visitor-admin/ # React tabanlı admin panel
│
├── visitor-portal/ # Katılım formu (React)
│
├── visitor-scanner/ # Mobil uygulama (Expo/React Native)
│
├── .gitignore
└── README.md


---

## 🚀 Kurulum  

### 1️⃣ API (ASP.NET Core)  

```bash
cd VisitorManagement
dotnet restore
dotnet run

🔗 API adresi: https://localhost:7023/api

Testleri çalıştırmak için:
cd VisitorManagement/VisitorManagement.Api.Tests
dotnet test

2️⃣ Admin Panel (React + Vite)
cd visitor-admin
npm install
npm run dev

3️⃣ Katılım Formu
cd visitor-portal
npm install
npm run dev

4️⃣ Mobil Uygulama (Expo / React Native)
cd visitor-scanner
npm install
npx expo start

📱 QR kodu okut → uygulamayı cihazında aç.

📊 Teknolojiler

Backend: ASP.NET Core 8, EF Core, SignalR

Frontend: React (Vite) + Tailwind

Mobile: React Native (Expo)

Database: SQL Server / SQLite

Testing: xUnit

<p align="center">✨ Developed by <b>MellyStark</b> with ❤️</p> ```
