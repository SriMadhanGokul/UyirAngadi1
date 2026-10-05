import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHeart } from 'react-icons/fi';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <FiHeart />
              </span>
              <span className="text-base font-extrabold text-brand-700">{t('brand.name')}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('footer.disclaimer')}</p>
            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {t('footer.language')}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-neutral-900">{t('nav.search')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              {[
                'cow',
                'bull',
                'buffalo',
                'goat',
                'sheep',
                'chicken',
                'rooster',
                'dog',
                'cat',
                'rabbit',
                'pigeon',
                'lovebird',
                'otherbirds',
                'otheranimals',
              ].map((key) => (
                <li key={key}>
                  <Link
                    to={`/listings?category=${key}`}
                    className="hover:text-brand-700 hover:underline"
                  >
                    {t(`categories.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-neutral-900">{t('footer.about')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <Link to="/about" className="hover:text-brand-700 hover:underline">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-brand-700 hover:underline">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-brand-700 hover:underline">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-brand-700 hover:underline">
                  {t('footer.safety')}
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-brand-700 hover:underline">
                  {t('footer.forSellers')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-neutral-900">{t('footer.safety')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('home.ctaTrustText')}</p>
            <Link to="/safety" className="btn-outline btn-sm mt-4">
              {t('footer.safety')}
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.rights', { year })}</p>
          <p>{t('footer.madeIn')}</p>
        </div>
      </div>
    </footer>
  );
}
