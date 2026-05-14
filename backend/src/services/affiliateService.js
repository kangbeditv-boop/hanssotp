const { pool } = require('../config/database');
const logger = require('../utils/logger');

class AffiliateService {
  async processCommission(userId, type, referenceId, amount) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [users] = await connection.query(
        'SELECT id, referred_by FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0 || !users[0].referred_by) {
        await connection.commit();
        return null;
      }

      const referrerId = users[0].referred_by;
      const [affiliates] = await connection.query(
        'SELECT * FROM affiliates WHERE user_id = ? AND is_active = 1',
        [referrerId]
      );

      if (affiliates.length === 0) {
        await connection.commit();
        return null;
      }

      const affiliate = affiliates[0];
      const rate =
        type === 'deposit'
          ? parseFloat(affiliate.commission_rate_deposit)
          : parseFloat(affiliate.commission_rate_order);

      const commissionAmount = (amount * rate) / 100;
      if (commissionAmount <= 0) {
        await connection.commit();
        return null;
      }

      const [referrer] = await connection.query(
        'SELECT balance FROM users WHERE id = ?',
        [referrerId]
      );

      const balanceBefore = parseFloat(referrer[0].balance);
      const balanceAfter = balanceBefore + commissionAmount;

      await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [
        commissionAmount,
        referrerId,
      ]);

      await connection.query(
        `INSERT INTO affiliate_commissions
         (affiliate_id, user_id, referred_user_id, type, reference_id, amount, commission_rate, commission_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
        [affiliate.id, referrerId, userId, type, referenceId, amount, rate, commissionAmount]
      );

      await connection.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
         VALUES (?, 'affiliate_commission', ?, ?, ?, ?, ?, ?)`,
        [
          referrerId,
          commissionAmount,
          balanceBefore,
          balanceAfter,
          type === 'deposit' ? 'deposit' : 'order',
          referenceId,
          `Komisi affiliate dari ${type}`,
        ]
      );

      await connection.query(
        'UPDATE affiliates SET total_commission = total_commission + ? WHERE id = ?',
        [commissionAmount, affiliate.id]
      );

      await connection.commit();
      logger.info({ referrerId, commissionAmount, type }, 'Affiliate commission processed');
      return { referrerId, commissionAmount };
    } catch (error) {
      await connection.rollback();
      logger.error({ err: error }, 'Failed to process affiliate commission');
      return null;
    } finally {
      connection.release();
    }
  }
}

module.exports = new AffiliateService();
