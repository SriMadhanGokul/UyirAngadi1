import { useTranslation } from 'react-i18next';
import { cx } from '../utils/format';

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/** Pager with first/last windowed page numbers, designed for small mobile screens. */
export default function Pagination({ page, pages, onChange }: PaginationProps) {
  const { t } = useTranslation();
  if (!pages || pages <= 1) return null;

  const numbers: number[] = [];
  const from = Math.max(1, Math.min(page - 1, pages - 2));
  const to = Math.min(pages, Math.max(page + 1, 3));
  for (let i = from; i <= to; i += 1) numbers.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        className="btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← {t('search.previous')}
      </button>

      {from > 1 && <span className="px-1 text-sm text-neutral-400">…</span>}

      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
          className={cx(
            'h-9 w-9 rounded-xl text-sm font-semibold transition-colors',
            n === page
              ? 'bg-brand-600 text-white'
              : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
          )}
        >
          {n}
        </button>
      ))}

      {to < pages && <span className="px-1 text-sm text-neutral-400">…</span>}

      <button
        type="button"
        className="btn-outline btn-sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        {t('search.next')} →
      </button>
    </nav>
  );
}
