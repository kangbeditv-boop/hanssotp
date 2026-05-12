import { Link } from 'react-router-dom';
import { HiBolt, HiCurrencyDollar, HiShieldCheck, HiLifebuoy, HiCodeBracket, HiArrowPath } from 'react-icons/hi2';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    { icon: HiBolt, title: t('landing.feature_fast'), desc: t('landing.feature_fast_desc'), color: 'text-yellow-500' },
    { icon: HiCurrencyDollar, title: t('landing.feature_cheap'), desc: t('landing.feature_cheap_desc'), color: 'text-green-500' },
    { icon: HiShieldCheck, title: t('landing.feature_secure'), desc: t('landing.feature_secure_desc'), color: 'text-blue-500' },
    { icon: HiLifebuoy, title: t('landing.feature_support'), desc: t('landing.feature_support_desc'), color: 'text-purple-500' },
    { icon: HiCodeBracket, title: t('landing.feature_api'), desc: t('landing.feature_api_desc'), color: 'text-orange-500' },
    { icon: HiArrowPath, title: t('landing.feature_auto'), desc: t('landing.feature_auto_desc'), color: 'text-red-500' },
  ];

  const steps = [
    { num: '1', title: t('landing.how_step1'), desc: t('landing.how_step1_desc') },
    { num: '2', title: t('landing.how_step2'), desc: t('landing.how_step2_desc') },
    { num: '3', title: t('landing.how_step3'), desc: t('landing.how_step3_desc') },
  ];

  const faqs = [
    { q: t('landing.faq_q1'), a: t('landing.faq_a1') },
    { q: t('landing.faq_q2'), a: t('landing.faq_a2') },
    { q: t('landing.faq_q3'), a: t('landing.faq_a3') },
    { q: t('landing.faq_q4'), a: t('landing.faq_a4') },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          {t('landing.hero_title')}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          {t('landing.hero_subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            {t('landing.cta_register')}
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-3">
            {t('landing.cta_login')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" id="features">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('landing.features_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="card text-center hover:shadow-lg transition-shadow">
              <f.icon className={`mx-auto mb-4 ${f.color}`} size={48} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white dark:bg-gray-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('landing.how_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">{step.num}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" id="faq">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t('landing.faq_title')}
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="card group">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                {faq.q}
                <span className="text-primary-600 group-open:rotate-180 transition-transform">&#9660;</span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="card bg-primary-600 border-primary-600 text-white max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">{t('landing.cta_register')}</h2>
          <p className="text-primary-100 mb-6">{t('landing.hero_subtitle')}</p>
          <Link to="/register" className="inline-block bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            {t('landing.cta_register')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} OTP Service. All rights reserved.
      </footer>
    </Layout>
  );
}
