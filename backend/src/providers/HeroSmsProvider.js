const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class HeroSmsProvider extends BaseProvider {
  constructor(apiKey) {
    super('herosms', apiKey, 'https://hero-sms.com/stubs/handler_api.php');
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  async getBalance() {
    try {
      const { data } = await this.client.get('', {
        params: { api_key: this.apiKey, action: 'getBalance' },
      });

      const raw = String(data).trim();

      if (raw.startsWith('ACCESS_BALANCE:')) {
        const balance = parseFloat(raw.split(':')[1]);
        return { balance, currency: 'USD' };
      }

      this._handleError(raw, 'getBalance');
    } catch (error) {
      logger.error({ err: error }, 'HeroSMS: getBalance failed');
      throw new Error(`HeroSMS getBalance error: ${error.message}`);
    }
  }

  async listServices(countryCode) {
    try {
      const { data } = await this.client.get('', {
        params: {
          api_key: this.apiKey,
          action: 'getServicesAndCost',
          country: countryCode,
        },
      });

      if (typeof data === 'string') {
        this._handleError(data.trim(), 'listServices');
      }

      const services = Array.isArray(data) ? data : [];
      return services.map((svc) => ({
        code: svc.id,
        name: svc.name,
        operator: 'any',
        price: parseFloat(svc.price) || 0,
        stock: parseInt(svc.quantity, 10) || 0,
      }));
    } catch (error) {
      logger.error({ err: error, countryCode }, 'HeroSMS: listServices failed');
      throw new Error(`HeroSMS listServices error: ${error.message}`);
    }
  }

  async createOrder(countryCode, serviceCode, operatorCode) {
    try {
      const { data } = await this.client.get('', {
        params: {
          api_key: this.apiKey,
          action: 'getNumberV2',
          service: serviceCode,
          country: countryCode,
          operator: operatorCode || 'any',
        },
      });

      if (typeof data === 'string') {
        const raw = data.trim();
        if (raw === 'NO_BALANCE') {
          throw new Error('Insufficient balance on HeroSMS account');
        }
        if (raw === 'NO_NUMBERS') {
          throw new Error('No numbers available for the requested service');
        }
        this._handleError(raw, 'createOrder');
      }

      return {
        orderId: String(data.activationId),
        phoneNumber: data.phoneNumber || null,
        status: 'waiting_otp',
      };
    } catch (error) {
      logger.error({ err: error, countryCode, serviceCode }, 'HeroSMS: createOrder failed');
      throw new Error(
        `HeroSMS createOrder error: ${error.message}`
      );
    }
  }

  async getOrderStatus(orderId) {
    try {
      const { data } = await this.client.get('', {
        params: {
          api_key: this.apiKey,
          action: 'getStatus',
          id: orderId,
        },
      });

      const raw = String(data).trim();
      return this._parseStatus(raw);
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: getOrderStatus failed');
      throw new Error(`HeroSMS getOrderStatus error: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const { data } = await this.client.get('', {
        params: {
          api_key: this.apiKey,
          action: 'setStatus',
          id: orderId,
          status: 8,
        },
      });

      const raw = String(data).trim();
      return {
        success: raw === 'ACCESS_CANCEL',
        status: raw === 'ACCESS_CANCEL' ? 'cancelled' : 'error',
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: cancelOrder failed');
      throw new Error(`HeroSMS cancelOrder error: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      const { data } = await this.client.get('', {
        params: {
          api_key: this.apiKey,
          action: 'setStatus',
          id: orderId,
          status: 3,
        },
      });

      const raw = String(data).trim();
      return {
        success: raw === 'ACCESS_RETRY_GET',
        message: raw === 'ACCESS_RETRY_GET' ? 'OTP resend requested' : raw,
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: resendOtp failed');
      return { success: false, message: error.message };
    }
  }

  _parseStatus(raw) {
    if (raw.startsWith('STATUS_OK:')) {
      return {
        status: 'received',
        otpCode: raw.split(':')[1],
        phoneNumber: null,
      };
    }

    if (raw.startsWith('STATUS_WAIT_RETRY:')) {
      return {
        status: 'waiting_otp',
        otpCode: raw.split(':')[1],
        phoneNumber: null,
      };
    }

    const statusMap = {
      STATUS_WAIT_CODE: 'waiting_otp',
      STATUS_CANCEL: 'cancelled',
      STATUS_WAIT_RESEND: 'waiting_otp',
    };

    return {
      status: statusMap[raw] || 'pending',
      otpCode: null,
      phoneNumber: null,
    };
  }

  _handleError(raw, method) {
    const errorMap = {
      BAD_KEY: 'Invalid API key',
      BAD_ACTION: 'Invalid action',
      ERROR_SQL: 'Server error',
      NO_ACTIVATION: 'Activation not found',
      NO_BALANCE: 'Insufficient balance',
      NO_NUMBERS: 'No numbers available',
      WRONG_SERVICE: 'Invalid service code',
      WRONG_COUNTRY: 'Invalid country code',
    };

    const message = errorMap[raw];
    if (message) {
      throw new Error(`HeroSMS ${method}: ${message}`);
    }
  }
}

module.exports = HeroSmsProvider;
