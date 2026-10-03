import { useTranslation } from 'react-i18next';
import type { ListingStatus, ReportStatus } from '../types';
import { cx } from '../utils/format';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-brand-50 text-brand-800 ring-brand-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  SOLD: 'bg-neutral-900 text-white ring-neutral-900',
  OPEN: 'bg-red-50 text-red-700 ring-red-200',
  IN_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200',
  RESOLVED: 'bg-brand-50 text-brand-800 ring-brand-200',
};

interface StatusBadgeProps {
  status: ListingStatus | ReportStatus;
  className?: string;
}

/** Coloured pill for a listing or report status. */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const label =
    status === 'OPEN'
      ? t('admin.open')
      : status === 'IN_REVIEW'
        ? t('admin.inReview')
        : status === 'RESOLVED'
          ? t('admin.resolved')
          : t(`seller.status.${status}`, { defaultValue: status });

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
        className
      )}
    >
      {label}
    </span>
  );
}
