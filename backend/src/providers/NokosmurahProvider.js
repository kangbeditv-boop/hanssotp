const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class NokosmurahProvider extends BaseProvider {
  constructor(apiKey) {
    super('nokosmurah', apiKey, 'https://api.nokosmurah.com/v1');
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
      const { data } = await this.client.get('/balance');
      return { balance: data.data?.balance || data.balance || 0, currency: 'IDR' };
    } catch (error) {
      logger.error({ err: error }, 'Nokosmurah: getBalance failed');
      throw new Error(`Nokosmurah getBalance error: ${error.message}`);
    }
  }

  async listServices(countryCode) {
    try {
      const { data } = await this.client.get('/services', {
        params: { country: countryCode },
      });

      const services = data.data || data.services || [];
      return services.map((svc) => ({
        code: svc.code || svc.service_code,
        name: svc.name || svc.service_name,
        operator: svc.operator || 'any',
        price: svc.price || svc.sell_price,
        stock: svc.stock || svc.available || 0,
      }));
    } catch (error) {
      logger.error({ err: error, countryCode }, 'Nokosmurah: listServices failed');
      throw new Error(`Nokosmurah listServices error: ${error.message}`);
    }
  }

  async createOrder(countryCode, serviceCode, operatorCode) {
    try {
      const { data } = await this.client.post('/order/create', {
        country: countryCode,
        service: serviceCode,
        operator: operatorCode || 'any',
      });

      const orderData = data.data || data;
      return {
        orderId: String(orderData.order_id || orderData.id),
        phoneNumber: orderData.phone_number || orderData.number || null,
        status: this._mapStatus(orderData.status),
      };
    } catch (error) {
      logger.error({ err: error, countryCode, serviceCode }, 'Nokosmurah: createOrder failed');
      throw new Error(
        `Nokosmurah createOrder error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getOrderStatus(orderId) {
    try {
      const { data } = await this.client.get(`/order/${orderId}`);
      const orderData = data.data || data;

      return {
        status: this._mapStatus(orderData.status),
        otpCode: orderData.otp_code || orderData.otp || orderData.sms_code || null,
        phoneNumber: orderData.phone_number || orderData.number || null,
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'Nokosmurah: getOrderStatus failed');
      throw new Error(`Nokosmurah getOrderStatus error: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const { data } = await this.client.post(`/order/${orderId}/cancel`);
      const result = data.data || data;
      return {
        success: result.success !== false,
        status: this._mapStatus(result.status),
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'Nokosmurah: cancelOrder failed');
      throw new Error(`Nokosmurah cancelOrder error: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      const { data } = await this.client.post(`/order/${orderId}/resend`);
      const result = data.data || data;
      return {
        success: result.success !== false,
        message: result.message || 'OTP resend requested',
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'Nokosmurah: resendOtp failed');
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  _mapStatus(providerStatus) {
    const statusMap = {
      pending: 'pending',
      waiting: 'waiting_otp',
      active: 'waiting_otp',
      success: 'received',
      completed: 'received',
      cancelled: 'cancelled',
      cancel: 'cancelled',
      expired: 'expired',
      timeout: 'expired',
      error: 'error',
      failed: 'error',
    };
    return statusMap[providerStatus] || 'pending';
  }
}

module.exports = NokosmurahProvider;
