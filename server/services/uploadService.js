import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Uploads a file buffer to Cloudinary. Local storage is never used for new uploads.
 * @param {Express.Multer.File} file
 * @param {'image'|'video'} resourceType
 */
export async function uploadMedia(file, resourceType = 'image') {
  if (!isCloudinaryConfigured) {
    throw new AppError('Uploads are unavailable because Cloudinary is not configured.', 503);
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: process.env.CLOUDINARY_FOLDER || 'uyirangadi', resource_type: resourceType },
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

export { uploadsDir };
