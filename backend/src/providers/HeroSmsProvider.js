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

  async _request(action, params = {}) {
    const { data } = await this.client.get('', {
      params: {
        api_key: this.apiKey,
        action,
        ...params,
      },
    });
    this._checkForErrors(data);
    return data;
  }

  _checkForErrors(response) {
    if (typeof response !== 'string') return;
    const errorCodes = [
      'BAD_ACTION', 'BAD_KEY', 'NO_KEY', 'ERROR_SQL', 'BAD_SERVICE',
      'BAD_STATUS', 'NO_NUMBERS', 'NO_ACTIVATION', 'WRONG_ACTIVATION_ID',
      'EARLY_CANCEL_DENIED', 'NO_BALANCE',
    ];
    for (const code of errorCodes) {
      if (response === code || response.startsWith(code)) {
        throw new Error(`HeroSMS API error: ${response}`);
      }
    }
  }

  async getBalance() {
    try {
      const response = await this._request('getBalance');
      const match = String(response).match(/ACCESS_BALANCE:(.+)/);
      if (!match) {
        throw new Error(`Unexpected balance response: ${response}`);
      }
      return { balance: parseFloat(match[1]), currency: 'USD' };
    } catch (error) {
      logger.error({ err: error }, 'HeroSMS: getBalance failed');
      throw new Error(`HeroSMS getBalance error: ${error.message}`);
    }
  }

  async listServices(countryCode) {
    try {
      const response = await this._request('getServicesList', {
        country: countryCode,
        lang: 'en',
      });

      if (response && response.status === 'success' && Array.isArray(response.services)) {
        return response.services.map((svc) => ({
          code: svc.code,
          name: svc.name,
          operator: 'any',
          price: 0,
          stock: 0,
        }));
      }

      return [];
    } catch (error) {
      logger.error({ err: error, countryCode }, 'HeroSMS: listServices failed');
      throw new Error(`HeroSMS listServices error: ${error.message}`);
    }
  }

  async createOrder(countryCode, serviceCode, operatorCode) {
    try {
      const params = {
        service: serviceCode,
        country: countryCode,
      };
      if (operatorCode && operatorCode !== 'any') {
        params.operator = operatorCode;
      }

      const response = await this._request('getNumber', params);
      const match = String(response).match(/ACCESS_NUMBER:(\d+):(.+)/);
      if (!match) {
        throw new Error(`Unexpected getNumber response: ${response}`);
      }

      const activationId = match[1];
      const phoneNumber = match[2];

      return {
        orderId: activationId,
        phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
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
      const response = await this._request('getStatus', { id: orderId });
      const responseStr = String(response);

      if (responseStr.startsWith('STATUS_OK:')) {
        const code = responseStr.split(':')[1];
        return {
          status: 'received',
          otpCode: code,
          phoneNumber: null,
        };
      }
      if (responseStr.startsWith('STATUS_WAIT_RETRY:')) {
        const code = responseStr.split(':')[1];
        return {
          status: 'waiting_otp',
          otpCode: code,
          phoneNumber: null,
        };
      }
      if (responseStr === 'STATUS_WAIT_CODE') {
        return { status: 'waiting_otp', otpCode: null, phoneNumber: null };
      }
      if (responseStr === 'STATUS_WAIT_RESEND') {
        return { status: 'waiting_otp', otpCode: null, phoneNumber: null };
      }
      if (responseStr === 'STATUS_CANCEL') {
        return { status: 'cancelled', otpCode: null, phoneNumber: null };
      }

      return { status: 'pending', otpCode: null, phoneNumber: null };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: getOrderStatus failed');
      throw new Error(`HeroSMS getOrderStatus error: ${error.message}`);
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await this._request('setStatus', { id: orderId, status: 8 });
      const responseStr = String(response);
      return {
        success: responseStr === 'ACCESS_CANCEL' || responseStr === 'ACCESS_CANCEL_OR_REFUND',
        status: 'cancelled',
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: cancelOrder failed');
      throw new Error(`HeroSMS cancelOrder error: ${error.message}`);
    }
  }

  async resendOtp(orderId) {
    try {
      const response = await this._request('setStatus', { id: orderId, status: 3 });
      const responseStr = String(response);
      return {
        success: responseStr === 'ACCESS_RETRY_GET' || responseStr === 'ACCESS_RESEND',
        message: responseStr === 'ACCESS_RETRY_GET' ? 'OTP resend requested' : responseStr,
      };
    } catch (error) {
      logger.error({ err: error, orderId }, 'HeroSMS: resendOtp failed');
      return { success: false, message: error.message };
    }
  }
}

module.exports = HeroSmsProvider;
