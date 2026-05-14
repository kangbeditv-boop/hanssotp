import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { HiMenu, HiX, HiSun, HiMoon, HiGlobeAlt } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../utils/format';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, changeLang } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OTP</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">OTP Service</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">{t('nav.dashboard')}</Link>
                <Link to="/deposit" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">{t('nav.deposit')}</Link>
                <Link to="/order" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">{t('nav.order')}</Link>
                <Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">{t('nav.history')}</Link>
                <span className="text-primary-600 font-semibold">{formatCurrency(user.balance)}</span>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
              </>
            )}

            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              {theme === 'dark' ? <HiSun size={20} /> : <HiMoon size={20} />}
            </button>

            <button onClick={() => changeLang(lang === 'id' ? 'en' : 'id')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 text-sm">
              <HiGlobeAlt size={18} />
              {lang.toUpperCase()}
            </button>

            {user && (
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-red-600 text-sm">
                {t('nav.logout')}
              </button>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiX size={24} className="text-gray-600 dark:text-gray-300" /> : <HiMenu size={24} className="text-gray-600 dark:text-gray-300" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {user ? (
              <>
                <p className="px-2 text-primary-600 font-semibold">{formatCurrency(user.balance)}</p>
                <Link to="/dashboard" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>
                <Link to="/deposit" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.deposit')}</Link>
                <Link to="/order" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.order')}</Link>
                <Link to="/orders" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.history')}</Link>
                <Link to="/transactions" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.transactions')}</Link>
                <Link to="/affiliate" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.affiliate')}</Link>
                <Link to="/reseller-api" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.api')}</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block px-2 py-2 text-red-600">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-2 py-2 text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="block px-2 py-2 text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>{t('nav.register')}</Link>
              </>
            )}
            <div className="flex items-center gap-2 px-2 pt-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <HiSun size={20} /> : <HiMoon size={20} />}
              </button>
              <button onClick={() => changeLang(lang === 'id' ? 'en' : 'id')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                {lang === 'id' ? 'EN' : 'ID'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
