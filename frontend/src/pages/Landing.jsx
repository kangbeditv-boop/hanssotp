import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  HiBolt, HiCurrencyDollar, HiShieldCheck, HiLifebuoy,
  HiCodeBracket, HiArrowPath, HiGlobeAlt, HiDevicePhoneMobile,
  HiCheckCircle, HiArrowRight, HiStar, HiChevronLeft, HiChevronRight,
} from 'react-icons/hi2';
import { useLanguage } from '../contexts/LanguageContext';

function AnimatedCounter({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString('id-ID')}{suffix}</span>;
}

function OtpDemoAnimation() {
  const [step, setStep] = useState(0);
  const otpCode = '482916';

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
      setTimeout(() => setStep(4), 5500),
      setTimeout(() => setStep(0), 8000),
    ];
    const loop = setInterval(() => {
      setStep(0);
      setTimeout(() => setStep(1), 1000);
      setTimeout(() => setStep(2), 2500);
      setTimeout(() => setStep(3), 4000);
      setTimeout(() => setStep(4), 5500);
    }, 8000);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="relative w-64 sm:w-72 mx-auto">
      <div className="bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {step >= 1 && (
              <motion.div
                key="service"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-green-400">&#10003;</span>
                <span className="text-gray-300">WhatsApp selected</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step >= 2 && (
              <motion.div
                key="number"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl p-3"
              >
                <p className="text-xs text-gray-400 mb-1">Virtual Number</p>
                <p className="text-lg font-mono text-neon-blue">+62 812-XXXX-3847</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step >= 3 && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400">Waiting for OTP...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step >= 4 && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-3"
              >
                <p className="text-xs text-green-400 mb-1">OTP Received</p>
                <p className="text-3xl font-mono font-bold text-green-400 tracking-widest">{otpCode}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LiveOrderTicker() {
  const orders = [
    { service: 'WhatsApp', country: 'Indonesia', flag: '\ud83c\uddee\ud83c\udde9', time: '2 detik lalu' },
    { service: 'Telegram', country: 'Russia', flag: '\ud83c\uddf7\ud83c\uddfa', time: '5 detik lalu' },
    { service: 'Gmail', country: 'USA', flag: '\ud83c\uddfa\ud83c\uddf8', time: '8 detik lalu' },
    { service: 'TikTok', country: 'India', flag: '\ud83c\uddee\ud83c\uddf3', time: '12 detik lalu' },
    { service: 'WhatsApp', country: 'Brazil', flag: '\ud83c\udde7\ud83c\uddf7', time: '15 detik lalu' },
    { service: 'Discord', country: 'UK', flag: '\ud83c\uddec\ud83c\udde7', time: '18 detik lalu' },
    { service: 'LINE', country: 'Japan', flag: '\ud83c\uddef\ud83c\uddf5', time: '22 detik lalu' },
    { service: 'Gojek', country: 'Indonesia', flag: '\ud83c\uddee\ud83c\udde9', time: '25 detik lalu' },
  ];

  return (
    <div className="ticker-container py-3">
      <div className="ticker-content gap-6">
        {[...orders, ...orders].map((order, i) => (
          <div key={i} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm whitespace-nowrap">
            <span className="text-green-400">&#9679;</span>
            <span>{order.flag}</span>
            <span className="text-white font-medium">{order.service}</span>
            <span className="text-gray-400">- {order.country}</span>
            <span className="text-gray-500 text-xs">{order.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialSlider({ testimonials }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="card-glass text-center"
        >
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <HiStar key={i} className="text-yellow-400" size={20} />
            ))}
          </div>
          <p className="text-gray-200 text-lg mb-4 italic">&ldquo;{testimonials[current].text}&rdquo;</p>
          <p className="text-white font-semibold">{testimonials[current].name}</p>
          <p className="text-gray-400 text-sm">{testimonials[current].role}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <HiChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-neon-blue w-6' : 'bg-white/30'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <HiChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  const { t } = useLanguage();

  const features = [
    { icon: HiBolt, title: t('landing.feature_fast'), desc: t('landing.feature_fast_desc'), gradient: 'from-yellow-500 to-orange-500' },
    { icon: HiCurrencyDollar, title: t('landing.feature_cheap'), desc: t('landing.feature_cheap_desc'), gradient: 'from-green-500 to-emerald-500' },
    { icon: HiShieldCheck, title: t('landing.feature_secure'), desc: t('landing.feature_secure_desc'), gradient: 'from-blue-500 to-cyan-500' },
    { icon: HiLifebuoy, title: t('landing.feature_support'), desc: t('landing.feature_support_desc'), gradient: 'from-purple-500 to-pink-500' },
    { icon: HiCodeBracket, title: t('landing.feature_api'), desc: t('landing.feature_api_desc'), gradient: 'from-orange-500 to-red-500' },
    { icon: HiArrowPath, title: t('landing.feature_auto'), desc: t('landing.feature_auto_desc'), gradient: 'from-red-500 to-rose-500' },
    { icon: HiGlobeAlt, title: t('landing.feature_multi_country'), desc: t('landing.feature_multi_country_desc'), gradient: 'from-teal-500 to-cyan-500' },
    { icon: HiDevicePhoneMobile, title: t('landing.feature_mobile'), desc: t('landing.feature_mobile_desc'), gradient: 'from-indigo-500 to-purple-500' },
  ];

  const steps = [
    { num: '1', title: t('landing.how_step1'), desc: t('landing.how_step1_desc'), icon: '\ud83d\udcb3' },
    { num: '2', title: t('landing.how_step2'), desc: t('landing.how_step2_desc'), icon: '\ud83c\udf10' },
    { num: '3', title: t('landing.how_step3'), desc: t('landing.how_step3_desc'), icon: '\ud83d\udcf1' },
  ];

  const testimonials = [
    { name: 'Andi Pratama', role: 'Reseller OTP', text: t('landing.testimonial_1') },
    { name: 'Siti Rahmawati', role: 'Online Shop Owner', text: t('landing.testimonial_2') },
    { name: 'Budi Santoso', role: 'Developer', text: t('landing.testimonial_3') },
    { name: 'Dewi Lestari', role: 'Digital Marketer', text: t('landing.testimonial_4') },
  ];

  const stats = [
    { value: 150, suffix: '+', label: t('landing.stat_services') },
    { value: 50, suffix: '+', label: t('landing.stat_countries') },
    { value: 25000, suffix: '+', label: t('landing.stat_users') },
    { value: 500000, suffix: '+', label: t('landing.stat_transactions') },
  ];

  const faqs = [
    { q: t('landing.faq_q1'), a: t('landing.faq_a1') },
    { q: t('landing.faq_q2'), a: t('landing.faq_a2') },
    { q: t('landing.faq_q3'), a: t('landing.faq_a3') },
    { q: t('landing.faq_q4'), a: t('landing.faq_a4') },
  ];

  const trustIndicators = [
    { label: t('landing.trust_uptime'), value: '99.9%' },
    { label: t('landing.trust_today'), value: '2,847' },
    { label: t('landing.trust_success'), value: '98.5%' },
  ];

  return (
    <div className="min-h-screen">
      {/* Navbar for landing */}
      <nav className="fixed top-0 w-full z-50 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-neon-blue rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-sm">OTP</span>
              </div>
              <span className="text-xl font-bold text-white">NusaOTP</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors px-4 py-2 text-sm font-medium">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn-gradient text-sm !py-2 !px-6">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-hero-gradient overflow-hidden pt-16">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-300 text-sm">{t('landing.badge_live')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {t('landing.hero_title_1')}
                <span className="text-gradient block">{t('landing.hero_title_2')}</span>
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                {t('landing.hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link to="/register" className="btn-gradient text-center text-lg flex items-center justify-center gap-2">
                  {t('landing.cta_register')} <HiArrowRight />
                </Link>
                <Link to="#pricing" className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-xl transition-all border border-white/20 text-center text-lg">
                  {t('landing.cta_pricing')}
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6">
                {trustIndicators.map((item, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <OtpDemoAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Order Ticker */}
      <div className="bg-navy-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <LiveOrderTicker />
        </div>
      </div>

      {/* Live Statistics */}
      <section className="bg-navy-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center card-glass-dark">
                <p className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-hero-gradient py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.features_title')}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t('landing.features_subtitle')}</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card-glass group hover:bg-white/15 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.how_title')}</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="text-center relative">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                  <span className="text-xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] border-t-2 border-dashed border-white/10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-hero-gradient py-20" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.pricing_title')}</h2>
            <p className="text-gray-400">{t('landing.pricing_subtitle')}</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { name: 'WhatsApp', price: 'Rp2.000', icon: '\ud83d\udcac', badge: 'HOT' },
              { name: 'Telegram', price: 'Rp1.200', icon: '\u2708\ufe0f', badge: 'FAST' },
              { name: 'Gmail', price: 'Rp900', icon: '\ud83d\udce7', badge: null },
              { name: 'TikTok', price: 'Rp1.500', icon: '\ud83c\udfa5', badge: 'HOT' },
            ].map((svc, i) => (
              <motion.div key={i} variants={fadeUp} className="card-glass text-center hover:bg-white/15 transition-all group">
                <div className="text-4xl mb-3">{svc.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">{svc.name}</h3>
                <p className="text-2xl font-bold text-gradient mb-2">{svc.price}</p>
                {svc.badge && (
                  <span className={svc.badge === 'HOT' ? 'badge-hot' : 'badge-fast'}>{svc.badge}</span>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8">
            <Link to="/register" className="btn-gradient inline-flex items-center gap-2">
              {t('landing.cta_see_all')} <HiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-navy-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.testimonials_title')}</h2>
          </motion.div>

          <TestimonialSlider testimonials={testimonials} />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-hero-gradient py-20" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.faq_title')}</h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-glass group"
              >
                <summary className="cursor-pointer font-semibold text-white flex justify-between items-center">
                  {faq.q}
                  <span className="text-neon-blue group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="mt-4 text-gray-400">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <div className="card-glass max-w-2xl mx-auto bg-gradient-to-r from-primary-600/20 to-neon-blue/20">
              <h2 className="text-3xl font-bold text-white mb-4">{t('landing.cta_final_title')}</h2>
              <p className="text-gray-300 mb-8">{t('landing.cta_final_desc')}</p>
              <Link to="/register" className="btn-gradient inline-flex items-center gap-2 text-lg">
                {t('landing.cta_register')} <HiArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-neon-blue rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OTP</span>
                </div>
                <span className="text-xl font-bold text-white">NusaOTP</span>
              </div>
              <p className="text-gray-400 text-sm">{t('landing.footer_desc')}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">{t('landing.footer_product')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer_order_otp')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer_pricing')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">API Reseller</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">{t('landing.footer_company')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer_features')}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">{t('landing.footer_support')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://t.me/" className="hover:text-white transition-colors">Telegram</a></li>
                <li><a href="https://wa.me/" className="hover:text-white transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} NusaOTP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
