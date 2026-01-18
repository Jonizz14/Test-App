import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bannerDir = path.join(__dirname, '..', 'public', 'banner');

// Automatically find all PNG files
const allFiles = fs.readdirSync(bannerDir);
const images = allFiles.filter(file => file.toLowerCase().endsWith('.png'));

async function convertToWebP() {
  console.log('🖼️  Converting images to WebP format...\n');

  for (const image of images) {
    const inputPath = path.join(bannerDir, image);
    const outputPath = path.join(bannerDir, image.replace('.png', '.webp'));

    try {
      const info = await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      const originalSize = fs.statSync(inputPath).size;
      const newSize = info.size;
      const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

      console.log(`✅ ${image} → ${image.replace('.png', '.webp')}`);
      console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   WebP: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Reduction: ${reduction}%\n`);
    } catch (error) {
      console.error(`❌ Error converting ${image}:`, error.message);
    }
  }

  console.log('✨ Conversion complete!');
}

convertToWebP();
