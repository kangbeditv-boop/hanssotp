import { NavLink } from 'react-router-dom';
import {
  HiHome, HiUsers, HiCog, HiClipboardList,
  HiCurrencyDollar, HiAdjustments, HiViewList,
} from 'react-icons/hi';

const links = [
  { to: '/admin/dashboard', icon: HiHome, label: 'Dashboard' },
  { to: '/admin/users', icon: HiUsers, label: 'Users' },
  { to: '/admin/services', icon: HiAdjustments, label: 'Services' },
  { to: '/admin/orders', icon: HiClipboardList, label: 'Orders' },
  { to: '/admin/deposits', icon: HiCurrencyDollar, label: 'Deposits' },
  { to: '/admin/activity-logs', icon: HiViewList, label: 'Activity Logs' },
  { to: '/admin/settings', icon: HiCog, label: 'Settings' },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:block w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-4 px-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Panel</span>
      </div>
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
