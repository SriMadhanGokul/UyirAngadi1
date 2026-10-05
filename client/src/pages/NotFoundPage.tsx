import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';

/** Friendly 404 rendered inside the public layout. */
export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <Seo title={t('common.notFoundTitle')} noIndex />
      <p className="flex justify-center text-6xl text-brand-600"><FiHeart /></p>
      <h1 className="page-title mt-4">{t('common.notFoundTitle')}</h1>
      <p className="mt-2 text-sm text-neutral-600">{t('common.notFoundText')}</p>
      <Link to="/" className="btn-primary mt-6">
        {t('common.goHome')}
      </Link>
    </div>
  );
}
