import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hanssotp.com" },
    update: {},
    create: {
      email: "admin@hanssotp.com",
      name: "Admin HanssOTP",
      password: adminPassword,
      role: "SUPERADMIN",
      emailVerified: new Date(),
      referralCode: "ADMIN001",
      wallet: { create: { balance: 10000000 } },
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create test user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@hanssotp.com" },
    update: {},
    create: {
      email: "user@hanssotp.com",
      name: "Test User",
      password: userPassword,
      role: "USER",
      emailVerified: new Date(),
      referralCode: "USER001",
      wallet: { create: { balance: 500000 } },
    },
  });
  console.log(`Created user: ${user.email}`);

  // Create reseller
  const resellerPassword = await bcrypt.hash("reseller123", 12);
  const reseller = await prisma.user.upsert({
    where: { email: "reseller@hanssotp.com" },
    update: {},
    create: {
      email: "reseller@hanssotp.com",
      name: "Test Reseller",
      password: resellerPassword,
      role: "RESELLER",
      emailVerified: new Date(),
      referralCode: "RESELL01",
      wallet: { create: { balance: 2000000 } },
    },
  });
  console.log(`Created reseller: ${reseller.email}`);

  // Create SMS provider
  await prisma.smsProvider.upsert({
    where: { id: "hero-sms" },
    update: {},
    create: {
      id: "hero-sms",
      name: "HeroSMS",
      slug: "hero-sms",
      baseUrl: "https://hero-sms.com/api/v1",
      apiKey: "your-api-key-here",
      isActive: true,
      markupPercent: 15,
    },
  });
  console.log("Created SMS provider: HeroSMS");

  // Create SMM provider
  const smmProvider = await prisma.smmProvider.upsert({
    where: { id: "perfect-panel" },
    update: {},
    create: {
      id: "perfect-panel",
      name: "PerfectPanel",
      slug: "perfect-panel",
      url: "https://perfectpanel.com/api/v2",
      apiKey: "your-api-key-here",
      isActive: true,
      markupPercent: 10,
    },
  });
  console.log("Created SMM provider: PerfectPanel");

  // Create SMM services
  const smmServices = [
    { name: "Instagram Followers", category: "Instagram", rate: 50, minQty: 100, maxQty: 100000 },
    { name: "Instagram Likes", category: "Instagram", rate: 30, minQty: 50, maxQty: 50000 },
    { name: "TikTok Followers", category: "TikTok", rate: 60, minQty: 100, maxQty: 50000 },
    { name: "TikTok Likes", category: "TikTok", rate: 25, minQty: 50, maxQty: 100000 },
    { name: "YouTube Views", category: "YouTube", rate: 80, minQty: 500, maxQty: 1000000 },
    { name: "YouTube Subscribers", category: "YouTube", rate: 150, minQty: 100, maxQty: 50000 },
    { name: "Twitter Followers", category: "Twitter", rate: 70, minQty: 100, maxQty: 50000 },
    { name: "Facebook Page Likes", category: "Facebook", rate: 40, minQty: 100, maxQty: 100000 },
  ];

  for (const svc of smmServices) {
    await prisma.smmService.upsert({
      where: { id: `${smmProvider.id}-${svc.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `${smmProvider.id}-${svc.name.toLowerCase().replace(/\s+/g, "-")}`,
        providerId: smmProvider.id,
        externalId: Math.random().toString(36).slice(2, 8),
        name: svc.name,
        category: svc.category,
        rate: svc.rate,
        minQty: svc.minQty,
        maxQty: svc.maxQty,
        isActive: true,
      },
    });
  }
  console.log(`Created ${smmServices.length} SMM services`);

  // Create reseller tiers
  const tiers = [
    { name: "Reguler", minBalance: 0, discountPercent: 0 },
    { name: "Silver", minBalance: 100000, discountPercent: 5 },
    { name: "Gold", minBalance: 500000, discountPercent: 10 },
    { name: "Platinum", minBalance: 2000000, discountPercent: 15 },
    { name: "VIP Reseller", minBalance: 0, discountPercent: 20 },
  ];

  for (const tier of tiers) {
    await prisma.resellerTier.upsert({
      where: { id: tier.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: tier.name.toLowerCase().replace(/\s+/g, "-"),
        name: tier.name,
        minBalance: tier.minBalance,
        discountPercent: tier.discountPercent,
        markupReduction: 0,
      },
    });
  }
  console.log(`Created ${tiers.length} reseller tiers`);

  // Create default settings
  const defaultSettings = [
    { key: "siteName", value: "HanssOTP" },
    { key: "siteDescription", value: "Platform Jasa OTP & Virtual Number" },
    { key: "maintenanceMode", value: "false" },
    { key: "registrationEnabled", value: "true" },
    { key: "defaultMarkup", value: "15" },
    { key: "minTopup", value: "50000" },
    { key: "maxTopup", value: "10000000" },
    { key: "otpTimeout", value: "300" },
    { key: "pollingInterval", value: "5" },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`Created ${defaultSettings.length} default settings`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
