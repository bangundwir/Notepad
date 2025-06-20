# Google Docs Notepad

Aplikasi notepad real-time yang terhubung dengan Google Docs melalui Google Apps Script API.

## ✨ Fitur Utama

- 📝 **Real-time Sync** - Otomatis menyimpan ke Google Docs
- 🌐 **CORS-Free** - Menggunakan form-encoded POST untuk menghindari preflight
- 🔒 **Environment Variables** - API URL disimpan dengan aman
- 📱 **Responsive Design** - Optimized untuk desktop dan mobile
- ⚡ **Smart Batching** - Intelligent save timing untuk performa optimal

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/bangundwir/Notepad.git
cd notepad
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file dan masukkan Google Apps Script URL Anda
nano .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔧 Setup Google Apps Script

### 1. Buat Google Apps Script Project
1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Copy code dari `appscript/code.gs`
4. Paste ke Apps Script editor

### 2. Deploy as Web App
1. Klik **Deploy** > **New deployment**
2. Pilih type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy URL yang diberikan

### 3. Update Environment Variable
```bash
# Edit .env file
VITE_GOOGLE_DOCS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Setup Google Document
1. Buat Google Document baru
2. Copy Document ID dari URL
3. Update `DOCUMENT_ID` di `appscript/code.gs`
4. Re-deploy Apps Script

## 🐛 Troubleshooting CORS

### Masalah CORS Sebelumnya
```
Access to fetch from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Solusi yang Diterapkan

1. **Form-Encoded POST**: Menggunakan `application/x-www-form-urlencoded` instead of JSON untuk menghindari preflight requests
2. **Proper CORS Headers**: Apps Script mengirim header CORS yang benar
3. **OPTIONS Handler**: Menangani preflight requests dengan benar
4. **Environment Variables**: API URL disimpan dengan aman

### Test CORS Fix
Buka `test-cors-fix.html` di browser untuk test manual:
```
http://localhost:5173/test-cors-fix.html
```

## 📁 Structure

```
notepad/
├── src/
│   ├── components/
│   │   └── Notepad.tsx          # Main notepad component
│   ├── services/
│   │   └── googleDocsApi.ts     # API service dengan CORS fix
│   └── main.tsx
├── appscript/
│   └── code.gs                  # Google Apps Script code
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
└── test-cors-fix.html          # Manual CORS test
```

## 🔒 Security Notes

- File `.env` tidak di-track di git untuk keamanan
- API URL disimpan sebagai environment variable
- Google Apps Script hanya menerima request dari domain yang authorized

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Update production environment dengan:
```bash
VITE_GOOGLE_DOCS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 📱 Mobile Support

- Optimized untuk iOS dan Android
- Prevents zoom pada input fields
- Touch-friendly interface
- Responsive design dengan Tailwind CSS

## ⚡ Performance Features

- **Smart Sync**: Intelligent batching based pada content size
- **Debounced Saves**: Prevents excessive API calls
- **Retry Logic**: Automatic retry dengan exponential backoff
- **Background Sync**: Non-blocking save operations

## 🛠 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Google Apps Script
- **Storage**: Google Docs

## 📄 License

MIT License - lihat file LICENSE untuk detail

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

Jika mengalami masalah:
1. Check console untuk error messages
2. Test dengan `test-cors-fix.html`
3. Verify Google Apps Script deployment
4. Check environment variables

---

**Note**: Pastikan Google Apps Script sudah di-deploy dengan permissions yang benar dan Document ID sudah diupdate sesuai Google Document yang akan digunakan.
