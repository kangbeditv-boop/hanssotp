const { z } = require('zod');

const updateBalanceSchema = z.object({
  amount: z.number(),
  type: z.enum(['add', 'deduct']),
  reason: z.string().min(1).max(255),
});

const updateServiceSchema = z.object({
  country_id: z.number().int().positive().optional(),
  service_id: z.number().int().positive().optional(),
  operator_id: z.number().int().positive().nullable().optional(),
  provider_id: z.number().int().positive().optional(),
  provider_product_code: z.string().optional(),
  cost_price: z.number().min(0).optional(),
  markup_percent: z.number().min(0).optional(),
  sell_price: z.number().min(0).optional(),
  auto_pricing: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const createServiceSchema = z.object({
  country_id: z.number().int().positive(),
  service_id: z.number().int().positive(),
  operator_id: z.number().int().positive().nullable().optional(),
  provider_id: z.number().int().positive(),
  provider_product_code: z.string().optional(),
  cost_price: z.number().min(0),
  markup_percent: z.number().min(0),
  sell_price: z.number().min(0),
  auto_pricing: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const updateSettingSchema = z.object({
  setting_key: z.string().min(1),
  setting_value: z.string(),
});

const refundSchema = z.object({
  order_id: z.number().int().positive(),
  reason: z.string().min(1).max(255),
});

module.exports = {
  updateBalanceSchema,
  updateServiceSchema,
  createServiceSchema,
  updateSettingSchema,
  refundSchema,
};
