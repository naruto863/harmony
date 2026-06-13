import { requireDemoMode } from "@/lib/demoMode";

export interface TwoFactorSettings {
  enabled: boolean;
  secret?: string;
  recoveryCodes?: string[];
  enabledAt?: string;
}

const DEMO_TOTP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const generateDemoTotpSecret = (): string => {
  return Array.from({ length: 16 }, () =>
    DEMO_TOTP_ALPHABET[Math.floor(Math.random() * DEMO_TOTP_ALPHABET.length)]
  ).join('');
};

const TWO_FACTOR_SETTINGS: Record<string, TwoFactorSettings> = {
  user_admin: {
    enabled: false,
  },
};

export const getTwoFactorSettings = async (userId: string): Promise<TwoFactorSettings> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 100));
  return TWO_FACTOR_SETTINGS[userId] || { enabled: false };
};

export const generateTwoFactorSecret = async (userId: string): Promise<{ secret: string; qrCode: string }> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 300));

  const secret = generateDemoTotpSecret();
  const qrCode = `otpauth://totp/AdminStudio:${userId}?secret=${secret}&issuer=AdminStudio`;

  return { secret, qrCode };
};

export const verifyTwoFactorCode = async (userId: string, code: string): Promise<boolean> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 300));

  return code === '123456' || code === '000000';
};

export const enableTwoFactor = async (userId: string, code: string): Promise<{ success: boolean; recoveryCodes?: string[] }> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 300));

  const isValid = await verifyTwoFactorCode(userId, code);

  if (!isValid) {
    return { success: false };
  }

  const recoveryCodes = createRecoveryCodes();

  TWO_FACTOR_SETTINGS[userId] = {
    enabled: true,
    secret: generateDemoTotpSecret(),
    recoveryCodes,
    enabledAt: new Date().toISOString(),
  };

  return { success: true, recoveryCodes };
};

export const disableTwoFactor = async (userId: string, code: string): Promise<boolean> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 300));

  const isValid = await verifyTwoFactorCode(userId, code);

  if (!isValid) {
    return false;
  }

  TWO_FACTOR_SETTINGS[userId] = { enabled: false };

  return true;
};

export const regenerateRecoveryCodes = async (userId: string): Promise<string[]> => {
  requireDemoMode('securityService.twoFactor');
  await new Promise(resolve => setTimeout(resolve, 300));

  const recoveryCodes = createRecoveryCodes();

  if (TWO_FACTOR_SETTINGS[userId]) {
    TWO_FACTOR_SETTINGS[userId].recoveryCodes = recoveryCodes;
  }

  return recoveryCodes;
};

const createRecoveryCodes = () => {
  return Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
};
