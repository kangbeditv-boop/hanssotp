const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class HeroSmsProvider extends BaseProvider {
  constructor(apiKey) {
    super('herosms', apiKey, 'https://api.herosms.com/v1');
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  async getBalance() {
    try {
      const { data } = await this.client.get('/balance');
      return { balance: data.balance, currency: 'IDR' };
    } catch (error) {
      logger.error({ err: error }, 'HeroSMS: getBalance failed');
      throw new Error(`HeroSMS getBalance error: ${error.message}`);
    }
  }

  async listServices(countryCode) {
    try {
      const { data } = await this.client.get('/services', {
        params: { country: countryCode },
      });

      return (data.services || []).map((svc) => ({
        code: svc.code,
        name: svc.name,
        operator: svc.operator || 'any',
        price: svc.price,
        stock: svc.stock || 0,
      }));
    } catch (error) {
      logger.error({ err: error, countryCode }, 'HeroSMS: listServices failed');
      throw new Error(`HeroSMS listServices error: ${error.message}`);
    }
  }

  async createOrder(countryCode, serviceCode, operatorCode) {
    try {
      const { data } = await this.client.post('/order', {
        country: countryCode,
        service: serviceCode,
        operator: operatorCode || 'any',
      });

      return {
        orderId: String(data.order_id),
        phoneNumber: data.phone_number || null,
        status: this._mapStatus(data.status),
      };
    } catch (error) {
      logger.error({ err: error, countryCode, serviceCode }, 'HeroSMS: createOrder failed');
      throw new Error(
        `HeroSMS createOrder error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getOrderStatus(orderId) {
    try {
      const { data } = await this.client.get(`/order/${orderId}`);

      return {
        status: this._mapStatus(data.status),
        otpCode: data.otp_code || null,
        phoneNumber: data.phone_number || null,
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: getOrderStatus failed');
      throw new Error(`HeroSMS getOrderStatus error: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const { data } = await this.client.post(`/order/${orderId}/cancel`);
      return { success: data.success !== false, status: this._mapStatus(data.status) };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: cancelOrder failed');
      throw new Error(`HeroSMS cancelOrder error: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      const { data } = await this.client.post(`/order/${orderId}/resend`);
      return { success: data.success !== false, message: data.message || 'OTP resent' };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: resendOtp failed');
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  _mapStatus(providerStatus) {
    const statusMap = {
      pending: 'pending',
      waiting: 'waiting_otp',
      active: 'waiting_otp',
      completed: 'received',
      cancelled: 'cancelled',
      expired: 'expired',
      error: 'error',
    };
    return statusMap[providerStatus] || 'pending';
  }
}

module.exports = HeroSmsProvider;
