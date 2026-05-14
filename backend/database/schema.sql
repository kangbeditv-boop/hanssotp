-- OTP Service Database Schema
-- MySQL 8.0+

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS otp_service
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE otp_service;

-- =====================
-- USERS
-- =====================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_deposit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_order INT UNSIGNED NOT NULL DEFAULT 0,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  referred_by INT UNSIGNED DEFAULT NULL,
  api_key VARCHAR(64) DEFAULT NULL UNIQUE,
  is_banned TINYINT(1) NOT NULL DEFAULT 0,
  ban_reason VARCHAR(255) DEFAULT NULL,
  max_active_orders INT UNSIGNED NOT NULL DEFAULT 5,
  max_orders_per_minute INT UNSIGNED NOT NULL DEFAULT 3,
  language ENUM('id','en') NOT NULL DEFAULT 'id',
  theme ENUM('light','dark') NOT NULL DEFAULT 'light',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_referral_code (referral_code),
  INDEX idx_api_key (api_key),
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- ADMINS
-- =====================
CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin','operator') NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- ADMIN SESSIONS
-- =====================
CREATE TABLE admin_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_token (token(255)),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- USER SESSIONS
-- =====================
CREATE TABLE user_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token(255)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- COUNTRIES
-- =====================
CREATE TABLE countries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  flag_emoji VARCHAR(10) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OTP SERVICES
-- =====================
CREATE TABLE otp_services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  icon VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OPERATORS
-- =====================
CREATE TABLE operators (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  country_id INT UNSIGNED NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country_id (country_id),
  UNIQUE KEY uk_country_code (country_id, code),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OTP PROVIDERS
-- =====================
CREATE TABLE otp_providers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  api_base_url VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OTP PRICING
-- =====================
CREATE TABLE otp_pricing (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  country_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  operator_id INT UNSIGNED DEFAULT NULL,
  provider_id INT UNSIGNED NOT NULL,
  provider_product_code VARCHAR(100) DEFAULT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  markup_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  sell_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  auto_pricing TINYINT(1) NOT NULL DEFAULT 0,
  demand_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  stock INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_country_service (country_id, service_id),
  INDEX idx_provider (provider_id),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES otp_services(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL,
  FOREIGN KEY (provider_id) REFERENCES otp_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OTP ORDERS
-- =====================
CREATE TABLE otp_orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  provider_id INT UNSIGNED NOT NULL,
  provider_order_id VARCHAR(100) DEFAULT NULL,
  country_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  operator_id INT UNSIGNED DEFAULT NULL,
  phone_number VARCHAR(30) DEFAULT NULL,
  otp_code VARCHAR(20) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending','waiting_otp','received','cancelled','expired','refunded','error') NOT NULL DEFAULT 'pending',
  provider_status VARCHAR(50) DEFAULT NULL,
  cancel_reason VARCHAR(255) DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  otp_received_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  INDEX idx_provider_order_id (provider_order_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES otp_providers(id),
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (service_id) REFERENCES otp_services(id),
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- OTP ORDER LOGS
-- =====================
CREATE TABLE otp_order_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  action VARCHAR(50) NOT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  FOREIGN KEY (order_id) REFERENCES otp_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- PAYMENT GATEWAYS
-- =====================
CREATE TABLE payment_gateways (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  config JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- DEPOSITS
-- =====================
CREATE TABLE deposits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  gateway_id INT UNSIGNED NOT NULL,
  reference VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending','paid','expired','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_url VARCHAR(500) DEFAULT NULL,
  qr_url VARCHAR(500) DEFAULT NULL,
  gateway_reference VARCHAR(200) DEFAULT NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_reference (reference),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gateway_id) REFERENCES payment_gateways(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- TRANSACTIONS
-- =====================
CREATE TABLE transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('deposit','order','refund','manual_add','manual_deduct','affiliate_commission') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- WEBSITE SETTINGS
-- =====================
CREATE TABLE website_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_type ENUM('text','number','boolean','json','image') NOT NULL DEFAULT 'text',
  description VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- RESELLER API KEYS
-- =====================
CREATE TABLE reseller_api_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) DEFAULT 'Default',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  rate_limit INT NOT NULL DEFAULT 60,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- RESELLER API LOGS
-- =====================
CREATE TABLE reseller_api_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_body JSON DEFAULT NULL,
  response_code INT NOT NULL,
  response_body JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key_id (api_key_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (api_key_id) REFERENCES reseller_api_keys(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- AFFILIATES
-- =====================
CREATE TABLE affiliates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  total_referrals INT UNSIGNED NOT NULL DEFAULT 0,
  total_commission DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  commission_rate_deposit DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  commission_rate_order DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- AFFILIATE COMMISSIONS
-- =====================
CREATE TABLE affiliate_commissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  affiliate_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  referred_user_id INT UNSIGNED NOT NULL,
  type ENUM('deposit','order') NOT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  amount DECIMAL(15,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_affiliate_id (affiliate_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- ACTIVITY LOGS
-- =====================
CREATE TABLE activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('user','admin','system') NOT NULL,
  actor_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) DEFAULT NULL,
  resource_id INT UNSIGNED DEFAULT NULL,
  details JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor (actor_type, actor_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- WEBHOOK LOGS
-- =====================
CREATE TABLE webhook_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  gateway VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  headers JSON DEFAULT NULL,
  payload JSON DEFAULT NULL,
  response_code INT DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  is_valid TINYINT(1) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gateway (gateway),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- TELEGRAM NOTIFICATIONS
-- =====================
CREATE TABLE telegram_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  chat_id VARCHAR(50) DEFAULT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  error_message VARCHAR(500) DEFAULT NULL,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- PRICING HISTORY
-- =====================
CREATE TABLE pricing_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pricing_id INT UNSIGNED NOT NULL,
  old_cost_price DECIMAL(10,2) DEFAULT NULL,
  new_cost_price DECIMAL(10,2) DEFAULT NULL,
  old_sell_price DECIMAL(10,2) DEFAULT NULL,
  new_sell_price DECIMAL(10,2) DEFAULT NULL,
  old_markup DECIMAL(5,2) DEFAULT NULL,
  new_markup DECIMAL(5,2) DEFAULT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  changed_by ENUM('admin','system') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pricing_id (pricing_id),
  FOREIGN KEY (pricing_id) REFERENCES otp_pricing(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- DEFAULT DATA
-- =====================

-- Default admin
INSERT INTO admins (username, email, password, role) VALUES
('admin', 'admin@otpservice.com', '$2a$12$HfLpotd6hcCM/MnM9XI1mO27hYcqaMfY6TuElOJGp8VwQz8lsLREW', 'superadmin');
-- Default password: admin123 (change immediately)

-- Payment gateways
INSERT INTO payment_gateways (code, name, is_active) VALUES
('tripay', 'Tripay', 1),
('qrispy', 'QRISPY', 1),
('pakasir', 'Pakasir', 1);

-- OTP providers
INSERT INTO otp_providers (code, name, api_base_url, is_active, priority) VALUES
('5sim', '5sim.net', 'https://5sim.net/v1', 1, 1),
('herosms', 'Hero SMS', 'https://hero-sms.com/stubs/handler_api.php', 1, 2),
('nokosmurah', 'Nokosmurah', 'https://api.nokosmurah.com/v1', 1, 3);

-- Default website settings
INSERT INTO website_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'OTP Service', 'text', 'Nama website'),
('site_logo', '/logo.png', 'image', 'Logo website'),
('site_description', 'Layanan OTP & Virtual Number Terpercaya', 'text', 'Deskripsi website'),
('default_theme', 'light', 'text', 'Theme default (light/dark)'),
('default_language', 'id', 'text', 'Bahasa default (id/en)'),
('affiliate_deposit_rate', '5', 'number', 'Komisi affiliate deposit (%)'),
('affiliate_order_rate', '3', 'number', 'Komisi affiliate order (%)'),
('max_active_orders_default', '5', 'number', 'Maksimal order aktif default'),
('max_orders_per_minute_default', '3', 'number', 'Maksimal order per menit default'),
('otp_expiry_minutes', '15', 'number', 'Waktu expired OTP (menit)'),
('telegram_bot_token', '', 'text', 'Token Telegram Bot'),
('telegram_admin_chat_id', '', 'text', 'Chat ID admin Telegram'),
('tripay_api_key', '', 'text', 'API Key Tripay'),
('tripay_private_key', '', 'text', 'Private Key Tripay'),
('tripay_merchant_code', '', 'text', 'Merchant Code Tripay'),
('tripay_mode', 'sandbox', 'text', 'Mode Tripay (sandbox/production)'),
('qrispy_api_key', '', 'text', 'API Key QRISPY'),
('qrispy_merchant_id', '', 'text', 'Merchant ID QRISPY'),
('pakasir_project', '', 'text', 'Nama Project Pakasir'),
('pakasir_net_key', '', 'text', 'Net Key Pakasir'),
('pakasir_mode', 'sandbox', 'text', 'Mode Pakasir (sandbox/production)'),
('fivesim_api_key', '', 'text', 'API Key 5sim.net'),
('herosms_api_key', '', 'text', 'API Key Hero SMS'),
('nokosmurah_api_key', '', 'text', 'API Key Nokosmurah'),
('auto_pricing_enabled', '0', 'boolean', 'Enable auto pricing'),
('demand_threshold', '50', 'number', 'Threshold order untuk auto pricing'),
('demand_markup_increment', '5', 'number', 'Increment markup saat demand tinggi (%)');

-- Default countries
INSERT INTO countries (code, name, name_en, flag_emoji, is_active, sort_order) VALUES
('ID', 'Indonesia', 'Indonesia', '🇮🇩', 1, 1),
('US', 'Amerika Serikat', 'United States', '🇺🇸', 1, 2),
('UK', 'Inggris', 'United Kingdom', '🇬🇧', 1, 3),
('RU', 'Rusia', 'Russia', '🇷🇺', 1, 4),
('IN', 'India', 'India', '🇮🇳', 1, 5),
('PH', 'Filipina', 'Philippines', '🇵🇭', 1, 6),
('MY', 'Malaysia', 'Malaysia', '🇲🇾', 1, 7),
('TH', 'Thailand', 'Thailand', '🇹🇭', 1, 8),
('VN', 'Vietnam', 'Vietnam', '🇻🇳', 1, 9),
('BR', 'Brasil', 'Brazil', '🇧🇷', 1, 10);

-- Default OTP services
INSERT INTO otp_services (code, name, name_en, is_active, sort_order) VALUES
('whatsapp', 'WhatsApp', 'WhatsApp', 1, 1),
('telegram', 'Telegram', 'Telegram', 1, 2),
('gmail', 'Gmail', 'Gmail', 1, 3),
('facebook', 'Facebook', 'Facebook', 1, 4),
('instagram', 'Instagram', 'Instagram', 1, 5),
('twitter', 'Twitter/X', 'Twitter/X', 1, 6),
('tiktok', 'TikTok', 'TikTok', 1, 7),
('shopee', 'Shopee', 'Shopee', 1, 8),
('tokopedia', 'Tokopedia', 'Tokopedia', 1, 9),
('grab', 'Grab', 'Grab', 1, 10),
('gojek', 'Gojek', 'Gojek', 1, 11),
('dana', 'DANA', 'DANA', 1, 12),
('ovo', 'OVO', 'OVO', 1, 13),
('line', 'LINE', 'LINE', 1, 14),
('discord', 'Discord', 'Discord', 1, 15);
