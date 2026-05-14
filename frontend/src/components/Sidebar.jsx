import { NavLink } from 'react-router-dom';
import {
  HiHome, HiCurrencyDollar, HiPhone, HiClipboardList,
  HiSwitchHorizontal, HiUserGroup, HiCode, HiCog, HiUser,
} from 'react-icons/hi';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sidebar() {
  const { t } = useLanguage();

  const links = [
    { to: '/dashboard', icon: HiHome, label: t('nav.dashboard') },
    { to: '/deposit', icon: HiCurrencyDollar, label: t('nav.deposit') },
    { to: '/order', icon: HiPhone, label: t('nav.order') },
    { to: '/orders', icon: HiClipboardList, label: t('nav.history') },
    { to: '/transactions', icon: HiSwitchHorizontal, label: t('nav.transactions') },
    { to: '/affiliate', icon: HiUserGroup, label: t('nav.affiliate') },
    { to: '/reseller-api', icon: HiCode, label: t('nav.api') },
    { to: '/profile', icon: HiUser, label: t('nav.profile') },
  ];

  return (
    <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
