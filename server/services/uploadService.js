import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Uploads a file buffer to Cloudinary when configured.
 * If Cloudinary is not configured, falls back to local /uploads storage.
 * When Cloudinary is configured, we intentionally do not silently store locally,
 * because the app should use the remote media service for production uploads.
 * @param {Express.Multer.File} file
 * @param {'image'|'video'} resourceType
 */
export async function uploadMedia(file, resourceType = 'image') {
  if (isCloudinaryConfigured) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'uyirangadi', resource_type: resourceType },
        (error, res) => {
          if (error) return reject(error);
          resolve(res);
        }
      );
      stream.end(file.buffer);
    });

    if (!result?.secure_url) {
      throw new Error('Cloudinary upload succeeded but no secure URL was returned.');
    }

    return result.secure_url;
  }

  // Local disk fallback (dev only when Cloudinary is not configured)
  const ext = path.extname(file.originalname) || (resourceType === 'video' ? '.mp4' : '.jpg');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  return `/uploads/${filename}`;
}

export { uploadsDir };
