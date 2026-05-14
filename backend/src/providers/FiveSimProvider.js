const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class FiveSimProvider extends BaseProvider {
  constructor(apiKey) {
    super('5sim', apiKey, 'https://5sim.net/v1');
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  async getBalance() {
    try {
      const { data } = await this.client.get('/user/profile');
      return { balance: data.balance, currency: data.default_country?.currency || 'RUB' };
    } catch (error) {
      logger.error({ err: error }, '5sim: getBalance failed');
      throw new Error(`5sim getBalance error: ${error.message}`);
    }
  }

  async listServices(countryCode) {
    try {
      const country = countryCode.toLowerCase();
      const { data } = await this.client.get(`/guest/prices?country=${country}`);
      const services = [];

      for (const [countryName, countryServices] of Object.entries(data)) {
        for (const [serviceCode, operators] of Object.entries(countryServices)) {
          for (const [operatorName, details] of Object.entries(operators)) {
            services.push({
              code: serviceCode,
              name: serviceCode,
              operator: operatorName,
              price: details.cost,
              stock: details.count,
            });
          }
        }
      }

      return services;
    } catch (error) {
      logger.error({ err: error, countryCode }, '5sim: listServices failed');
      throw new Error(`5sim listServices error: ${error.message}`);
    }
  }

  async createOrder(countryCode, serviceCode, operatorCode) {
    try {
      const country = countryCode.toLowerCase();
      const operator = operatorCode || 'any';
      const { data } = await this.client.get(
        `/user/buy/activation/${country}/${operator}/${serviceCode}`
      );

      return {
        orderId: String(data.id),
        phoneNumber: data.phone ? `+${data.phone}` : null,
        status: this._mapStatus(data.status),
      };
    } catch (error) {
      logger.error({ err: error, countryCode, serviceCode }, '5sim: createOrder failed');
      throw new Error(`5sim createOrder error: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrderStatus(orderId) {
    try {
      const { data } = await this.client.get(`/user/check/${orderId}`);
      let otpCode = null;

      if (data.sms && data.sms.length > 0) {
        otpCode = data.sms[data.sms.length - 1].code;
      }

      return {
        status: this._mapStatus(data.status),
        otpCode,
        phoneNumber: data.phone ? `+${data.phone}` : null,
      };
    } catch (error) {
      logger.error({ err: error, orderId }, '5sim: getOrderStatus failed');
      throw new Error(`5sim getOrderStatus error: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const { data } = await this.client.get(`/user/cancel/${orderId}`);
      return { success: true, status: this._mapStatus(data.status) };
    } catch (error) {
      logger.error({ err: error, orderId }, '5sim: cancelOrder failed');
      throw new Error(`5sim cancelOrder error: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    return { success: false, message: '5sim tidak mendukung resend OTP' };
  }

  _mapStatus(providerStatus) {
    const statusMap = {
      PENDING: 'pending',
      RECEIVED: 'waiting_otp',
      CANCELED: 'cancelled',
      TIMEOUT: 'expired',
      FINISHED: 'received',
      BANNED: 'error',
    };
    return statusMap[providerStatus] || 'pending';
  }
}

module.exports = FiveSimProvider;
