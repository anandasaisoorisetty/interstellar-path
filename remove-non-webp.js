const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');

// Function to safely remove files
function removeFiles() {
  fs.readdirSync(assetsDir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const filePath = path.join(assetsDir, file);

    // Skip if it's a directory, WebP file, or backup directory
    if (fs.statSync(filePath).isDirectory() ||
        ext === '.webp' ||
        file === 'backup' ||
        file === 'manifest.webmanifest' ||
        file === 'site.webmanifest') {
      return;
    }

    // Remove the file if it's an image and we have a WebP version
    if (ext === '.jpg' || ext === '.png' || ext === '.ico') {
      const webpPath = path.join(assetsDir, path.basename(file, ext) + '.webp');
      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(filePath);
        console.log(`Removed ${file}`);
      }
    }
  });
}

// Execute the removal
try {
  removeFiles();
  console.log('Cleanup completed successfully');
} catch (error) {
  console.error('Error during cleanup:', error);
}
