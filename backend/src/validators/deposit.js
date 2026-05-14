const { z } = require('zod');

const createDepositSchema = z.object({
  amount: z.number().min(10000, 'Minimum deposit Rp10.000').max(10000000, 'Maksimum deposit Rp10.000.000'),
  gateway: z.enum(['tripay', 'qrispy'], { message: 'Gateway tidak valid' }),
});

module.exports = { createDepositSchema };
