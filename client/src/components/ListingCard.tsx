import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Listing } from '../types';
import { formatAge, formatPrice, timeAgo } from '../utils/format';
import { getCategoryIcon } from '../utils/categoryIcons';
import StatusBadge from './StatusBadge';

interface ListingCardProps {
  listing: Listing;
  /** Show the moderation status chip (used in dashboard tables/lists). */
  showStatus?: boolean;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export default function ListingCard({
  listing,
  showStatus = false,
  isSaved = false,
  onToggleSave,
}: ListingCardProps) {
  const { t, i18n } = useTranslation();
  const age = formatAge(listing.age, t);
  const photo = listing.photos?.[0];
  const isSold = listing.status === 'SOLD';

  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link
        to={`/listings/${listing._id}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🐾</div>
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {listing.isFeatured && (
            <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              ★ {t('admin.feature')}
            </span>
          )}
          {isSold && (
            <span className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              {t('seller.status.SOLD')}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
          <span className="text-lg font-bold text-white drop-shadow">{formatPrice(listing.price)}</span>
          {listing.isNegotiable && (
            <span className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {t('listing.negotiable')}
            </span>
          )}
        </div>
      </Link>

      {onToggleSave && (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full bg-white/95 text-xl leading-none text-rose-600 shadow transition-opacity hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
          aria-label={t(isSaved ? 'listing.unsave' : 'listing.save')}
          aria-pressed={isSaved}
          title={t(isSaved ? 'listing.unsave' : 'listing.save')}
          onClick={() => onToggleSave(listing._id)}
        >
          {isSaved ? '♥' : '♡'}
        </button>
      )}

      <Link
        to={`/listings/${listing._id}`}
        className="flex flex-1 flex-col gap-1.5 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">
          {listing.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden>{getCategoryIcon(listing.category)}</span>
            {t(`categories.${listing.category}`, { defaultValue: listing.category })}
          </span>
          {listing.breed && <span className="text-neutral-400">•</span>}
          {listing.breed && <span>{listing.breed}</span>}
          {age && <span className="text-neutral-400">•</span>}
          {age && <span>{age}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1 truncate">
            📍 {listing.location?.district || t('common.unknown')}
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt, i18n.language)}</span>
        </div>

        {showStatus && (
          <div className="pt-1">
            <StatusBadge status={listing.status} />
          </div>
        )}
      </Link>
    </article>
  );
}
