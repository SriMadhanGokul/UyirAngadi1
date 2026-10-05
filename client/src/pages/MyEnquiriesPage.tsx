import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiMessageSquare } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Seo from '../components/Seo';
import { EmptyState } from '../components/Feedback';
import { enquiryService } from '../services';
import type { Enquiry } from '../types';
import { formatPrice, timeAgo } from '../utils/format';
import { PROFILE_NAV_ITEMS } from './ProfilePage';

/** Buyer-side: enquiries I raised through Call / WhatsApp buttons. */
export default function MyEnquiriesPage() {
  const { t, i18n } = useTranslation();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    enquiryService
      .my()
      .then((res) => !cancelled && setEnquiries(res))
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.error'));
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout items={PROFILE_NAV_ITEMS} title={t('buyer.myEnquiries')}>
      <Seo title={t('buyer.myEnquiries')} path="/enquiries" noIndex />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-neutral-500">{t('common.loading')}</p>
      ) : enquiries.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={<FiMessageSquare />}
            title={t('buyer.myEnquiries')}
            description={t('buyer.noEnquiries')}
            actionLabel={t('buyer.browse')}
          />
        </div>
      ) : (
        <ul className="card divide-y divide-neutral-100 overflow-hidden">
          {enquiries.map((enquiry) => (
            <li key={enquiry._id} className="flex gap-3 px-4 py-3 sm:px-5">
              <Link
                to={`/listings/${enquiry.listing._id}`}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
              >
                {enquiry.listing.photos?.[0] ? (
                  <img src={enquiry.listing.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-2xl text-brand-600"><FiHeart /></span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/listings/${enquiry.listing._id}`}
                  className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {enquiry.listing.title}
                </Link>
                <p className="text-sm font-bold text-brand-700">
                  {formatPrice(enquiry.listing.price)}
                </p>
                <p className="text-xs text-neutral-500">
                  {t('buyer.via', { method: enquiry.contactMethod, defaultValue: enquiry.contactMethod })}
                  {' · '}
                  {t('buyer.contactedOn', { date: timeAgo(enquiry.createdAt, i18n.language), defaultValue: timeAgo(enquiry.createdAt, i18n.language) })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}

