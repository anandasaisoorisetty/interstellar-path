const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets');

// Function to convert a single image to WebP
function convertToWebP(inputPath, outputPath) {
  try {
    // Use different settings based on file size
    const stats = fs.statSync(inputPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    let quality = 50; // Default quality
    let resize = null;

    // Adjust quality and size based on file size
    if (fileSizeInMB > 1) {
      quality = 20; // Higher compression for large files
      resize = { width: 1024 }; // Reduce size of large textures
    } else if (fileSizeInMB > 0.5) {
      quality = 30; // Medium compression for medium files
      resize = { width: 1024 };
    }

    let sharpInstance = sharp(inputPath);

    // Apply resize if needed
    if (resize) {
      sharpInstance = sharpInstance.resize(resize.width, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    sharpInstance
      .webp({
        quality: quality,
        effort: 6, // Maximum compression effort
        lossless: false,
        nearLossless: true,
        reductionEffort: 6
      })
      .toFileSync(outputPath);

    console.log(`Converted ${path.basename(inputPath)} to WebP with quality ${quality}`);

    // Delete the original file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(inputPath);
      console.log(`Removed original file: ${path.basename(inputPath)}`);
    }
  } catch (error) {
    console.error(`Error converting ${path.basename(inputPath)}:`, error);
  }
}

// Process all JPG and PNG files
const files = fs.readdirSync(assetsDir);
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.png') {
    const inputPath = path.join(assetsDir, file);
    const outputPath = path.join(assetsDir, path.basename(file, ext) + '.webp');
    convertToWebP(inputPath, outputPath);
  }
}
