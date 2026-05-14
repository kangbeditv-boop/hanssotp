import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { formatCurrency } from '../utils/format';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState('tripay');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { t } = useLanguage();

  const presets = [10000, 25000, 50000, 100000, 250000, 500000];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/deposits/create', {
        amount: parseInt(amount, 10),
        gateway,
      });
      setResult(data.data);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('deposit.title')}</h1>

      {!result ? (
        <div className="max-w-lg">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deposit.amount')}</label>
                <input
                  type="number"
                  className="input-field"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={10000}
                  max={10000000}
                  required
                  placeholder="Min. Rp10.000"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {presets.map((p) => (
                    <button key={p} type="button" onClick={() => setAmount(String(p))} className="btn-secondary text-xs py-1 px-3">
                      {formatCurrency(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deposit.gateway')}</label>
                <select className="input-field" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                  <option value="tripay">Tripay (QRIS)</option>
                  <option value="qrispy">QRISPY (QRIS)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? t('common.loading') : t('deposit.create')}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-lg">
          <div className="card text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('deposit.scan_qr')}</h2>
            {result.qr_url && (
              <img src={result.qr_url} alt="QR Code" className="mx-auto mb-4 w-64 h-64 rounded-lg" />
            )}
            <div className="space-y-2 text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Reference:</span> {result.reference}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t('deposit.amount')}:</span> {formatCurrency(result.amount)}
              </p>
              {result.fee > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Fee:</span> {formatCurrency(result.fee)}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Total:</span> {formatCurrency(result.total_amount)}
              </p>
            </div>
            {result.payment_url && (
              <a href={result.payment_url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block mt-4">
                Open Payment Page
              </a>
            )}
            <button onClick={() => setResult(null)} className="btn-secondary w-full mt-4">
              {t('deposit.create')} Lagi
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
