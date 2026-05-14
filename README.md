# OTP Service - Platform Jasa Virtual Number

Platform fullstack untuk layanan OTP dan virtual number, mirip seperti rumahotp.io dan nokosmurah.com.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0+
- **Realtime**: Socket.IO
- **Auth**: JWT (user + admin terpisah)
- **Deploy**: aaPanel / VPS

## Fitur

### User
- Register, login, logout (JWT)
- Dashboard (saldo, total order, deposit, riwayat)
- Deposit via QRIS (Tripay / QRISPY)
- Order OTP (pilih negara, layanan, operator)
- Realtime OTP via Socket.IO
- Cancel order & auto refund
- Riwayat order & transaksi lengkap
- Affiliate/referral program
- Reseller public API
- Multi bahasa (ID/EN)
- Dark mode responsive

### Admin
- Dashboard statistik (user, deposit, order, profit)
- CRUD user (ban/unban, adjust saldo)
- Kelola layanan OTP (pricing, markup)
- Monitoring deposit & order
- Refund manual
- Setting website & API keys
- Activity log

### Fitur Tambahan
- Provider adapter pattern (5sim, HeroSMS, Nokosmurah)
- Payment gateway adapter (Tripay, QRISPY, Pakasir)
- Auto cancel/refund expired orders (15 menit)
- OTP polling setiap 15 detik
- Auto pricing berdasarkan demand
- Rate limiting per user & API key
- Webhook payment validation
- Telegram bot notification

## Instalasi di VPS (aaPanel)

### Prasyarat
- VPS dengan Ubuntu 20.04+
- aaPanel terinstall
- Node.js 18+ (install via aaPanel App Store)
- MySQL 8.0+ (install via aaPanel App Store)
- Nginx (install via aaPanel App Store)

### Langkah 1: Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE otp_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Buat user database
CREATE USER 'otp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON otp_service.* TO 'otp_user'@'localhost';
FLUSH PRIVILEGES;

# Import schema
mysql -u otp_user -p otp_service < /www/wwwroot/yourdomain.com/backend/database/schema.sql
```

### Langkah 2: Upload Source Code

```bash
# Clone atau upload ke direktori website
cd /www/wwwroot/yourdomain.com/

# Atau clone dari repository
git clone <your-repo-url> .
```

### Langkah 3: Setup Backend

```bash
cd /www/wwwroot/yourdomain.com/backend

# Copy environment file
cp .env.example .env

# Edit .env dan isi semua konfigurasi
nano .env

# Install dependencies
npm install

# Test jalankan
npm start
```

### Langkah 4: Setup Frontend

```bash
cd /www/wwwroot/yourdomain.com/frontend

# Install dependencies
npm install

# Build untuk production
npm run build
```

### Langkah 5: Konfigurasi Nginx

Di aaPanel:
1. Buka **Website** → **Add Site** → masukkan domain
2. Buka **Config** pada site → paste isi file `nginx.conf` yang disediakan
3. Ganti `yourdomain.com` dengan domain anda
4. Ganti root path sesuai lokasi frontend/dist

Atau copy manual:
```bash
cp nginx.conf /www/server/panel/vhost/nginx/yourdomain.com.conf
nginx -t && nginx -s reload
```

### Langkah 6: Jalankan Backend dengan PM2

```bash
# Install PM2
npm install -g pm2

# Jalankan backend
cd /www/wwwroot/yourdomain.com/backend
pm2 start src/index.js --name otp-service

# Auto-start saat reboot
pm2 startup
pm2 save
```

### Langkah 7: Setup SSL (opsional tapi direkomendasikan)

Di aaPanel:
1. Buka **Website** → pilih site → **SSL**
2. Pilih **Let's Encrypt** → **Apply**

## Konfigurasi

### Environment Variables

Semua konfigurasi ada di file `backend/.env`. Lihat `.env.example` untuk daftar lengkap.

### Admin Login

Default admin:
- Username: `admin`
- Password: `admin123`
- **PENTING: Ganti password segera setelah login pertama kali!**

Akses admin panel: `https://yourdomain.com/admin/login`

