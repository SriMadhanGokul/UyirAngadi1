import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
} from '../utils/constants';
import { cx } from '../utils/format';

export interface RejectedFile {
  key: string;
  params?: Record<string, unknown>;
}

interface PhotoUploaderProps {
  photos: File[];
  previews: string[];
  video: File | null;
  videoPreview?: string | null;
  onPhotosChange: (files: File[]) => void;
  onVideoChange: (file: File | null) => void;
  onReject: (error: RejectedFile) => void;
  disabled?: boolean;
}

/**
 * Validates files client-side with the same limits as the backend (multer) so
 * users get instant feedback instead of a 4xx response.
 */
export default function PhotoUploader({
  photos,
  previews,
  video,
  videoPreview,
  onPhotosChange,
  onVideoChange,
  onReject,
  disabled,
}: PhotoUploaderProps) {
  const { t } = useTranslation();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files ?? []);
    if (incoming.length === 0) return;

    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        onReject({ key: 'sell.errors.invalidType' });
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        onReject({ key: 'sell.errors.fileTooLarge' });
        return;
      }
    }

    const merged = [...photos, ...incoming];
    if (merged.length > MAX_PHOTOS) {
      onReject({ key: 'sell.errors.tooManyPhotos' });
      onPhotosChange(merged.slice(0, MAX_PHOTOS));
    } else {
      onPhotosChange(merged);
    }
    // Allow re-selecting the same file later.
    event.target.value = '';
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      onReject({ key: 'sell.errors.invalidType' });
      event.target.value = '';
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      onReject({ key: 'sell.errors.videoTooLarge' });
      event.target.value = '';
      return;
    }
    onVideoChange(file);
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className={cx(
                'group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100',
                index === 0 && 'ring-2 ring-brand-500'
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  1
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                disabled={disabled}
                aria-label={t('sell.remove')}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-90 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={disabled}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-500 hover:border-brand-400 hover:text-brand-600"
            >
              <span className="text-2xl leading-none">＋</span>
              <span className="text-[11px] font-medium">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </button>
          )}
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
        <p className="mt-1.5 text-xs text-neutral-500">{t('sell.photosHint')}</p>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={disabled}
          className="btn-outline btn-sm mt-2"
        >
          {t('sell.choosePhotos')}
        </button>
      </div>


      <div>
        <label className="field-label">{t('sell.video')}</label>
        {video || videoPreview ? (
          <div className="flex items-center gap-3">
            {videoPreview && (
              <video
                src={videoPreview}
                controls
                className="h-24 w-36 rounded-xl border border-neutral-200 bg-black object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-neutral-700">{video?.name}</p>
              <button
                type="button"
                onClick={() => onVideoChange(null)}
                disabled={disabled}
                className="btn-ghost btn-sm mt-1 text-red-600"
              >
                {t('sell.remove')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={disabled}
            className="btn-outline btn-sm"
          >
            🎬 {t('sell.chooseVideo')}
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept={ALLOWED_VIDEO_TYPES.join(',')}
          className="hidden"
          onChange={handleVideoSelect}
        />
        <p className="mt-1.5 text-xs text-neutral-500">{t('sell.videoHint')}</p>
      </div>
    </div>
  );
}

