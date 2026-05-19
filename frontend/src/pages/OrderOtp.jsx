import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiPhone, HiClipboard, HiRefresh, HiX, HiSearch } from 'react-icons/hi';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocketEvent } from '../hooks/useSocket';
import Layout from '../components/Layout';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatCountdown, getStatusBadgeClass } from '../utils/format';

function StockIndicator({ stock }) {
  if (stock === undefined || stock === null) return null;
  const level = stock > 500 ? 'high' : stock > 100 ? 'medium' : 'low';
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span className={`w-2 h-2 rounded-full ${colors[level]}`} />
      {stock.toLocaleString()}
    </span>
  );
}

function SuccessRateBadge({ rate }) {
  if (rate === undefined || rate === null) return null;
  const pct = Number(rate);
  const color = pct >= 90 ? 'text-green-500' : pct >= 70 ? 'text-yellow-500' : 'text-red-500';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {pct}%
    </span>
  );
}

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
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
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

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

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
                    {t('otp.order_again')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Country Selection */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('otp.select_country')}</label>
              <div className="relative mb-3">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  className="input-field !pl-9 text-sm"
                  placeholder={t('otp.search_country')}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredCountries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCountry(String(c.id)); setSelectedService(''); setPricing([]); setServiceSearch(''); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      String(c.id) === selectedCountry
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{c.flag_emoji}</span>
                      <span>{c.name}</span>
                    </span>
                    {c.stock !== undefined && <StockIndicator stock={c.stock} />}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-3">{t('common.no_data')}</p>
                )}
              </div>
            </div>

            {/* Service Selection */}
            {selectedCountry && (
              <div className="card">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('otp.select_service')}</label>
                <div className="relative mb-3">
                  <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    className="input-field !pl-9 text-sm"
                    placeholder={t('otp.search_service')}
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredServices.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(String(s.id))}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                        String(s.id) === selectedService
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{s.name}</span>
                      <div className="flex items-center gap-2">
                        {s.success_rate !== undefined && <SuccessRateBadge rate={s.success_rate} />}
                        {s.stock !== undefined && <StockIndicator stock={s.stock} />}
                      </div>
                    </button>
                  ))}
                  {filteredServices.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3">{t('common.no_data')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <CardSkeleton count={4} />
            ) : pricing.length > 0 ? (
              <div className="space-y-3">
                {pricing.map((p) => (
                  <div key={p.id} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {p.service_name} - {p.country_name} {p.flag_emoji}
                        </p>
                        {p.is_popular && <span className="badge-hot text-xs">HOT</span>}
                        {p.is_fast && <span className="badge-fast text-xs">FAST</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-500">
                          {p.operator_name || 'Any Operator'} &middot; {p.provider_name}
                        </p>
                        {p.success_rate !== undefined && (
                          <span className="text-xs text-gray-400">
                            {t('otp.success_rate')}: <SuccessRateBadge rate={p.success_rate} />
                          </span>
                        )}
                        {p.stock !== undefined && (
                          <span className="text-xs text-gray-400">
                            {t('otp.stock')}: <StockIndicator stock={p.stock} />
                          </span>
                        )}
                      </div>
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
                <HiPhone className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={48} />
                <p>{t('otp.select_country')} & {t('otp.select_service')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
