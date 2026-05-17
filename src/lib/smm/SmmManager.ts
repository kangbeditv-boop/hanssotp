import axios, { AxiosInstance } from "axios";

export interface SmmServiceItem {
  id: string;
  name: string;
  rate: number;
  min: number;
  max: number;
  category: string;
}

export interface SmmOrderResult {
  orderId: string;
}

export interface SmmOrderStatus {
  status: string;
  remains: number;
  charge: number;
}

export abstract class BaseSmmProvider {
  protected client: AxiosInstance;
  protected apiKey: string;
  public name: string;
  public slug: string;

  constructor(name: string, slug: string, url: string, apiKey: string) {
    this.name = name;
    this.slug = slug;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: url,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });
  }

  abstract addOrder(service: string, link: string, quantity: number): Promise<SmmOrderResult | null>;
  abstract getOrderStatus(orderId: string): Promise<SmmOrderStatus | null>;
  abstract getServices(): Promise<SmmServiceItem[]>;
  abstract getBalance(): Promise<number>;
}

export class GenericSmmProvider extends BaseSmmProvider {
  async addOrder(service: string, link: string, quantity: number): Promise<SmmOrderResult | null> {
    try {
      const { data } = await this.client.post("", {
        key: this.apiKey,
        action: "add",
        service,
        link,
        quantity,
      });
      if (data.order) {
        return { orderId: String(data.order) };
      }
      return null;
    } catch (error) {
      console.error(`[SMM:${this.name}] addOrder error:`, error);
      return null;
    }
  }

  async getOrderStatus(orderId: string): Promise<SmmOrderStatus | null> {
    try {
      const { data } = await this.client.post("", {
        key: this.apiKey,
        action: "status",
        order: orderId,
      });
      return {
        status: data.status || "unknown",
        remains: Number(data.remains || 0),
        charge: Number(data.charge || 0),
      };
    } catch (error) {
      console.error(`[SMM:${this.name}] getOrderStatus error:`, error);
      return null;
    }
  }

  async getServices(): Promise<SmmServiceItem[]> {
    try {
      const { data } = await this.client.post("", {
        key: this.apiKey,
        action: "services",
      });
      if (Array.isArray(data)) {
        return data.map((s: Record<string, string | number>) => ({
          id: String(s.service),
          name: String(s.name),
          rate: Number(s.rate),
          min: Number(s.min),
          max: Number(s.max),
          category: String(s.category),
        }));
      }
      return [];
    } catch (error) {
      console.error(`[SMM:${this.name}] getServices error:`, error);
      return [];
    }
  }

  async getBalance(): Promise<number> {
    try {
      const { data } = await this.client.post("", {
        key: this.apiKey,
        action: "balance",
      });
      return Number(data.balance || 0);
    } catch (error) {
      console.error(`[SMM:${this.name}] getBalance error:`, error);
      return 0;
    }
  }
}

export class PerfectPanel extends GenericSmmProvider {
  constructor(url: string, apiKey: string) {
    super("PerfectPanel", "perfectpanel", url, apiKey);
  }
}

export class JustAnotherPanel extends GenericSmmProvider {
  constructor(url: string, apiKey: string) {
    super("JustAnotherPanel", "justanotherpanel", url, apiKey);
  }
}

export class SMMHeaven extends GenericSmmProvider {
  constructor(url: string, apiKey: string) {
    super("SMMHeaven", "smmheaven", url, apiKey);
  }
}

export class SmmManager {
  private providers: Map<string, BaseSmmProvider> = new Map();

  addProvider(provider: BaseSmmProvider) {
    this.providers.set(provider.slug, provider);
  }

  removeProvider(slug: string) {
    this.providers.delete(slug);
  }

  getProvider(slug: string): BaseSmmProvider | undefined {
    return this.providers.get(slug);
  }

  getAllProviders(): BaseSmmProvider[] {
    return Array.from(this.providers.values());
  }

  async addOrder(providerSlug: string, service: string, link: string, quantity: number): Promise<SmmOrderResult | null> {
    const provider = this.getProvider(providerSlug);
    if (!provider) return null;
    return provider.addOrder(service, link, quantity);
  }

  async getOrderStatus(providerSlug: string, orderId: string): Promise<SmmOrderStatus | null> {
    const provider = this.getProvider(providerSlug);
    if (!provider) return null;
    return provider.getOrderStatus(orderId);
  }
}

export const smmManager = new SmmManager();
