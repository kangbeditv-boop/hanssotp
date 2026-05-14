import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t, lang, changeLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/api/user/profile', { phone, language: lang, theme });
      updateUser({ phone, language: lang, theme });
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
    setSaving(false);
  }

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('nav.profile')}</h1>

      <div className="max-w-lg space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t('auth.username')}</label>
              <p className="input-field bg-gray-50 dark:bg-gray-700">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t('auth.email')}</label>
              <p className="input-field bg-gray-50 dark:bg-gray-700">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t('auth.phone')}</label>
              <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Language</label>
              <select className="input-field" value={lang} onChange={(e) => changeLang(e.target.value)}>
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Theme</label>
              <select className="input-field" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </Layout>
  );
}
