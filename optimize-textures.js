const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');

// List of large textures that need aggressive optimization
const largeTextures = [
  'sun_texture.webp',
  'moon_texture.webp',
  'mercury_texture.webp',
  'venus_texture.webp',
  'mars_texture.webp',
  'jupiter_texture.webp',
  'earth_texture.webp'
];

// Function to optimize a texture
async function optimizeTexture(filename) {
  const inputPath = path.join(assetsDir, filename);
  const outputPath = path.join(assetsDir, 'optimized_' + filename);

  try {
    await sharp(inputPath)
      .resize(512, 512, { // Reduce size to 512x512
        fit: 'contain',
        withoutEnlargement: false
      })
      .webp({
        quality: 15, // Very aggressive compression
        effort: 6,
        lossless: false,
        nearLossless: false,
        reductionEffort: 6
      })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`Optimized ${filename} - New size: ${(stats.size / 1024).toFixed(2)} KB`);

    // Try to replace the original file
    try {
      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, inputPath);
    } catch (err) {
      console.log(`Could not replace ${filename}, optimized version saved as optimized_${filename}`);
    }
  } catch (error) {
    console.error(`Error optimizing ${filename}:`, error);
  }
}

// Process all large textures
async function optimizeAll() {
  for (const texture of largeTextures) {
    if (fs.existsSync(path.join(assetsDir, texture))) {
      await optimizeTexture(texture);
    }
  }
}

optimizeAll().then(() => {
  console.log('Texture optimization complete');
});
