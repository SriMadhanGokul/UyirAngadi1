import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import ContactButtons from '../components/ContactButtons';
import ListingGrid from '../components/ListingGrid';
import ReportModal from '../components/ReportModal';
import { SuccessBanner } from '../components/Feedback';
import { favouriteService } from '../services';
import listingService from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';
import { CATEGORY_DETAIL_FIELDS, getDetailFieldLabel } from '../utils/constants';
import {
  formatAge,
  formatBoolean,
  formatDate,
  formatPrice,
  formatPublicLocation,
  formatYear,
} from '../utils/format';
import { getCategoryIcon } from '../utils/categoryIcons';

const RECENT_KEY = 'uyirangadi_recent';

/** Keeps a small client-side "recently viewed" list (localStorage, max 12). */
function rememberView(listing: Listing) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [listing._id, ...list.filter((item: string) => item !== listing._id)].slice(0, 12);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage disabled - ignore */
  }
}

export default function ListingDetailPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setSelectedPhotoIndex(0);
    listingService
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        setListing(res.data);
        rememberView(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : t('common.error');
        if (/not.*found|could not be found/i.test(message)) setNotFound(true);
        else setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    listingService
      .list({ category: listing.category, page: 1, limit: 5, sort: 'newest' })
      .then((res) => setSimilar(res.data.filter((item) => item._id !== listing._id).slice(0, 4)))
      .catch(() => setSimilar([]));
  }, [listing]);

  /** Reflects whether this listing is already saved by the current user. */
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    favouriteService
      .list()
      .then((items) => setSaved(items.some((item) => item.listing?._id === id)))
      .catch(() => setSaved(false));
  }, [id, isAuthenticated]);

  const toggleSave = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/listings/${id}` } });
      return;
    }
    try {
      if (saved) {
        await favouriteService.remove(id);
        setSaved(false);
      } else {
        await favouriteService.add(id);
        setSaved(true);
      }
    } catch {
      /* non-blocking */
    }
  }, [id, isAuthenticated, navigate, saved]);

  const ownerId = typeof listing?.seller === 'object' ? listing.seller._id : null;
  const isOwner = Boolean(ownerId && user?._id === ownerId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6">
        <div className="aspect-[16/10] w-full rounded-2xl bg-neutral-200" />
        <div className="mt-6 h-7 w-2/3 rounded bg-neutral-200" />
        <div className="mt-3 h-5 w-1/3 rounded bg-neutral-200" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Seo title={t('listing.notFound')} noIndex />
        <p className="text-5xl">🐾</p>
        <h1 className="page-title mt-4">{t('listing.notFound')}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t('listing.notFoundText')}</p>
        <Link to="/listings" className="btn-primary mt-6">
          {t('buyer.browse')}
        </Link>
      </div>
    );
  }

  const isSold = listing.status === 'SOLD';
  const age = formatAge(listing.age, t);
  const photos = listing.photos ?? [];
  const selectedPhoto = photos[selectedPhotoIndex] ?? photos[0];
  const seller = typeof listing.seller === 'object' ? listing.seller : null;
  const detailFields = CATEGORY_DETAIL_FIELDS[listing.category] ?? [];
  const storedDetails = listing.categorySpecificDetails ?? {};
  const extraKeys = Object.keys(storedDetails).filter(
    (key) => !detailFields.some((field) => field.name === key)
  );

  return (
    <>
      <Seo
        title={`${listing.title} | ${t(`categories.${listing.category}`, {
          defaultValue: listing.category,
        })}`}
        description={listing.description.slice(0, 200)}
        path={`/listings/${listing._id}`}
        type="article"
        image={photos[0]}
        noIndex={isSold}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-neutral-500">
          <Link to="/" className="hover:underline">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <Link to={`/listings?category=${listing.category}`} className="hover:underline">
            {t(`categories.${listing.category}`, { defaultValue: listing.category })}
          </Link>
          <span>/</span>
          <span className="truncate text-neutral-700">{listing.title}</span>
        </nav>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
          <div>
            <div className="card overflow-hidden p-2 sm:p-3">
              {photos.length > 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
                  <div className="relative aspect-[4/3] sm:aspect-[16/10]">
                    <img
                      src={selectedPhoto}
                      alt={listing.title}
                      className={
                        isSold
                          ? 'h-full w-full object-cover opacity-60'
                          : 'h-full w-full object-cover transition duration-200'
                      }
                    />
                    {photos.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {selectedPhotoIndex + 1} / {photos.length}
                      </span>
                    )}
                    {isSold && (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900/85 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white">
                        {t('seller.status.SOLD')}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center text-6xl">
                  {getCategoryIcon(listing.category)}
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:gap-3">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={[
                      'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-100 sm:h-20 sm:w-20',
                      selectedPhotoIndex === index ? 'border-brand-500 shadow-sm' : 'border-neutral-200',
                    ].join(' ')}
                    aria-label={`${listing.title} photo ${index + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`${listing.title} ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {listing.video && (
              <div className="card mt-4 overflow-hidden p-2 sm:p-3">
                <video src={listing.video} controls className="w-full rounded-xl bg-black" />
              </div>
            )}
          </div>

          {/* Summary + contact rail */}
          <div>
            <div className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="chip">
                  {getCategoryIcon(listing.category)}{' '}
                  {t(`categories.${listing.category}`, { defaultValue: listing.category })}
                </span>
                <button
                  type="button"
                  onClick={toggleSave}
                  hidden={isOwner}
                  className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {saved ? `♥ ${t('listing.saved')}` : `♡ ${t('listing.save')}`}
                </button>
              </div>

              <h1 className="mt-3 text-xl font-bold leading-snug text-neutral-900 sm:text-2xl">
                {listing.title}
              </h1>

              <p className="mt-2 text-2xl font-extrabold text-brand-700">
                {formatPrice(listing.price)}
              </p>
              <p className="text-xs font-medium text-neutral-500">
                {listing.isNegotiable ? t('listing.negotiable') : t('listing.fixedPrice')}
              </p>

              <p className="mt-3 flex items-center gap-1 text-sm text-neutral-600">
                📍 {formatPublicLocation(listing)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {t('listing.views', { count: listing.views })} ·{' '}
                {t('listing.posted', { date: formatDate(listing.createdAt, i18n.language) })}
              </p>

              {isSold ? (
                <div className="mt-4 rounded-xl bg-neutral-100 p-4">
                  <p className="text-sm font-bold text-neutral-900">{t('listing.soldTitle')}</p>
                  <p className="mt-1 text-xs text-neutral-600">{t('listing.soldText')}</p>
                </div>
              ) : (
                <div className="mt-5">
                  <ContactButtons listing={listing} />
                </div>
              )}

              {reported && (
                <div className="mt-3">
                  <SuccessBanner message={t('report.success')} />
                </div>
              )}

              <button
                type="button"
                hidden={isOwner}
                onClick={() =>
                  isAuthenticated ? setReportOpen(true) : navigate('/login', { state: { from: `/listings/${id}` } })
                }
                className="btn-ghost btn-sm mt-4 w-full text-red-600"
              >
                🚩 {t('listing.report')}
              </button>
            </div>

            {/* Attribute table */}
            <div className="card mt-4 p-5">
              <h2 className="section-title">{t('listing.details')}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={t('listing.category')}>
                  {t(`categories.${listing.category}`, { defaultValue: listing.category })}
                </Row>
                {listing.breed && <Row label={t('listing.breed')}>{listing.breed}</Row>}
                {age && <Row label={t('listing.age')}>{age}</Row>}
                {listing.gender && (
                  <Row label={t('listing.gender')}>
                    {t(`listing.${listing.gender.toLowerCase()}`)}
                  </Row>
                )}
                <Row label={t('listing.location')}>{formatPublicLocation(listing)}</Row>
                {listing.vaccinationInfo && (
                  <Row label={t('listing.vaccinationInfo')}>{listing.vaccinationInfo}</Row>
                )}
                {listing.healthInfo && (
                  <Row label={t('listing.healthInfo')}>{listing.healthInfo}</Row>
                )}
              </dl>
            </div>
          </div>
        </div>



        {/* Description + dynamic category details */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="card p-4 sm:p-5">
            <h2 className="section-title">{t('listing.description')}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {listing.description}
            </p>
          </div>

          {(detailFields.length > 0 || extraKeys.length > 0) && (
            <div className="card p-4 sm:p-5">
              <h2 className="section-title">
                {t('sell.categoryDetails', {
                  category: t(`categories.${listing.category}`, { defaultValue: listing.category }),
                })}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                {detailFields.map((field) => {
                  const value = storedDetails[field.name];
                  if (value === undefined || value === null || value === '') return null;
                  return (
                    <Row key={field.name} label={getDetailFieldLabel(field.name, i18n.language)}>
                      {field.type === 'boolean'
                        ? formatBoolean(value, i18n.language)
                        : String(value)}
                    </Row>
                  );
                })}
                {extraKeys.map((key) => {
                  const value = storedDetails[key];
                  if (value === undefined || value === null || value === '') return null;
                  return (
                    <Row key={key} label={getDetailFieldLabel(key, i18n.language)}>
                      {typeof value === 'boolean'
                        ? formatBoolean(value, i18n.language)
                        : String(value)}
                    </Row>
                  );
                })}
              </dl>
            </div>
          )}
        </div>

        {/* Seller */}
        <div className="card mt-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
              {(seller?.name || seller?.phone || 'U').trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-bold text-neutral-900">
                {seller?.name || t('listing.sellerInfo')}
              </p>
              <p className="text-xs text-neutral-500">
                {t('listing.memberSince', {
                  year: formatYear(seller?.createdAt ?? listing.createdAt),
                })}
              </p>
            </div>
          </div>
          {!isSold && (
            <div className="w-full sm:w-64">
              <ContactButtons listing={listing} phone={seller?.phone} />
            </div>
          )}
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="section-title">{t('listing.similar')}</h2>
            <div className="mt-4">
              <ListingGrid listings={similar} skeletonCount={4} />
            </div>
          </section>
        )}
      </div>

      <ReportModal
        open={reportOpen}
        listingId={listing._id}
        onClose={() => setReportOpen(false)}
        onDone={() => setReported(true)}
      />
    </>
  );
}

/** Definition-list row used across the detail page. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{children}</dd>
    </div>
  );
}
