import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import ListingGrid from '../components/ListingGrid';
import Pagination from '../components/Pagination';
import { categoryService, favouriteService } from '../services';
import listingService from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import type { Category, Gender, Listing, ListingFilters } from '../types';
import { DEFAULT_PAGE_SIZE, GENDERS, SORT_OPTIONS, TAMIL_NADU_DISTRICTS } from '../utils/constants';

interface FilterState {
  category: string;
  breed: string;
  district: string;
  taluk: string;
  gender: Gender | '';
  minPrice: string;
  maxPrice: string;
  minAge: string;
  maxAge: string;
  q: string;
  sort: NonNullable<ListingFilters['sort']>;
  page: number;
}

const EMPTY_FILTERS_BASE: FilterState = {
  category: '',
  breed: '',
  district: '',
  taluk: '',
  gender: '',
  minPrice: '',
  maxPrice: '',
  minAge: '',
  maxAge: '',
  q: '',
  sort: 'random',
  page: 1,
};

/** Reads filters from the URL so searches are shareable and bookmarkable. */
function fromParams(params: URLSearchParams): FilterState {
  return {
    category: params.get('category') ?? '',
    breed: params.get('breed') ?? '',
    district: params.get('district') ?? '',
    taluk: params.get('taluk') ?? '',
    gender: (params.get('gender') as Gender | null) ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minAge: params.get('minAge') ?? '',
    maxAge: params.get('maxAge') ?? '',
    q: params.get('q') ?? '',
    sort: (params.get('sort') as FilterState['sort'] | null) ?? 'random',
    page: Number(params.get('page')) || 1,
  };
}

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(() => new Set());
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => ({ ...EMPTY_FILTERS_BASE, ...fromParams(searchParams) }), [searchParams]);

  const isTamil = i18n.language?.startsWith('ta');
  const selectedCategory = categories.find((c) => c.key === filters.category);

  const applyFilters = useCallback(
    (patch: Partial<FilterState>) => {
      const next = { ...filters, page: 1, ...patch };
      const params = new URLSearchParams();
      (Object.entries(next) as Array<[string, string | number]>).forEach(([key, value]) => {
        if (value === '' || value === 0) return;
        if (key === 'page' && value === 1) return;
        if (key === 'sort' && value === 'newest') return;
        params.set(key, String(value));
      });
      setSearchParams(params, { replace: false });
    },
    [filters, setSearchParams]
  );

  useEffect(() => {
    categoryService
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedListingIds(new Set());
      return;
    }

    let cancelled = false;
    favouriteService
      .list()
      .then((items) => {
        if (!cancelled) {
          setSavedListingIds(new Set(items.map((item) => item.listing?._id).filter(Boolean)));
        }
      })
      .catch(() => {
        if (!cancelled) setSavedListingIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    listingService
      .list({
        category: filters.category || undefined,
        breed: filters.breed || undefined,
        district: filters.district || undefined,
        taluk: filters.taluk || undefined,
        gender: filters.gender || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        minAge: filters.minAge ? Number(filters.minAge) : undefined,
        maxAge: filters.maxAge ? Number(filters.maxAge) : undefined,
        q: filters.q || undefined,
        sort: filters.sort,
        page: filters.page,
        limit: DEFAULT_PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setListings(res.data);
        setMeta({ total: res.total, page: res.page, pages: res.pages });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, t]);

  const activeCount = [
    filters.category,
    filters.breed,
    filters.district,
    filters.taluk,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.minAge,
    filters.maxAge,
  ].filter(Boolean).length;

  const clearAll = () => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    setSearchParams(params);
  };

  const toggleSave = async (id: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/listings' } });
      return;
    }

    const wasSaved = savedListingIds.has(id);
    setSavedListingIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasSaved) await favouriteService.remove(id);
      else await favouriteService.add(id);
    } catch {
      setSavedListingIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Seo
        title={`${t('search.title')} — ${t('brand.name')}`}
        description={t('home.heroSubtitle')}
        path="/listings"
        noIndex={false}
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{t('search.title')}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {filters.q ? t('search.resultsFor', { count: meta.total, query: filters.q }) : t('search.results', { count: meta.total })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/sell" className="btn-accent btn-sm">
            + {t('search.addAnimal')}
          </Link>
          <Link to="/sold-history" className="btn-outline btn-sm">
            🤝 {t('search.soldHistoryTitle')}
          </Link>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            ⚙ {showFilters ? t('search.hideFilters') : t('search.showFilters')}
            {activeCount > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => applyFilters({ sort: e.target.value as FilterState['sort'] })}
            aria-label={t('search.sort')}
            className="field w-auto py-1.5 text-xs"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-5 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="field-label">{t('listing.category')}</label>
              <select
                className="field"
                value={filters.category}
                onChange={(e) => applyFilters({ category: e.target.value, breed: '' })}
              >
                <option value="">{t('search.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {isTamil ? category.nameTa : category.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">{t('listing.breed')}</label>
              <select
                className="field"
                value={filters.breed}
                disabled={!selectedCategory}
                onChange={(e) => applyFilters({ breed: e.target.value })}
              >
                <option value="">{t('search.allBreeds')}</option>
                {selectedCategory?.breeds.map((breed) => (
                  <option key={breed.key} value={breed.nameEn}>
                    {isTamil ? breed.nameTa : breed.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">{t('sell.district')}</label>
              <select
                className="field"
                value={filters.district}
                onChange={(e) => applyFilters({ district: e.target.value })}
              >
                <option value="">{t('search.allDistricts')}</option>
                {TAMIL_NADU_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">{t('search.taluk')}</label>
              <input
                className="field"
                value={filters.taluk}
                onChange={(e) => applyFilters({ taluk: e.target.value })}
                placeholder={t('search.taluk')}
              />
            </div>

            <div>
              <label className="field-label">{t('listing.gender')}</label>
              <select
                className="field"
                value={filters.gender}
                onChange={(e) => applyFilters({ gender: e.target.value as Gender | '' })}
              >
                <option value="">{t('search.anyGender')}</option>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {t(`listing.${gender.toLowerCase()}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">{t('search.minPrice')}</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="field"
                value={filters.minPrice}
                onChange={(e) => applyFilters({ minPrice: e.target.value })}
                placeholder="₹ 0"
              />
            </div>

            <div>
              <label className="field-label">{t('search.maxPrice')}</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="field"
                value={filters.maxPrice}
                onChange={(e) => applyFilters({ maxPrice: e.target.value })}
                placeholder="₹ 500000"
              />
            </div>

            <div>
              <label className="field-label">{t('search.minAge')}</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="field"
                value={filters.minAge}
                onChange={(e) => applyFilters({ minAge: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="field-label">{t('search.maxAge')}</label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="field"
                value={filters.maxAge}
                onChange={(e) => applyFilters({ maxAge: e.target.value })}
                placeholder="20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">{t('common.search')}</label>
              <input
                className="field"
                value={filters.q}
                onChange={(e) => applyFilters({ q: e.target.value })}
                placeholder={t('home.searchPlaceholder')}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" className="btn-ghost btn-sm text-red-600" onClick={clearAll}>
              {t('search.clearAll')}
            </button>
          </div>
        </div>
      )}

      <ListingGrid
        listings={listings}
        isLoading={isLoading}
        error={error}
        onRetry={() => applyFilters({})}
        savedListingIds={savedListingIds}
        onToggleSave={toggleSave}
      />

      {!isLoading && meta.pages > 1 && (
        <>
          <p className="mt-6 text-center text-sm text-neutral-500">
            {t('search.page', { page: meta.page, pages: meta.pages })}
          </p>
          <Pagination
            page={meta.page}
            pages={meta.pages}
            onChange={(page) => applyFilters({ page })}
          />
        </>
      )}
    </div>
  );
}

