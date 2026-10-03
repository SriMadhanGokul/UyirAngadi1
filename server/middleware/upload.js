import multer from 'multer';
import AppError from '../utils/AppError.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'audio/3gpp'];
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.fieldname === 'photos' && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Only JPG, PNG, or WEBP images are allowed.', 400));
  }
  if (file.fieldname === 'video' && !ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Only MP4, MOV, or WEBM videos are allowed.', 400));
  }
  cb(null, true);
}

export const uploadListingMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_BYTES,
    files: MAX_PHOTOS + 1,
  },
}).fields([
  { name: 'photos', maxCount: MAX_PHOTOS },
  { name: 'video', maxCount: 1 },
]);

export const uploadSingleImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG, or WEBP images are allowed.', 400));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_PHOTO_BYTES },
}).single('image');
