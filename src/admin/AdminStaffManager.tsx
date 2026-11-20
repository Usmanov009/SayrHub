import React, { useState } from 'react';
import { AdminRole, AdminUser } from './adminTypes';
import { Briefcase, Crown, Shield, ShieldCheck } from '@/lib/flaticon-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AdminStaffManagerProps {
  currentRole: AdminRole;
  currentAdmin: AdminUser;
  staffList: AdminUser[];
  onAddStaff: (staff: AdminUser) => Promise<void>;
  onUpdateStaff: (staff: AdminUser) => Promise<void>;
  onRemoveStaff: (staffId: string) => Promise<void>;
  onResetStaffStats?: (staffId: string) => Promise<void>;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

const POPULAR_DESTINATIONS = ['Turkiya', 'BAA', 'Misr', 'Tailand', 'Gruziya', 'Maldiv', 'Vetnam', 'Xitoy'];

export const AdminStaffManager: React.FC<AdminStaffManagerProps> = ({
  currentRole,
  currentAdmin,
  staffList,
  onAddStaff,
  onUpdateStaff,
  onRemoveStaff,
  onResetStaffStats,
  onShowToast,
  globalSearch = ''
}) => {
  const isMainAdmin = currentRole === 'main_admin';
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 90 ');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['Turkiya']);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isMainAdmin) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-4 max-w-xl mx-auto my-8 shadow-2xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-3xl border border-amber-200/70 dark:border-amber-800/50">
          <Shield aria-hidden="true" className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Tur Adminlar Boshqaruvi Cheklangan</h3>
        <p className="text-sm text-muted-foreground">
          Yangi tur adminlarini ochish va o‘chirish faqat
          <b> <Crown aria-hidden="true" className="inline h-3.5 w-3.5" /> Bosh Admin (Yagona Super Admin)</b> vakolatiga kiradi.
        </p>
      </div>
    );
  }

  const generateRandomPassword = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let pass = 'tour';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const openNewStaffModal = () => {
    setName('');
    setUsername('');
    generateRandomPassword();
    setEmail('');
    setPhone('+998 90 ');
    setSelectedDestinations(['Turkiya']);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && (!username || username.startsWith('tur_'))) {
      setUsername(`tur_${clean.slice(0, 10)}`);
    }
  };

  const toggleDestination = (dest: string) => {
    if (selectedDestinations.includes(dest)) {
      setSelectedDestinations(selectedDestinations.filter(d => d !== dest));
    } else {
      setSelectedDestinations([...selectedDestinations, dest]);
    }
  };

  const copyCredentials = (staff: AdminUser) => {
    const loginVal = staff.username || staff.email.split('@')[0];
    const textToCopy = `SayrHub Tur Admin Paneli\nHavola: https://sayrhub.uz/admin\nLogin: ${loginVal}\nRol: Tur Admin (3% komissiya)\nYo'nalishlar: ${(staff.assignedDestinations || []).join(', ') || 'Barchasi'}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedId(staff.id);
        onShowToast(`"${staff.name}" xodimining login ma’lumoti nusxalandi.`, 'success');
        setTimeout(() => setCopiedId(null), 3000);
      }).catch(() => onShowToast('Login ma’lumotini nusxalab bo‘lmadi.', 'error'));
    } else {
      onShowToast(`Login: ${loginVal}`, 'info');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName || !cleanUser || !cleanPass) {
      onShowToast("Tur admin ismi, login va parolini to'liq kiriting!", 'error');
      return;
    }

    if (staffList.some(s => s.username?.toLowerCase() === cleanUser)) {
      onShowToast("Ushbu login bilan allaqachon admin mavjud! Boshqa login tanlang.", 'error');
      return;
    }

    const newStaff: AdminUser = {
      id: `adm-${Date.now()}`,
      name: cleanName,
      username: cleanUser,
      password: cleanPass,
      email: email.trim(),
      phone: phone.trim(),
      role: 'tour_admin', // Har doim tur_admin bo'ladi, Bosh admin faqat bitta
      roleTitle: 'Tur Admin',
      avatar: '',
      assignedDestinations: selectedDestinations,
      canManageUsers: false,
      canManageStaff: false,
      canDeleteTours: true,
      canEditFinancials: true,
      canManageBookings: true,
      canManageCatalog: true,
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: '',
      status: 'active'
    };

    try {
      await onAddStaff(newStaff);
      onShowToast(`Yangi tur admin "${cleanName}" muvaffaqiyatli ochildi! Login: "${cleanUser}".`, 'success');
      setIsModalOpen(false);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Admin xodimini saqlab bo‘lmadi.', 'error');
    }
  };

  const handleDeleteStaff = async (staff: AdminUser) => {
    if (staff.role === 'main_admin' || staff.id === 'adm-root') {
      onShowToast("Bosh adminni o'chirib bo'lmaydi! Tizimda faqat bitta bosh admin bo'lishi shart.", 'error');
      return;
    }

    if (confirm(`Rostdan ham "${staff.name}" (${staff.username}) tur adminini o'chirmoqchimisiz?\nUning kirish huquqi bekor qilinadi.`)) {
      try {
        await onRemoveStaff(staff.id);
        onShowToast(`"${staff.name}" tur admini tizimdan o'chirildi`, 'success');
      } catch (error) {
        onShowToast(error instanceof Error ? error.message : "Tur adminni o'chirib bo'lmadi.", 'error');
      }
    }
  };

  const handleResetStats = async (staff: AdminUser) => {
    if (!onResetStaffStats) {
      onShowToast('Statistikani nollash funksiyasi mavjud emas.', 'error');
      return;
    }
    if (!confirm(`"${staff.name}" tur kompaniyasining daromadi, sotilgan turlari va solig'ini 0 ga tushirmoqchimisiz?`)) {
      return;
    }
    try {
      await onResetStaffStats(staff.id);
      onShowToast(`"${staff.name}" statistikasi nollandi.`, 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Statistikani nollab bo‘lmadi.', 'error');
    }
  };

  const effectiveSearch = (search || globalSearch).trim().toLowerCase();

  const filteredStaff = staffList.filter(s =>
    !effectiveSearch ||
    s.name.toLowerCase().includes(effectiveSearch) ||
    (s.username && s.username.toLowerCase().includes(effectiveSearch)) ||
    (s.phone && s.phone.includes(effectiveSearch))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-indigo-600" />
            Tur Kompaniyalari (Tur Adminlar) ({staffList.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tur kompaniyalari profillari: daromad, sotilgan turlar, 2% soliq va boshqaruv
          </p>
        </div>

        <Button
          onClick={openNewStaffModal}
          className="h-10 gap-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Yangi Tur Admin Ochish</span>
        </Button>
      </div>

      {/* 2. Super Admin & 3% Rule Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start md:items-center gap-2.5">
          <Crown className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 md:mt-0" />
          <div className="space-y-0.5">
            <span className="font-bold">Yagona Bosh Admin qoidasi:</span>
            <p className="text-muted-foreground dark:text-amber-300/80">
              Tizimda faqat bitta Bosh Admin bo‘ladi. Tur kompaniyalari (tur adminlar) o‘z daromadidan 2% soliq to‘laydi va mijozlar shaxsiy ro‘yxatiga (users) kirish huquqiga ega bo‘lmaydi.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700">
          2% Soliq Tizimi
        </Badge>
      </div>

      {/* 3. Search */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">
            search
          </span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tur admin ismi, login yoki telefon..."
            className="pl-9 h-9 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. Staff Cards Grid */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-4 max-w-lg mx-auto my-6 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-3xl">
            <Briefcase aria-hidden="true" className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Tur Adminlar Topilmadi</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Qidiruv so‘rovi bo‘yicha tur admin topilmadi yoki hali yangi tur admin ochilmagan.
          </p>
          <Button onClick={openNewStaffModal} variant="outline" size="sm" className="gap-2">
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Yangi Tur Admin Ochish</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staff) => {
            const isMain = staff.role === 'main_admin';
            const displayUser = staff.username || staff.email.split('@')[0];

            return (
              <Card
                key={staff.id}
                className="p-5 rounded-2xl bg-card border-border space-y-4 shadow-2xs relative overflow-hidden transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {staff.avatar ? (
                      <img
                        src={staff.avatar}
                        alt=""
                        className="w-12 h-12 rounded-2xl object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center font-bold border border-border text-sm">
                        {staff.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        {staff.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{staff.phone || 'Telefon kiritilmagan'}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${
                          isMain
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50'
                        }`}
                      >
                        {isMain ? (
                          <>
                            <Crown aria-hidden="true" className="h-3 w-3" /> Bosh Admin (Yagona)
                          </>
                        ) : (
                          <>
                            <Briefcase aria-hidden="true" className="h-3 w-3" /> Tur kompaniyasi (2% soliq)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {!isMain && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStaff(staff)}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition"
                      title="Tur adminni o‘chirish"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  )}
                </div>

                {/* Assigned Destinations */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground block">
                    Biriktirilgan yo‘nalishlar:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {staff.assignedDestinations && staff.assignedDestinations.length > 0 ? (
                      staff.assignedDestinations.map(d => (
                        <Badge key={d} variant="outline" className="text-[10px] py-0 px-2 bg-muted/60">
                          {d}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Barcha yo‘nalishlar</span>
                    )}
                  </div>
                </div>

                {/* Financial stats (revenue, tours sold, 2% tax) */}
                {!isMain && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                      <p className="text-[9px] font-semibold text-muted-foreground">Daromad</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ${staff.revenue ?? 0}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50">
                      <p className="text-[9px] font-semibold text-muted-foreground">Sotilgan tur</p>
                      <p className="text-sm font-black text-sky-600 dark:text-sky-400 font-mono">
                        {staff.toursSold ?? 0}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                      <p className="text-[9px] font-semibold text-muted-foreground">Soliq ({staff.taxRate ?? 2}%)</p>
                      <p className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                        ${staff.tax ?? 0}
                      </p>
                    </div>
                  </div>
                )}

                {/* Login metadata */}
                <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-indigo-600 dark:text-indigo-400">key</span>
                      Kirish Ma‘lumotlari:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCredentials(staff)}
                      className="flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/70 hover:bg-indigo-200/80 transition"
                      title="Telegram uchun matnni nusxalash"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedId === staff.id ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedId === staff.id ? 'Nusxalandi!' : 'Loginni nusxalash'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-card px-2.5 py-1.5 rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Login:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold truncate block">
                        @{displayUser}
                      </span>
                    </div>

                    <div className="bg-card px-2.5 py-1.5 rounded-xl border border-border">
                      <span className="text-[10px] text-muted-foreground block font-medium">Parol:</span>
                      <span className="text-foreground font-mono font-bold truncate block">Himoyalangan</span>
                    </div>
                  </div>
                </div>

                {/* Card Action: Delete Button for Tour Admins */}
                {!isMain && (
                  <div className="pt-1 flex items-center justify-between border-t border-border gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Daromaddan 2% soliq
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetStats(staff)}
                        className="h-7 text-xs gap-1 px-2.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                        <span>Nollash</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 gap-1 px-2.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>O‘chirish</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: YANGI TUR ADMIN OCHISH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-indigo-600" />
                <span>Yangi Tur Adminini Ochish</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
              <p className="font-bold">Tur Admin huquqlari va shartlari:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground dark:text-indigo-300/80">
                <li>O‘z turlarini kiritish va o‘z buyurtmalarini boshqarish.</li>
                <li><b>O‘z daromadidan 2% soliq Bosh Adminga to‘lanadi</b> (98% sof foyda tur kompaniyasida qoladi).</li>
                <li><b>Mijozlar shaxsiy ro‘yxatiga (users) kirish huquqi yo‘q</b>.</li>
              </ul>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tur Admin Ismi & Familiyasi *
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Masalan: Jamshid Turayev"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Login (Username) *
                    </label>
                    <Input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tur_jamshid"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground block">
                        Parol *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        Generatsiya
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showModalPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showModalPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Telefon Raqami
                  </label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Email (Ixtiyoriy)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tur_admin@sayrhub.uz"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Mas‘ul Yo‘nalishlar (Destinations)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_DESTINATIONS.map((dest) => {
                      const isSelected = selectedDestinations.includes(dest);
                      return (
                        <button
                          key={dest}
                          type="button"
                          onClick={() => toggleDestination(dest)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                          }`}
                        >
                          {dest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Yangi Tur Adminini Ochish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
