import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

interface PakasirInvoice {
  invoice_id: string;
  payment_url: string;
  qris_url: string;
}

interface PakasirPaymentStatus {
  status: "pending" | "paid" | "expired";
  paid_at?: string;
  method?: string;
}

export class PakasirPayment {
  private client: AxiosInstance;
  private merchantId: string;
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.merchantId = process.env.PAKASIR_MERCHANT_ID || "";
    this.apiKey = process.env.PAKASIR_API_KEY || "";
    this.secretKey = process.env.PAKASIR_SECRET_KEY || "";
    this.client = axios.create({
      baseURL: "https://pakasir.id/api/v2",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async createInvoice(
    userId: string,
    amount: number,
    description: string
  ): Promise<PakasirInvoice | null> {
    try {
      const { data } = await this.client.post("/transaction/create", {
        merchant_id: this.merchantId,
        amount,
        description,
        customer_id: userId,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pakasir`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/topup`,
      });
      if (data.success) {
        return {
          invoice_id: data.data.invoice_id,
          payment_url: data.data.payment_url,
          qris_url: data.data.qris_url || "",
        };
      }
      return null;
    } catch (error) {
      console.error("[Pakasir] Create invoice error:", error);
      return null;
    }
  }

  async checkPaymentStatus(invoiceId: string): Promise<PakasirPaymentStatus> {
    try {
      const { data } = await this.client.get(`/transaction/${invoiceId}`);
      return {
        status: data.data?.status || "pending",
        paid_at: data.data?.paid_at,
        method: data.data?.method,
      };
    } catch (error) {
      console.error("[Pakasir] Check status error:", error);
      return { status: "pending" };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const pakasir = new PakasirPayment();
