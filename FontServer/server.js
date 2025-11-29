const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Enable CORS for all origins (needed for React Native)
app.use(cors());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve fonts from the /fonts directory
// The library requests fonts like: http://localhost:3001/fonts/QCF_P001.ttf
app.use('/fonts', express.static(path.join(__dirname, 'fonts'), {
  setHeaders: (res, filePath) => {
    // Set correct content type for font files
    if (filePath.endsWith('.ttf') || filePath.endsWith('.TTF')) {
      res.setHeader('Content-Type', 'font/ttf');
    }
  }
}));

// Also serve fonts at root /QCF_*.ttf in case library requests without /fonts/
app.use('/', express.static(path.join(__dirname, 'fonts'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ttf') || filePath.endsWith('.TTF')) {
      res.setHeader('Content-Type', 'font/ttf');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Font server is running' });
});

// List available fonts
app.get('/list', (req, res) => {
  const fontsDir = path.join(__dirname, 'fonts');
  fs.readdir(fontsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read fonts directory' });
    }
    const fontFiles = files.filter(f => f.endsWith('.ttf') || f.endsWith('.TTF'));
    res.json({ 
      count: fontFiles.length, 
      fonts: fontFiles.slice(0, 20),
      message: `Showing first 20 of ${fontFiles.length} fonts`
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🕌 Quran Font Server Started! 🕌                ||
╠════════════════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}/fonts/                 ║
║  Network:  http://<your-ip>:${PORT}/fonts/                 ║
║                                                            ║y

║  For React Native, use:                                    ║
║  - Android Emulator: http://10.0.2.2:${PORT}/fonts/        ║
║  - iOS Simulator:    http://localhost:${PORT}/fonts/       ║
║  - Physical Device:  http://<your-computer-ip>:${PORT}/fonts/ ║
║                                                            ║
║  Test: http://localhost:${PORT}/health                     ║
║  List: http://localhost:${PORT}/list                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});




