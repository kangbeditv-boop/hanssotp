import { Link, useNavigate } from 'react-router-dom';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  const { admin, adminLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    adminLogout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-gray-900 dark:bg-gray-950 shadow-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">ADM</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">{admin?.username}</span>
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-400 hover:bg-gray-700">
                {theme === 'dark' ? <HiSun size={20} /> : <HiMoon size={20} />}
              </button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
