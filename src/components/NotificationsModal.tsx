import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  CheckCircle2,
  Flame,
  PlaneTakeoff,
  Send,
  Trash2,
  X,
  Sparkles,
  Palmtree
} from '@/lib/flaticon-icons';
import { hapticLight, hapticSuccess, hapticSelection } from '../lib/telegramWebApp';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'discount' | 'flights' | 'system' | 'tours';
  categoryLabel: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Maldiv va Dubay turlariga 30% chegirmalar!',
    message: 'Ushbu haftada Maldiv va Dubay yo\'nalishlaridagi barcha lyuks mehmonxonalarga maxsus narxlar e\'lon qilindi.',
    time: '15 daqiqa oldin',
    category: 'discount',
    categoryLabel: 'Chegirma',
    isRead: false
  },
  {
    id: 'notif_2',
    title: 'Yangi yo\'nalish: Vetnam & Tailand charterlari',
    message: 'Fukuk va Pxuket orollariga to\'g\'ridan-to\'g\'ri qulay charter reyslar ochildi. Bron qilishga ulgurib qoling!',
    time: 'Bugun, 09:45',
    category: 'flights',
    categoryLabel: 'Parvozlar',
    isRead: false
  },
  {
    id: 'notif_3',
    title: 'Telegram Mini App integratsiyasi',
    message: '@sayrhub_bot orqali SayrHub to\'liq funksional Telegram Mini App tizimiga ulandi. Barcha buyurtmalaringiz bir joyda!',
    time: 'Kecha, 18:20',
    category: 'system',
    categoryLabel: 'Tizim',
    isRead: true
  },
  {
    id: 'notif_4',
    title: 'Antalya mavsumi: Erta band qilish',
    message: 'Turkiya sohillariga eng qulay All Inclusive paketlar va 5★ lyuks mehmonxonalar uchun erta bron ochildi.',
    time: '3 kun oldin',
    category: 'tours',
    categoryLabel: 'Tavsiya',
    isRead: true
  }
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    hapticSuccess();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticLight();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleRead = (id: string) => {
    hapticSelection();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'discount':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'flights':
        return <PlaneTakeoff className="w-4 h-4 text-sky-500" />;
      case 'system':
        return <Send className="w-4 h-4 text-primary" />;
      case 'tours':
      default:
        return <Palmtree className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-card text-card-foreground rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Bildirishnomalar</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[10px] font-black px-1.5 py-0 h-4">
                    {unreadCount} yangi
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Turpaketlar, narx signallari va tizim yangiliklari</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2 border-b border-border/60 bg-muted/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'discount', label: 'Chegirmalar' },
            { id: 'flights', label: 'Parvozlar' },
            { id: 'system', label: 'Tizim' },
            { id: 'tours', label: 'Tavsiyalar' }
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                hapticSelection();
                setActiveCategory(cat.id);
              }}
              className="rounded-xl text-xs h-7 px-2.5 shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">Bildirishnomalar mavjud emas</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Ushbu toifada yangi xabarlar yo‘q</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  item.isRead
                    ? 'border-border bg-card/60 hover:bg-muted/40'
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 h-4">
                          {item.categoryLabel}
                        </Badge>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground mt-1 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeNotification(item.id, e)}
                    className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-destructive shrink-0"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
          {unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="rounded-xl text-xs font-semibold gap-1.5 h-8"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Barchasini o'qilgan deb belgilash</span>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">Barcha xabarlar o'qilgan</span>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold h-8 px-4"
          >
            Yopish
          </Button>
        </div>
      </div>
    </div>
  );
};
