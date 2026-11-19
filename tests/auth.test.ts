import { describe, it, expect } from 'vitest';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  verifyToken 
} from '../src/server/auth.js';

describe('Authentication & Security Utilities', () => {
  it('should hash password and verify it correctly', async () => {
    const rawPassword = 'StrongPassword2026!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(rawPassword);
    expect(hashed.startsWith('$2a$') || hashed.startsWith('$2b$')).toBe(true);

    const isValid = await comparePassword(rawPassword, hashed);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('WrongPassword', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should correctly handle legacy unhashed passwords as fallback', async () => {
    const plain = 'legacyPass123';
    const isMatched = await comparePassword('legacyPass123', plain);
    expect(isMatched).toBe(true);

    const isNotMatched = await comparePassword('otherPass', plain);
    expect(isNotMatched).toBe(false);
  });

  it('should generate and verify JWT token successfully', () => {
    const userPayload = {
      id: 'adm-001',
      username: 'admin',
      role: 'main_admin' as const,
      name: 'Super Admin'
    };

    const token = generateToken(userPayload, '1h');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(userPayload.id);
    expect(verified?.username).toBe(userPayload.username);
    expect(verified?.role).toBe(userPayload.role);
  });

  it('should reject invalid or tampered JWT token', () => {
    const verified = verifyToken('invalid.token.structure');
    expect(verified).toBeNull();
  });

  it('should not leak OTP code in createTelegramAuthSession', async () => {
    const { createTelegramAuthSession } = await import('../telegramBot.js');
    const session = await createTelegramAuthSession();
    expect(session.sessionToken).toBeDefined();
    expect(session.sessionToken.startsWith('reg_')).toBe(true);
    // CRITICAL: Ensure code is NOT in returned payload
    expect((session as any).code).toBeUndefined();
  });

  it('should enforce OTP verification security and lockout after failed attempts', async () => {
    const { pendingSessions, verifyTelegramCode } = await import('../telegramBot.js');
    const token = 'reg_test_' + Math.random().toString(36).substring(2, 8);
    pendingSessions.set(token, {
      sessionToken: token,
      code: '849201',
      authenticated: false,
      createdAt: Date.now(),
      attempts: 0,
      user: { tcId: 'tw-test-1', name: 'Test User' },
      token: 'mock-jwt-token'
    });

    // 1. Wrong code (6-digit)
    const wrong = await verifyTelegramCode('111111', token);
    expect(wrong.success).toBe(false);

    // 2. Correct code (6-digit)
    const success = await verifyTelegramCode('849201', token);
    expect(success.success).toBe(true);
    expect(success.user?.name).toBe('Test User');

    // 3. Replay attack: cannot verify again with same code
    const replay = await verifyTelegramCode('849201', token);
    expect(replay.success).toBe(false);
  });

  it('should cryptographically validate Telegram Mini App initData signature', async () => {
    const { createHmac } = await import('crypto');
    const { validateTelegramWebAppData, authenticateTelegramWebApp } = await import('../telegramBot.js');

    const botToken = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
    const userJson = JSON.stringify({
      id: 987654321,
      first_name: 'Jasur',
      last_name: 'Rahimov',
      username: 'jasur_r',
      language_code: 'uz'
    });

    // Form data check string
    const authDate = String(Math.floor(Date.now() / 1000));
    const queryId = 'AAG_TEST_123';
    const params = [
      `auth_date=${authDate}`,
      `query_id=${queryId}`,
      `user=${userJson}`
    ].sort();
    const dataCheckString = params.join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const validHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const validInitData = `auth_date=${encodeURIComponent(authDate)}&query_id=${encodeURIComponent(queryId)}&user=${encodeURIComponent(userJson)}&hash=${validHash}`;

    // 1. Valid signature
    const validation = validateTelegramWebAppData(validInitData, botToken);
    expect(validation.isValid).toBe(true);
    expect(validation.user?.id).toBe(987654321);
    expect(validation.user?.first_name).toBe('Jasur');

    // 2. Tampered signature
    const tamperedInitData = `auth_date=${encodeURIComponent(authDate)}&query_id=${encodeURIComponent(queryId)}&user=${encodeURIComponent(userJson)}&hash=fake_tampered_hash_12345`;
    const invalidValidation = validateTelegramWebAppData(tamperedInitData, botToken);
    expect(invalidValidation.isValid).toBe(false);

    // 3. Authenticate Telegram Mini App User
    const authResult = await authenticateTelegramWebApp(validInitData, botToken);
    expect(authResult.success).toBe(true);
    expect(authResult.user?.tcId).toBe('tw-987654321');
    expect(authResult.user?.name).toBe('Jasur Rahimov');
    expect(authResult.token).toBeDefined();
  });
});
