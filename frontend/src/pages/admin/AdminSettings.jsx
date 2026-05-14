import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const { data } = await adminApi.get('/api/admin/settings');
      setSettings(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function updateSetting(key, value) {
    setSettings((prev) =>
      prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value } : s))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.put('/api/admin/settings/bulk', {
        settings: settings.map((s) => ({ setting_key: s.setting_key, setting_value: s.setting_value })),
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
    setSaving(false);
  }

  const groups = {
    'Website': ['site_name', 'site_logo', 'site_description', 'default_theme', 'default_language'],
    'API Keys - Payment': ['tripay_api_key', 'tripay_private_key', 'tripay_merchant_code', 'tripay_mode', 'qrispy_api_key', 'qrispy_merchant_id', 'pakasir_project', 'pakasir_net_key', 'pakasir_mode'],
    'API Keys - OTP Provider': ['fivesim_api_key', 'herosms_api_key', 'nokosmurah_api_key'],
    'Telegram': ['telegram_bot_token', 'telegram_admin_chat_id'],
    'Auto Pricing': ['auto_pricing_enabled', 'demand_threshold', 'demand_markup_increment'],
    'Limits': ['max_active_orders_default', 'max_orders_per_minute_default', 'otp_expiry_minutes'],
    'Affiliate': ['affiliate_deposit_rate', 'affiliate_order_rate'],
  };

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([groupName, keys]) => (
          <div key={groupName} className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{groupName}</h2>
            <div className="space-y-3">
              {keys.map((key) => {
                const setting = settings.find((s) => s.setting_key === key);
                if (!setting) return null;
                return (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {setting.description || setting.setting_key}
                    </label>
                    <div className="sm:col-span-2">
                      {setting.setting_type === 'boolean' ? (
                        <select
                          className="input-field"
                          value={setting.setting_value}
                          onChange={(e) => updateSetting(key, e.target.value)}
                        >
                          <option value="0">Disabled</option>
                          <option value="1">Enabled</option>
                        </select>
                      ) : key.includes('key') || key.includes('token') || key.includes('private') ? (
                        <input
                          type="password"
                          className="input-field"
                          value={setting.setting_value}
                          onChange={(e) => updateSetting(key, e.target.value)}
                          placeholder={setting.description}
                        />
                      ) : (
                        <input
                          type={setting.setting_type === 'number' ? 'number' : 'text'}
                          className="input-field"
                          value={setting.setting_value}
                          onChange={(e) => updateSetting(key, e.target.value)}
                          placeholder={setting.description}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
