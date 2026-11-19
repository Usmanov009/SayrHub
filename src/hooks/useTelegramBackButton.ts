import { useEffect } from 'react';
import { getTelegramWebApp, hapticLight } from '../lib/telegramWebApp';

/**
 * Hook to bind a callback to Telegram Mini App's native BackButton.
 * Automatically shows the back button when isVisible is true,
 * and hides it when isVisible becomes false or component unmounts.
 */
export function useTelegramBackButton(isVisible: boolean, onBack: () => void) {
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg || !tg.BackButton) return;

    const handleClick = () => {
      hapticLight();
      onBack();
    };

    if (isVisible) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleClick);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleClick);
      if (!isVisible) {
        tg.BackButton.hide();
      }
    };
  }, [isVisible, onBack]);
}
