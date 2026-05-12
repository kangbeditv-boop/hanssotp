const { z } = require('zod');

const orderOtpSchema = z.object({
  country_id: z.number().int().positive(),
  service_id: z.number().int().positive(),
  operator_id: z.number().int().positive().optional(),
  provider_id: z.number().int().positive().optional(),
});

module.exports = { orderOtpSchema };
