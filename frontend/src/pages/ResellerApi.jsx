import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiClipboard, HiEye, HiEyeOff } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

export default function ResellerApi() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showKey, setShowKey] = useState(false);

  const apiEndpoints = [
    { method: 'GET', endpoint: '/api/reseller/balance', desc: 'Cek saldo akun' },
    { method: 'GET', endpoint: '/api/reseller/services', desc: 'List layanan OTP yang tersedia' },
    { method: 'POST', endpoint: '/api/reseller/order', desc: 'Buat order OTP baru' },
    { method: 'GET', endpoint: '/api/reseller/order/:id', desc: 'Cek status order & OTP' },
    { method: 'POST', endpoint: '/api/reseller/order/:id/cancel', desc: 'Batalkan order' },
  ];

  function copyApiKey() {
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      toast.success(t('common.copy_success'));
    }
  }

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('reseller.title')}</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reseller.api_key')}</h2>
        <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-200 break-all">
            {showKey ? user?.api_key : '•'.repeat(32)}
          </code>
          <button onClick={() => setShowKey(!showKey)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
            {showKey ? <HiEyeOff size={18} /> : <HiEye size={18} />}
          </button>
          <button onClick={copyApiKey} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
            <HiClipboard size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Header: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">X-API-Key: YOUR_API_KEY</code></p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reseller.docs')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('reseller.method')}</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('reseller.endpoint')}</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('reseller.description')}</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((ep, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-2">
                    <span className={`badge ${ep.method === 'GET' ? 'badge-success' : 'badge-warning'}`}>{ep.method}</span>
                  </td>
                  <td className="py-3 px-2 font-mono text-sm text-gray-900 dark:text-gray-200">{ep.endpoint}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contoh Request</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Cek Saldo</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`curl -H "X-API-Key: YOUR_API_KEY" \\
  https://yourdomain.com/api/reseller/balance`}
            </pre>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Order OTP</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"country_id": 1, "service_id": 1}' \\
  https://yourdomain.com/api/reseller/order`}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
}
