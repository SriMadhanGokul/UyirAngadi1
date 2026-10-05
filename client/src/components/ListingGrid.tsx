import { useTranslation } from 'react-i18next';
import type { Listing } from '../types';
import ListingCard from './ListingCard';
import { EmptyState, ErrorState, ListingGridSkeleton } from './Feedback';

interface ListingGridProps {
  listings?: Listing[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showStatus?: boolean;
  savedListingIds?: ReadonlySet<string>;
  onToggleSave?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  skeletonCount?: number;
}

/** Responsive card grid with loading / error / empty handling built in. */
export default function ListingGrid({
  listings,
  isLoading,
  error,
  onRetry,
  showStatus,
  savedListingIds,
  onToggleSave,
  emptyTitle,
  emptyDescription,
  emptyIcon = null,
  emptyActionLabel,
  onEmptyAction,
  skeletonCount = 8,
}: ListingGridProps) {
  const { t } = useTranslation();

  if (isLoading) return <ListingGridSkeleton count={skeletonCount} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? t('search.noResults')}
        description={emptyDescription ?? t('search.noResultsText')}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing._id}
          listing={listing}
          showStatus={showStatus}
          isSaved={savedListingIds?.has(listing._id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
