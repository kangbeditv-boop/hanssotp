import { createHmac, randomBytes } from "crypto";

export function generateTotpSecret(): string {
  return randomBytes(20).toString("hex");
}

export function generateTotpCode(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(time));

  const hmac = createHmac("sha1", Buffer.from(secret, "hex")).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1000000;

  return code.toString().padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, window: number = 1): boolean {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(time));

    const hmac = createHmac("sha1", Buffer.from(secret, "hex")).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const generatedCode = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1000000;

    if (generatedCode.toString().padStart(6, "0") === code) {
      return true;
    }
  }

  return false;
}

export function getTotpQrUrl(secret: string, email: string, issuer: string = "HanssOTP"): string {
  const base32Secret = Buffer.from(secret, "hex").toString("base64").replace(/=/g, "");
  return `otpauth://totp/${issuer}:${email}?secret=${base32Secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
