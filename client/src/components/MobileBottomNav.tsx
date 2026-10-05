import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiHeart, FiHome, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';

const items = [
  { to: '/listings', labelKey: 'nav.home', icon: <FiHome />, end: true },
  { to: '/favourites', labelKey: 'nav.favourites', icon: <FiHeart /> },
  { to: '/dashboard', labelKey: 'seller.dashboard', icon: <FiBarChart2 /> },
  { to: '/profile', labelKey: 'profile.title', icon: <FiUser /> },
];

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { isAdmin, isAuthenticated } = useAuth();

  if (isAdmin) return null;
  const visibleItems = isAuthenticated ? items : items.slice(0, 2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 py-1.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium',
                isActive ? 'text-brand-700' : 'text-neutral-500'
              )
            }
          >
            <span className="flex h-5 w-5 items-center justify-center text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}