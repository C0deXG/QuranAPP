const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'fonts');

console.log('🔄 Renaming font files from .TTF to .ttf...\n');

fs.readdir(fontsDir, (err, files) => {
  if (err) {
    console.error('❌ Error reading fonts directory:', err);
    process.exit(1);
  }

  let renamed = 0;
  let skipped = 0;

  files.forEach(file => {
    if (file.endsWith('.TTF')) {
      const oldPath = path.join(fontsDir, file);
      const newName = file.slice(0, -4) + '.ttf';
      const newPath = path.join(fontsDir, newName);

      try {
        fs.renameSync(oldPath, newPath);
        renamed++;
        if (renamed <= 10) {
          console.log(`  ✓ ${file} → ${newName}`);
        }
      } catch (e) {
        console.error(`  ❌ Failed to rename ${file}:`, e.message);
      }
    } else {
      skipped++;
    }
  });

  if (renamed > 10) {
    console.log(`  ... and ${renamed - 10} more files`);
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ Font Renaming Complete!                                ║
╠════════════════════════════════════════════════════════════╣
║  Renamed: ${String(renamed).padEnd(4)} files (.TTF → .ttf)                   ║
║  Skipped: ${String(skipped).padEnd(4)} files (already .ttf or other)         ║
╚════════════════════════════════════════════════════════════╝
  `);
});




