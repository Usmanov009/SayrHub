import React, { useState } from 'react';
import { UserProfile, PaymentCard, LanguageCode, ThemeMode } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  CreditCard,
  Globe,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  Smartphone,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  FileText,
  Activity,
  Send,
  Zap,
  Lock,
  Headphones,
  Luggage,
  Heart
} from '@/lib/flaticon-icons';
import { hapticLight, hapticSelection } from '../lib/telegramWebApp';

interface ProfileScreenProps {
  user: UserProfile;
  cards: PaymentCard[];
  tripsCount: number;
  savedCount: number;
  alertsCount?: number;
  currentLang: LanguageCode;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  onOpenEditProfile: () => void;
  onEditPassport: () => void;
  onOpenAddCard: () => void;
  onSetPrimaryCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onSelectLang: (lang: LanguageCode) => void;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleNotifications: () => void;
  onOpenNotifications?: () => void;
  onOpenServerStatus?: () => void;
  onOpenPriceAlerts?: () => void;
  onOpenLogin?: () => void;
  onOpenAdmin?: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  cards,
  tripsCount,
  savedCount,
  alertsCount = 0,
  currentLang,
  themeMode,
  notificationsEnabled,
  onOpenEditProfile,
  onEditPassport,
  onOpenAddCard,
  onSetPrimaryCard,
  onDeleteCard,
  onSelectLang,
  onSelectTheme,
  onToggleNotifications,
  onOpenNotifications,
  onOpenServerStatus,
  onOpenPriceAlerts,
  onOpenLogin,
  onOpenAdmin,
  onOpenSupport,
  onLogout,
  onShowToast
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'SH';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const isLoggedIn = Boolean(user.tcId);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24 select-none">
      {/* 1. User Info Card or Logged-Out Prompt */}
      {isLoggedIn ? (
        <Card className="border-border bg-card shadow-xs relative overflow-hidden p-5">
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Avatar className="w-16 h-16 rounded-2xl border-2 border-primary/20 shadow-sm">
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-black text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="default" className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0 h-4 uppercase shadow-xs">
                PRO
              </Badge>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <h2 className="text-base sm:text-lg font-bold truncate text-foreground" id="profile-display-name">
                    {user.name || 'SayrHub Mijoz'}
                  </h2>
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenEditProfile}
                  className="rounded-xl text-xs font-semibold h-7 px-2.5 cursor-pointer"
                >
                  Tahrirlash
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-1 min-w-0">
                <span className="text-xs text-muted-foreground truncate" id="profile-display-phone">
                  {user.phone || "Telefon kiritilmagan"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/80 shrink-0">
                  ID: #{user.tcId}
                </span>
              </div>

              {user.telegramUsername && (
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#229ED9] font-medium truncate">
                  <Send className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.telegramUsername}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Identifikatsiyadan o'tgan mijoz</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Mobile Parity) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-border text-center">
            <div className="rounded-xl p-2.5 bg-muted/40 border border-border/80 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium truncate">Buyurtmalar</p>
              <p className="text-sm font-bold text-foreground mt-0.5 truncate">{tripsCount} ta</p>
            </div>
            <div className="rounded-xl p-2.5 bg-muted/40 border border-border/80 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium truncate">Saqlangan</p>
              <p className="text-sm font-bold text-foreground mt-0.5 truncate">{savedCount} ta</p>
            </div>
            <div
              className="rounded-xl p-2.5 bg-muted/40 border border-border/80 cursor-pointer hover:bg-muted/70 transition-colors min-w-0"
              onClick={onOpenPriceAlerts}
            >
              <p className="text-[11px] text-muted-foreground font-medium truncate">Signallar</p>
              <p className="text-sm font-bold text-primary mt-0.5 truncate">{alertsCount} ta</p>
            </div>
            <div
              className="rounded-xl p-2.5 bg-muted/40 border border-border/80 cursor-pointer hover:bg-muted/70 transition-colors min-w-0"
              onClick={() => onShowToast(`Keshbek miqdori: $${user.cashback}. Keyingi bron qilish uchun amal qiladi!`, 'success')}
            >
              <p className="text-[11px] text-muted-foreground font-medium truncate">Keshbek</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">${user.cashback}</p>
            </div>
          </div>
        </Card>
      ) : (
        /* Logged Out View matching Flutter App */
        <Card className="border-border bg-card shadow-xs p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/20">
            <Send className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">SayrHub hisobiga kirish</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Barcha xizmatlar, turlarni bron qilish, buyurtmalarni kuzatish va vaucherlarni olish uchun hisobingizga kiring.
            </p>
          </div>

          <Button
            size="lg"
            onClick={onOpenLogin}
            className="w-full max-w-sm mx-auto rounded-2xl h-12 gap-2 text-sm font-bold bg-gradient-to-r from-[#229ED9] to-[#1B77B7] hover:from-[#1e8ec3] hover:to-[#176ba5] text-white shadow-md shadow-[#229ED9]/25 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Log in (Telegram orqali)</span>
          </Button>

          <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Rasmiy bot: @sayrhub_bot</span>
          </p>
        </Card>
      )}

      {/* 2. THEME MODE SELECTOR */}
      <Card className="border-border bg-card shadow-xs p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ilova Rejimi (Theme Mode)
            </h3>
          </div>
          <Badge variant="secondary" className="text-[10px] font-semibold text-primary">
            {themeMode === 'light' ? 'Kunduzgi rejim faol' : 'Tungi rejim faol'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            variant={themeMode === 'light' ? 'default' : 'outline'}
            id="btn-theme-light-mode"
            onClick={() => {
              hapticSelection();
              onSelectTheme('light');
            }}
            className="justify-between h-auto p-3.5 rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold">Kunduzgi rejim (Light)</p>
                <p className="text-[10px] text-muted-foreground font-normal">Yorug' va qulay interfeys</p>
              </div>
            </div>
            {themeMode === 'light' && <CheckCircle2 className="w-4 h-4" />}
          </Button>

          <Button
            variant={themeMode === 'dark' ? 'default' : 'outline'}
            id="btn-theme-dark-mode"
            onClick={() => {
              hapticSelection();
              onSelectTheme('dark');
            }}
            className="justify-between h-auto p-3.5 rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Moon className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs font-bold">Tungi rejim (Dark)</p>
                <p className="text-[10px] text-muted-foreground font-normal">Ko'zga yoqimli to'q palitra</p>
              </div>
            </div>
            {themeMode === 'dark' && <CheckCircle2 className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {/* 3. Travel Documents (Zagran Pasport) */}
      <Card className="border-border bg-card shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Sayohatchi Hujjatlari
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            {user.passportNumber ? 'Saqlangan' : 'Kiritilmagan'}
          </Badge>
        </div>

        <div className="rounded-xl p-3.5 bg-muted/40 border border-border/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">
              Xorijga chiqish pasporti (Zagran)
            </p>
            <p className="text-xs font-mono tracking-wider text-muted-foreground" id="passport-number-text">
              {user.passportNumber || 'AA •••••••'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Amal qilish muddati: <span className="font-semibold text-foreground">{user.passportExpiry || '—'}</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditPassport}
            className="rounded-xl text-xs font-semibold h-8 cursor-pointer"
          >
            {user.passportNumber ? 'Yangilash' : 'Kiritish'}
          </Button>
        </div>
      </Card>

      {/* 4. Payment Cards Section */}
      <Card className="border-border bg-card shadow-xs p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Mening To'lov Kartalarim
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {cards.length} ta karta
          </span>
        </div>

        <div className="space-y-2" id="payment-cards-list">
          {cards.map((card) => {
            const isHumo = card.type === 'HUMO';
            const isVisa = card.type === 'VISA';
            const badgeGradient = isHumo
              ? 'from-emerald-600 to-teal-700'
              : isVisa
              ? 'from-sky-600 to-blue-700'
              : 'from-purple-600 to-indigo-700';

            return (
              <div
                key={card.id}
                className={`rounded-xl p-3 border flex items-center justify-between transition-colors ${
                  card.isPrimary ? 'border-primary bg-primary/5' : 'border-border bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-7 bg-gradient-to-r ${badgeGradient} rounded-md flex items-center justify-center text-[9px] font-black text-white tracking-widest shadow-xs`}>
                    {card.type}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold font-mono text-foreground">
                        •••• {card.last4}
                      </p>
                      {card.isPrimary && (
                        <Badge variant="default" className="text-[8px] font-extrabold px-1.5 py-0 h-4">
                          Asosiy
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{card.bank}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!card.isPrimary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetPrimaryCard(card.id)}
                      className="rounded-lg text-[10px] font-semibold h-7 px-2 cursor-pointer"
                    >
                      Tanlash
                    </Button>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteCard(card.id)}
                    className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 cursor-pointer"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddCard}
          className="w-full border-dashed rounded-xl h-10 gap-2 text-xs font-semibold text-primary hover:text-primary cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi to'lov kartasi qo'shish</span>
        </Button>
      </Card>

      {/* 5. Language Selector */}
      <Card className="border-border bg-card shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ilova Tili (Language)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentLang === 'UZ' ? "O'zbek tili" : currentLang === 'RU' ? 'Русский язык' : 'English'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { code: 'UZ' as LanguageCode, label: "O'zbek tili" },
            { code: 'RU' as LanguageCode, label: 'Русский' },
            { code: 'EN' as LanguageCode, label: 'English' }
          ].map((item) => {
            const isSelected = currentLang === item.code;
            return (
              <Button
                key={item.code}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  hapticSelection();
                  onSelectLang(item.code);
                }}
                className="justify-between rounded-xl h-10 px-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* 6. System, Diagnostics, Notifications & Support (Mobile Parity) */}
      <Card className="border-border bg-card shadow-xs p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Tizim va Xizmatlar
        </h3>

        <div className="space-y-2">
          {/* Server Status Monitor (Exact Mobile Parity) */}
          <Button
            variant="outline"
            onClick={onOpenServerStatus}
            className="w-full justify-between rounded-xl h-12 px-3.5 cursor-pointer bg-muted/40 border-border/80"
          >
            <div className="flex items-center gap-3 text-left min-w-0 flex-1 mr-2">
              <Activity className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Server & MongoDB Ulanishi</p>
                <p className="text-[10px] text-muted-foreground font-normal truncate">Jonli integratsiya va server holati monitori</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                Online
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Button>

          {/* Notifications Modal & Toggle */}
          <div className="rounded-xl p-3 bg-muted/40 border border-border/80 flex items-center justify-between">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 mr-2 cursor-pointer"
              onClick={onOpenNotifications}
            >
              <Bell className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  Bildirishnomalar
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Barcha xabarnomalar va tur yangiliklari
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={notificationsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleNotifications}
                className="rounded-xl text-xs h-7 px-2.5 cursor-pointer"
              >
                {notificationsEnabled ? 'Yoqilgan' : "O'chiq"}
              </Button>
            </div>
          </div>

          {/* Telegram Official Bot & Helpdesk */}
          <a
            href="https://t.me/sayrhub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl h-12 px-3.5 cursor-pointer bg-muted/40 border-border/80"
            >
              <div className="flex items-center gap-3 text-left min-w-0 flex-1 mr-2">
                <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">Telegram Operator & Bot</p>
                  <p className="text-[10px] text-muted-foreground font-normal truncate">@sayrhub_bot • Tezkor yordam</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Button>
          </a>

          {/* Admin Mode Shortcut (Accessible if role allows or for test) */}
          {onOpenAdmin && (
            <Button
              variant="outline"
              onClick={onOpenAdmin}
              className="w-full justify-between rounded-xl h-12 px-3.5 cursor-pointer bg-muted/40 border-border/80"
            >
              <div className="flex items-center gap-3 text-left">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Boshqaruv Paneli (Admin Mode)</p>
                  <p className="text-[10px] text-muted-foreground font-normal">Buyurtmalar, xodimlar, narx ustamasi va statistika</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}

          {/* App Version Info */}
          <div className="rounded-xl p-3 bg-muted/40 border border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">SayrHub Mini App Edition</p>
                <p className="text-[10px] text-muted-foreground">Telegram TMA & Web • 1:1 Kompas Engine</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              {user.tcId ? `ID: #${user.tcId}` : 'Mehmon'}
            </Badge>
          </div>

          {/* Logout Button */}
          {isLoggedIn && (
            <Button
              variant="destructive"
              onClick={onLogout}
              className="w-full rounded-xl h-10 gap-2 text-xs font-bold mt-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Hisobdan chiqish</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
