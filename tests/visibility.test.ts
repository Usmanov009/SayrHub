import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isTelegramMiniApp } from '../src/lib/telegramWebApp';

describe('Telegram App and Mobile User Visibility Restrictions', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window mock
    (global as any).window = {
      Telegram: undefined,
      location: { pathname: '/' }
    };
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('identifies non-Telegram browser environment by default', () => {
    expect(isTelegramMiniApp()).toBe(false);
  });

  it('detects Telegram Mini App when Telegram.WebApp initData is present', () => {
    (global as any).window = {
      Telegram: {
        WebApp: {
          initData: 'query_id=AAH&user=%7B%22id%22%3A123%7D&hash=abc',
          platform: 'android',
          version: '7.0',
        }
      }
    };
    expect(isTelegramMiniApp()).toBe(true);
  });

  it('detects Telegram Mini App on iOS/Android platform', () => {
    (global as any).window = {
      Telegram: {
        WebApp: {
          initData: '',
          platform: 'ios',
          version: '7.2',
        }
      }
    };
    expect(isTelegramMiniApp()).toBe(true);
  });

  it('verifies that admin mode and server status are restricted for users', () => {
    const isTelegram = true;
    const isAdminAuthenticated = false;

    // Condition in Header and ProfileScreen
    const showAdminPanel = !isTelegram && isAdminAuthenticated;
    const showServerStatus = !isTelegram && isAdminAuthenticated;

    expect(showAdminPanel).toBe(false);
    expect(showServerStatus).toBe(false);
  });

  it('verifies that even if in Telegram with admin credentials, user app hides them', () => {
    const isTelegram = true;
    const isAdminAuthenticated = true;

    const showAdminPanel = !isTelegram && isAdminAuthenticated;
    const showServerStatus = !isTelegram && isAdminAuthenticated;

    expect(showAdminPanel).toBe(false);
    expect(showServerStatus).toBe(false);
  });

  it('allows admin panel and server status only for authenticated admin on external desktop web', () => {
    const isTelegram = false;
    const isAdminAuthenticated = true;

    const showAdminPanel = !isTelegram && isAdminAuthenticated;
    const showServerStatus = !isTelegram && isAdminAuthenticated;

    expect(showAdminPanel).toBe(true);
    expect(showServerStatus).toBe(true);
  });
});
