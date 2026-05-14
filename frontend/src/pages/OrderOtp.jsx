import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiPhone, HiClipboard, HiRefresh, HiX } from 'react-icons/hi';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocketEvent } from '../hooks/useSocket';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatCountdown, getStatusBadgeClass } from '../utils/format';

export default function OrderOtp() {
  const [countries, setCountries] = useState([]);
  const [services, setServices] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [countdown, setCountdown] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) fetchServices();
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedService) fetchPricing();
  }, [selectedCountry, selectedService]);

  useEffect(() => {
    if (!activeOrder?.expires_at) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(activeOrder.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  const handleOtpReceived = useCallback((data) => {
    if (activeOrder && data.order_id === activeOrder.order_id) {
      setActiveOrder((prev) => ({ ...prev, otp_code: data.otp_code, status: 'received' }));
      toast.success(`OTP: ${data.otp_code}`);
    }
  }, [activeOrder]);

  useSocketEvent('otp:received', handleOtpReceived);

  async function fetchCountries() {
    try {
      const { data } = await api.get('/api/otp/countries');
      setCountries(data.data);
    } catch { /* ignore */ }
  }

  async function fetchServices() {
    try {
      const { data } = await api.get(`/api/otp/services?country_id=${selectedCountry}`);
      setServices(data.data);
    } catch { /* ignore */ }
  }

  async function fetchPricing() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/otp/pricing?country_id=${selectedCountry}&service_id=${selectedService}`);
      setPricing(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleOrder(pricingItem) {
    setOrdering(true);
    try {
      const { data } = await api.post('/api/otp/order', {
        country_id: parseInt(selectedCountry, 10),
        service_id: parseInt(selectedService, 10),
        operator_id: pricingItem.operator_id || undefined,
        provider_id: pricingItem.provider_id,
      });
      setActiveOrder(data.data);
      toast.success(t('common.success'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
    setOrdering(false);
  }

  async function handleCancel() {
    if (!activeOrder) return;
    try {
      await api.post(`/api/otp/order/${activeOrder.order_id}/cancel`);
      setActiveOrder(null);
      toast.success('Order dibatalkan');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
  }

  async function handleResend() {
    if (!activeOrder) return;
    try {
      const { data } = await api.post(`/api/otp/order/${activeOrder.order_id}/resend`);
      toast.success(data.message || 'Resend requested');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copy_success'));
  }

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('otp.title')}</h1>

      {activeOrder ? (
        <div className="max-w-lg mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <span className={`text-lg font-semibold ${getStatusBadgeClass(activeOrder.status)} px-4 py-2`}>
                {activeOrder.status === 'waiting_otp' ? t('otp.waiting') : t('otp.received')}
              </span>
              {activeOrder.status === 'waiting_otp' && (
                <p className="text-sm text-gray-500 mt-2">{t('otp.expires')}: {countdown}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">{t('otp.phone')}</p>
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{activeOrder.phone_number || '-'}</p>
                </div>
                {activeOrder.phone_number && (
                  <button onClick={() => copyToClipboard(activeOrder.phone_number)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                    <HiClipboard size={20} className="text-gray-500" />
                  </button>
                )}
              </div>

              {activeOrder.otp_code && (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
                  <div>
                    <p className="text-xs text-green-600">{t('otp.otp_code')}</p>
                    <p className="text-3xl font-mono font-bold text-green-700 dark:text-green-400">{activeOrder.otp_code}</p>
                  </div>
                  <button onClick={() => copyToClipboard(activeOrder.otp_code)} className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg">
                    <HiClipboard size={24} className="text-green-600" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {activeOrder.status === 'waiting_otp' && (
                  <>
                    <button onClick={handleResend} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <HiRefresh size={18} /> {t('otp.resend')}
                    </button>
                    <button onClick={handleCancel} className="btn-danger flex-1 flex items-center justify-center gap-2">
                      <HiX size={18} /> {t('otp.cancel')}
                    </button>
                  </>
                )}
                {activeOrder.status === 'received' && (
                  <button onClick={() => setActiveOrder(null)} className="btn-primary w-full">
                    Order Lagi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('otp.select_country')}</label>
              <select className="input-field" value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedService(''); setPricing([]); }}>
                <option value="">{t('otp.select_country')}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                ))}
              </select>
            </div>

            {selectedCountry && (
              <div className="card">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('otp.select_service')}</label>
                <select className="input-field" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                  <option value="">{t('otp.select_service')}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <LoadingSpinner />
            ) : pricing.length > 0 ? (
              <div className="space-y-3">
                {pricing.map((p) => (
                  <div key={p.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {p.service_name} - {p.country_name} {p.flag_emoji}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.operator_name || 'Any Operator'} &middot; {p.provider_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-primary-600">{formatCurrency(p.sell_price)}</span>
                      <button onClick={() => handleOrder(p)} disabled={ordering} className="btn-primary text-sm py-2">
                        {ordering ? '...' : t('otp.order_btn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedService ? (
              <div className="card text-center text-gray-500">{t('otp.no_service')}</div>
            ) : (
              <div className="card text-center text-gray-500">
                {t('otp.select_country')} & {t('otp.select_service')}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
