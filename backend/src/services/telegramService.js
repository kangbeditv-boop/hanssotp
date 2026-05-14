const axios = require('axios');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class TelegramService {
  async _getBotToken() {
    const [rows] = await pool.query(
      "SELECT setting_value FROM website_settings WHERE setting_key = 'telegram_bot_token'"
    );
    return rows[0]?.setting_value || process.env.TELEGRAM_BOT_TOKEN || '';
  }

  async _getAdminChatId() {
    const [rows] = await pool.query(
      "SELECT setting_value FROM website_settings WHERE setting_key = 'telegram_admin_chat_id'"
    );
    return rows[0]?.setting_value || process.env.TELEGRAM_ADMIN_CHAT_ID || '';
  }

  async sendMessage(chatId, message) {
    const botToken = await this._getBotToken();
    if (!botToken) {
      logger.warn('Telegram bot token not configured');
      return false;
    }

    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
      return true;
    } catch (error) {
      logger.error({ err: error, chatId }, 'Telegram: sendMessage failed');
      return false;
    }
  }

  async notifyAdmin(message) {
    const adminChatId = await this._getAdminChatId();
    if (!adminChatId) return false;
    return this.sendMessage(adminChatId, message);
  }

  async notifyDepositSuccess(userId, amount, reference) {
    const message = `✅ <b>Deposit Berhasil</b>\n\nUser ID: ${userId}\nJumlah: Rp${amount.toLocaleString('id-ID')}\nReferensi: ${reference}`;

    await this._saveNotification(userId, 'deposit_success', message);
    await this.notifyAdmin(message);
  }

  async notifyOtpReceived(userId, serviceName, phoneNumber, otpCode) {
    const message = `📱 <b>OTP Diterima</b>\n\nLayanan: ${serviceName}\nNomor: ${phoneNumber}\nOTP: <code>${otpCode}</code>`;

    await this._saveNotification(userId, 'otp_received', message);
  }

  async notifyOrderFailed(userId, serviceName, reason) {
    const message = `❌ <b>Order Gagal</b>\n\nLayanan: ${serviceName}\nAlasan: ${reason}`;

    await this._saveNotification(userId, 'order_failed', message);
    await this.notifyAdmin(message);
  }

  async _saveNotification(userId, type, message) {
    try {
      await pool.query(
        `INSERT INTO telegram_notifications (user_id, type, message, status)
         VALUES (?, ?, ?, 'pending')`,
        [userId, type, message]
      );
    } catch (error) {
      logger.error({ err: error }, 'Failed to save telegram notification');
    }
  }
}

module.exports = new TelegramService();
