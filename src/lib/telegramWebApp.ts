// Telegram Mini App (TMA) Official SDK Integration Layer
// Provides full types, haptic feedback, native back/main buttons, theme sync & authentication

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface TelegramMainButton {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => TelegramMainButton;
  onClick: (callback: () => void) => TelegramMainButton;
  offClick: (callback: () => void) => TelegramMainButton;
  show: () => TelegramMainButton;
  hide: () => TelegramMainButton;
  enable: () => TelegramMainButton;
  disable: () => TelegramMainButton;
  showProgress: (leaveActive?: boolean) => TelegramMainButton;
  hideProgress: () => TelegramMainButton;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => TelegramMainButton;
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

export interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (err: Error | null, stored?: boolean) => void) => void;
  getItem: (key: string, callback: (err: Error | null, value?: string) => void) => void;
  getItems: (keys: string[], callback: (err: Error | null, values?: Record<string, string>) => void) => void;
  removeItem: (key: string, callback?: (err: Error | null, removed?: boolean) => void) => void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    receiver?: TelegramUser;
    chat?: any;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string; // 'android' | 'ios' | 'tdesktop' | 'macos' | 'web' | 'unknown'
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
  HapticFeedback: TelegramHapticFeedback;
  CloudStorage?: TelegramCloudStorage;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
  showPopup: (
    params: {
      title?: string;
      message: string;
      buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }>;
    },
    callback?: (buttonId: string) => void
  ) => void;
  sendData: (data: string) => void;
  onEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
  offEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Check if the application is currently running inside Telegram Mini App
 */
export function isTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  const tg = window.Telegram?.WebApp;
  if (!tg) return false;
  // If initData is present or platform is not unknown
  return Boolean(tg.initData && tg.initData.length > 0) || (tg.platform !== 'unknown' && Boolean(tg.version));
}

/**
 * Access the Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Retrieve user info from Telegram WebApp
 */
export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

/**
 * Retrieve raw initData string
 */
export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
}

/**
 * Expand Telegram Mini App to full height and signal ready state
 */
export function expandTelegramApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.warn('Telegram expand failed:', e);
  }
}

/**
 * Sync header and background colors with current app theme
 */
export function syncTelegramTheme(isDark: boolean): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    tg.setHeaderColor?.(bgColor);
    tg.setBackgroundColor?.(bgColor);
  } catch (e) {
    console.warn('Telegram sync theme colors failed:', e);
  }
}

/**
 * Haptic feedback: Light impact (tab switch, button hover, chip click)
 */
export function hapticLight(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  } catch {}
}

/**
 * Haptic feedback: Medium impact (modal open, filter applied, card selected)
 */
export function hapticMedium(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  } catch {}
}

/**
 * Haptic feedback: Heavy impact (important action, primary checkout)
 */
export function hapticHeavy(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
  } catch {}
}

/**
 * Haptic feedback: Success notification (booking created, alert saved, card added)
 */
export function hapticSuccess(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
  } catch {}
}

/**
 * Haptic feedback: Error notification (booking cancelled, form invalid, network error)
 */
export function hapticError(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
  } catch {}
}

/**
 * Haptic feedback: Selection changed (stepper increment/decrement, radio button change)
 */
export function hapticSelection(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  } catch {}
}

/**
 * Prevent accidental swipe-to-close when user is filling a form (checkout, passport)
 */
export function enableClosingConfirmation(): void {
  try {
    window.Telegram?.WebApp?.enableClosingConfirmation?.();
  } catch {}
}

export function disableClosingConfirmation(): void {
  try {
    window.Telegram?.WebApp?.disableClosingConfirmation?.();
  } catch {}
}

/**
 * Native Telegram alert dialog
 */
export function telegramAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (tg?.showAlert) {
      tg.showAlert(message, () => resolve());
    } else {
      window.alert(message);
      resolve();
    }
  });
}

/**
 * Native Telegram confirm dialog
 */
export function telegramConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (tg?.showConfirm) {
      tg.showConfirm(message, (ok) => resolve(Boolean(ok)));
    } else {
      const ok = window.confirm(message);
      resolve(ok);
    }
  });
}
