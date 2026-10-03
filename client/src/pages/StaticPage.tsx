import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';

/**
 * About / Terms / Privacy / Safety pages driven by one route.
 * Bodies come from `static.*` so both languages are covered for free.
 */
export default function StaticPage({ page }: { page: 'about' | 'terms' | 'privacy' | 'safety' }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Seo title={t(`static.${page}Title`)} path={`/${page}`} />
      <div className="card p-6 sm:p-8">
        <h1 className="page-title">{t(`static.${page}Title`)}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {t(`static.${page}Body`)}
        </p>
      </div>
    </div>
  );
}