### Payment Gateway

#### Tripay
1. Daftar di [tripay.co.id](https://tripay.co.id)
2. Dapatkan API Key, Private Key, dan Merchant Code
3. Set webhook callback URL: `https://yourdomain.com/api/webhooks/tripay`
4. Isi di Settings admin atau `.env`

#### QRISPY
1. Daftar di QRISPY
2. Dapatkan API Key dan Merchant ID
3. Set webhook callback URL: `https://yourdomain.com/api/webhooks/qrispy`
4. Isi di Settings admin atau `.env`

#### Pakasir
1. Daftar di [pakasir.com](https://pakasir.com)
2. Buat Project dan dapatkan Net Key
3. Set webhook callback URL: `https://yourdomain.com/api/webhooks/pakasir` pada Project di Pakasir
4. Isi `PAKASIR_PROJECT`, `PAKASIR_NET_KEY`, dan `PAKASIR_MODE` di Settings admin atau `.env`

### OTP Provider

#### 5sim.net
1. Daftar di [5sim.net](https://5sim.net)
2. Dapatkan API Token dari profile
3. Isi di Settings admin atau `.env`

#### HeroSMS
1. Daftar di [hero-sms.com](https://hero-sms.com)
2. Dapatkan API Key dari dashboard
3. API menggunakan protokol SMS-Activate compatible
4. Isi di Settings admin atau `.env`

#### Nokosmurah
1. Daftar dan dapatkan API key
2. Isi di Settings admin atau `.env`

### Telegram Bot (opsional)
1. Buat bot baru via [@BotFather](https://t.me/BotFather)
2. Dapatkan Bot Token
3. Dapatkan Chat ID admin (kirim pesan ke bot, lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates`)
4. Isi di Settings admin atau `.env`

## API Reseller

Base URL: `https://yourdomain.com/api/reseller`

Header: `X-API-Key: YOUR_API_KEY`

### Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/balance` | Cek saldo |
| GET | `/services` | List layanan tersedia |
| POST | `/order` | Buat order OTP |
| GET | `/order/:id` | Cek status order |
| POST | `/order/:id/cancel` | Batalkan order |

### Contoh Request

```bash
# Cek saldo
curl -H "X-API-Key: YOUR_API_KEY" https://yourdomain.com/api/reseller/balance

# Order OTP
curl -X POST \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country_id": 1, "service_id": 1}' \
  https://yourdomain.com/api/reseller/order

# Cek status order
curl -H "X-API-Key: YOUR_API_KEY" https://yourdomain.com/api/reseller/order/123
```

## Cron Jobs (otomatis)

Cron jobs sudah built-in di backend menggunakan `node-cron`:

| Job | Interval | Fungsi |
|-----|----------|--------|
| OTP Poller | 15 detik | Poll status OTP dari provider |
| Expired Orders | 1 menit | Auto cancel & refund order expired |
| Auto Pricing | 1 jam | Update harga berdasarkan demand |

## Struktur File

```
otp-service/
├── backend/
│   ├── database/
│   │   └── schema.sql
│   ├── src/
│   │   ├── adapters/         # Payment gateway adapters
│   │   ├── config/           # Database & env config
│   │   ├── cron/             # Cron jobs
│   │   ├── middleware/       # Auth, error handler, rate limit
│   │   ├── providers/        # OTP provider adapters
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic services
│   │   ├── socket/           # Socket.IO setup
│   │   ├── utils/            # Helpers, logger, errors
│   │   ├── validators/       # Zod validation schemas
│   │   └── index.js          # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── i18n/             # Translations
│   │   ├── pages/            # Page components
│   │   ├── utils/            # API client, helpers
│   │   ├── App.jsx           # Main app with routing
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── nginx.conf
├── .env.example
└── README.md
```

## Security

- Password hashing dengan bcrypt (12 rounds)
- JWT auth dengan secret terpisah untuk user & admin
- Rate limiting pada login & reseller API
- Validasi request dengan Zod
- CORS dari environment variable
- Helmet security headers
- Webhook signature validation
- API key tidak di-hardcode

## License

MIT
