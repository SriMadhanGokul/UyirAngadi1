import { useTranslation } from 'react-i18next';
import { FiFlag, FiGrid, FiList, FiTag, FiUsers } from 'react-icons/fi';
import DashboardLayout, { type NavItem } from '../layouts/DashboardLayout';

const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin', labelKey: 'admin.dashboard', icon: <FiGrid />, end: true },
  { to: '/admin/users', labelKey: 'admin.users', icon: <FiUsers /> },
  { to: '/admin/listings', labelKey: 'admin.listings', icon: <FiList /> },
  { to: '/admin/reports', labelKey: 'admin.reports', icon: <FiFlag /> },
  { to: '/admin/categories', labelKey: 'admin.categories', icon: <FiTag /> },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { t } = useTranslation();

  return (
    <DashboardLayout items={ADMIN_NAV_ITEMS} title={title || t('admin.dashboard')}>
      {children}
    </DashboardLayout>
  );
}
