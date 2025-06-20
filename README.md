# Google Docs Notepad - Real-time Editor

A modern, real-time notepad application that syncs with Google Docs using Google Apps Script API.

## 🚀 Features

- **Real-time Sync**: All changes automatically sync to Google Docs
- **Auto-save**: Content saves every 2 seconds automatically
- **Manual Save**: Press `Ctrl+S` for instant save
- **Connection Status**: Visual indicators for connection and save status
- **Modern UI**: Dark theme with monospace font (JetBrains Mono)
- **Live Character Count**: Real-time character and word counting
- **Error Handling**: Graceful handling of connection issues

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Google Apps Script (Google Docs API)
- **Real-time**: RESTful API with auto-save functionality

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Google Apps Script API (already configured)

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🔗 API Integration

The application connects to a Google Apps Script API with the following endpoints:

- `GET /exec?action=ping` - Test connection
- `GET /exec?action=get` - Retrieve document content  
- `POST /exec` with `action=replace` - Save entire content
- `POST /exec` with `action=append` - Append new content
- `POST /exec` with `action=log` - Add log entries

## ⌨️ Keyboard Shortcuts

- `Ctrl+S` - Manual save
- Standard text editing shortcuts supported

## 🎨 Features Overview

### Connection Status Indicators
- 🟢 **Connected** - Ready to sync
- 🟡 **Connecting** - Establishing connection
- 🔵 **Saving** - Writing to Google Docs
- 🔴 **Error** - Connection or save failed

### Auto-save Functionality
- Debounced auto-save (2-second delay)
- Visual feedback for unsaved changes
- Automatic retry on connection recovery

### Real-time Updates
- Character count tracking
- Last save timestamp
- Document metadata display

## 🏗 Project Structure

```
notepad/
├── src/
│   ├── components/
│   │   └── Notepad.tsx          # Main editor component
│   ├── services/
│   │   └── googleDocsApi.ts     # API service layer
│   ├── App.tsx                  # Root component
│   ├── index.css               # Global styles
│   └── main.tsx                # Entry point
├── public/
└── package.json
```

## 🔧 Configuration

The API endpoint is configured in `src/services/googleDocsApi.ts`:

```typescript
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

## 🐛 Troubleshooting

### Connection Issues
- Check internet connection
- Verify API endpoint is accessible
- Check browser console for errors

### Save Issues  
- Ensure you have write permissions to the Google Doc
- Check if the document ID is correct
- Verify Google Apps Script is deployed properly

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🌟 Demo

The application provides a seamless notepad experience with:
- Instant feedback on typing
- Visual save confirmations
- Persistent storage in Google Docs
- Professional dark theme interface

Perfect for:
- 📝 Note-taking
- 💻 Code snippets  
- 📄 Document drafting
- 🎯 Real-time collaboration preparation

---

**Built with ❤️ using React, TypeScript, and Google Apps Script**
