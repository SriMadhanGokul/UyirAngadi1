import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES } from '../i18n';
import type { LanguageCode } from '../i18n';
import { cx } from '../utils/format';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSwitcher({ compact = false, className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  return (
    <div
      role="group"
      aria-label={compact ? 'Language' : undefined}
      className={cx('inline-flex rounded-full border border-neutral-300 bg-white p-0.5', className)}
    >
      {LANGUAGES.map((lang) => {
        const active = i18n.language?.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => void changeLanguage(lang.code as LanguageCode)}
            aria-pressed={active}
            className={cx(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              active ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            {compact ? lang.short : lang.label}
          </button>
        );
      })}
    </div>
  );
}
