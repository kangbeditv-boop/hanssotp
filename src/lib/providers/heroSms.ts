import axios, { AxiosInstance } from "axios";

interface HeroSmsNumber {
  id: string;
  number: string;
  expires_at: string;
}

interface HeroSmsOtpResult {
  status: string;
  sms_code: string | null;
}

interface HeroSmsCountry {
  id: string;
  name: string;
  flag: string;
}

interface HeroSmsService {
  id: string;
  name: string;
  price: number;
}

export class HeroSmsProvider {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HERO_SMS_API_KEY || "";
    this.client = axios.create({
      baseURL: "https://hero-sms.com/api/v1",
      timeout: 30000,
    });
  }

  async getAvailableNumbers(country: string, service: string): Promise<HeroSmsNumber[]> {
    try {
      const { data } = await this.client.get("/numbers", {
        params: { api_key: this.apiKey, country, service },
      });
      return data.data || [];
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async rentNumber(country: string, service: string, apiKey?: string): Promise<HeroSmsNumber | null> {
    try {
      const key = apiKey || this.apiKey;
      const { data } = await this.client.get("/order", {
        params: { api_key: key, country, service, action: "getNumber" },
      });
      if (data.status === "success") {
        return {
          id: data.data.id,
          number: data.data.number,
          expires_at: data.data.expires_at,
        };
      }
      return null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async checkOtp(activationId: string, apiKey?: string): Promise<HeroSmsOtpResult> {
    try {
      const key = apiKey || this.apiKey;
      const { data } = await this.client.get("/order/check", {
        params: { api_key: key, id: activationId },
      });
      return {
        status: data.data?.status || "waiting",
        sms_code: data.data?.sms_code || null,
      };
    } catch (error) {
      this.handleError(error);
      return { status: "error", sms_code: null };
    }
  }

  async cancelNumber(activationId: string, apiKey?: string): Promise<string> {
    try {
      const key = apiKey || this.apiKey;
      const { data } = await this.client.get("/order/cancel", {
        params: { api_key: key, id: activationId },
      });
      return data.status || "error";
    } catch (error) {
      this.handleError(error);
      return "error";
    }
  }

  async getBalance(apiKey?: string): Promise<number> {
    try {
      const key = apiKey || this.apiKey;
      const { data } = await this.client.get("/balance", {
        params: { api_key: key },
      });
      return parseFloat(data.data?.balance || "0");
    } catch (error) {
      this.handleError(error);
      return 0;
    }
  }

  async getCountries(): Promise<HeroSmsCountry[]> {
    try {
      const { data } = await this.client.get("/countries", {
        params: { api_key: this.apiKey },
      });
      return (data.data || []).map((c: Record<string, string>) => ({
        id: c.id,
        name: c.name,
        flag: c.flag || "",
      }));
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getServices(countryId: string): Promise<HeroSmsService[]> {
    try {
      const { data } = await this.client.get("/services", {
        params: { api_key: this.apiKey, country: countryId },
      });
      return (data.data || []).map((s: Record<string, string | number>) => ({
        id: String(s.id),
        name: String(s.name),
        price: Number(s.price),
      }));
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async pollOtp(
    activationId: string,
    onReceived: (code: string) => void,
    onExpired: () => void,
    apiKey?: string
  ): Promise<() => void> {
    const maxDuration = 5 * 60 * 1000;
    const interval = 5000;
    const startTime = Date.now();

    const timer = setInterval(async () => {
      if (Date.now() - startTime >= maxDuration) {
        clearInterval(timer);
        onExpired();
        return;
      }
      const result = await this.checkOtp(activationId, apiKey);
      if (result.status === "received" && result.sms_code) {
        clearInterval(timer);
        onReceived(result.sms_code);
      } else if (result.status === "cancelled" || result.status === "expired") {
        clearInterval(timer);
        onExpired();
      }
    }, interval);

    return () => clearInterval(timer);
  }

  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        console.error("[HeroSMS] Rate limit exceeded");
      } else if (error.response?.status === 400) {
        console.error("[HeroSMS] Bad request:", error.response.data);
      } else {
        console.error("[HeroSMS] API Error:", error.message);
      }
    } else {
      console.error("[HeroSMS] Unexpected error:", error);
    }
  }
}

export const heroSms = new HeroSmsProvider();
