import React, { useState } from 'react';
import { GroupTour } from '../types';
import { AdminRole, AdminUser } from './adminTypes';
import { Map } from '@/lib/flaticon-icons';

interface AdminGroupToursManagerProps {
  currentRole: AdminRole;
  currentAdmin: AdminUser;
  groupTours: GroupTour[];
  onAddGroupTour: (group: GroupTour) => Promise<void>;
  onUpdateGroupTour: (group: GroupTour) => Promise<void>;
  onDeleteGroupTour: (groupId: string) => Promise<void>;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch?: string;
}

const emptyForm = {
  title: '',
  destination: '',
  country: '',
  departureCity: '',
  departureDate: '',
  nights: 7,
  price: 0,
  totalSeats: 10,
  img: '',
  description: '',
  status: 'open' as GroupTour['status'],
};

export const AdminGroupToursManager: React.FC<AdminGroupToursManagerProps> = ({
  currentRole,
  currentAdmin,
  groupTours,
  onAddGroupTour,
  onUpdateGroupTour,
  onDeleteGroupTour,
  onShowToast,
  globalSearch = '',
}) => {
  const isMainAdmin = currentRole === 'main_admin';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupTour | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAddModal = () => {
    setEditingGroup(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (group: GroupTour) => {
    setEditingGroup(group);
    setForm({
      title: group.title,
      destination: group.destination,
      country: group.country,
      departureCity: group.departureCity,
      departureDate: group.departureDate,
      nights: group.nights,
      price: group.price,
      totalSeats: group.totalSeats,
      img: group.img,
      description: group.description,
      status: group.status,
    });
    setIsModalOpen(true);
  };

  const updateForm = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.destination.trim() || !form.departureCity.trim() || !form.departureDate) {
      onShowToast('Guruh sayohati uchun majburiy maydonlarni to‘ldiring.', 'error');
      return;
    }
    if (form.price <= 0 || form.totalSeats <= 0) {
      onShowToast('Narx va o‘rinlar soni 0 dan katta bo‘lishi kerak.', 'error');
      return;
    }

    try {
      if (editingGroup) {
        const updated: GroupTour = {
          ...editingGroup,
          title: form.title.trim(),
          destination: form.destination.trim(),
          country: form.country.trim() || form.destination.trim(),
          departureCity: form.departureCity.trim(),
          departureDate: form.departureDate,
          nights: Number(form.nights),
          price: Number(form.price),
          totalSeats: Number(form.totalSeats),
          availableSeats: Math.min(Number(form.totalSeats), Math.max(0, editingGroup.availableSeats)),
          img: form.img,
          description: form.description,
          status: form.status,
        };
        await onUpdateGroupTour(updated);
        onShowToast(`"${form.title}" guruh sayohati yangilandi!`, 'success');
      } else {
        const newGroup: GroupTour = {
          id: `group-${Date.now()}`,
          title: form.title.trim(),
          destination: form.destination.trim(),
          country: form.country.trim() || form.destination.trim(),
          departureCity: form.departureCity.trim(),
          departureDate: form.departureDate,
          nights: Number(form.nights),
          price: Number(form.price),
          totalSeats: Number(form.totalSeats),
          availableSeats: Number(form.totalSeats),
          img: form.img,
          description: form.description,
          status: form.status,
          adminId: currentAdmin?.id,
          adminUsername: currentAdmin?.username,
          adminName: currentAdmin?.name,
          createdAt: new Date().toISOString(),
        };
        await onAddGroupTour(newGroup);
        onShowToast(`Yangi "${form.title}" guruh sayohati qo'shildi!`, 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Guruh sayohatini saqlab bo‘lmadi.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!isMainAdmin && !currentAdmin.canDeleteTours) {
      onShowToast("Guruh sayohatini o'chirish faqat Bosh Admin huquqida!", 'error');
      return;
    }
    if (confirm(`"${title}" guruh sayohatini o'chirmoqchimisiz?`)) {
      try {
        await onDeleteGroupTour(id);
        onShowToast(`"${title}" o'chirildi!`, 'info');
      } catch (error) {
        onShowToast(error instanceof Error ? error.message : 'Guruh sayohatini o‘chirib bo‘lmadi.', 'error');
      }
    }
  };

  const effectiveSearch = (search || globalSearch).trim().toLowerCase();
  const filtered = groupTours.filter(
    (g) =>
      !effectiveSearch ||
      g.title.toLowerCase().includes(effectiveSearch) ||
      g.destination.toLowerCase().includes(effectiveSearch) ||
      g.country.toLowerCase().includes(effectiveSearch)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Map aria-hidden="true" className="h-4 w-4" /> Guruh Sayohati Boshqaruvi ({groupTours.length})
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Oddiy foydalanuvchilar yozilishi mumkin bo‘lgan guruh turlari
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all shrink-0 tap-bounce"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Yangi Guruh Sayohati</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nomi yoki yo‘nalish bo'yicha..."
            className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-slate-400 pl-9 pr-7 py-2 rounded-xl text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-zinc-200/90 dark:border-zinc-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-400 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 pl-5">Guruh Sayohati</th>
                <th className="py-3.5 px-3">Yo‘nalish</th>
                <th className="py-3.5 px-3">Sana</th>
                <th className="py-3.5 px-3">O‘rinlar</th>
                <th className="py-3.5 px-3">Narx (USD)</th>
                <th className="py-3.5 px-3">Holat</th>
                <th className="py-3.5 pr-5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-zinc-800 dark:text-zinc-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400">
                    Guruh sayohatlari topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const seatsLeft = Math.max(0, g.availableSeats);
                  return (
                    <tr key={g.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          {g.img ? (
                            <img
                              src={g.img}
                              alt={g.title}
                              className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px] text-zinc-400">groups</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 dark:text-white text-xs truncate max-w-[200px]">{g.title}</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                              {g.destination} · {g.nights} kecha
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs font-semibold max-w-[180px] leading-relaxed">{g.destination}</p>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{g.departureCity}</span>
                      </td>
                      <td className="py-3.5 px-3 text-xs font-medium">{g.departureDate}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {seatsLeft}/{g.totalSeats}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">${g.price}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            g.status === 'open'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                          }`}
                        >
                          {g.status === 'open' ? 'Ochiq' : 'Yopiq'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(g)}
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-600 dark:text-zinc-300 transition-colors"
                            title="Tahrirlash"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(g.id, g.title)}
                            className={`p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 transition-colors ${
                              isMainAdmin ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-300 cursor-not-allowed'
                            }`}
                            title={isMainAdmin ? "O'chirish" : "Faqat Bosh Admin huquqida"}
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Map aria-hidden="true" className="h-4 w-4" />
                <span>{editingGroup ? 'Guruh Sayohatini Tahrirlash' : "Yangi Guruh Sayohati Qo'shish"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Guruh Sayohati Nomi *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="Masalan: Turkiya guruh sayohati (8 kun)"
                    className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Yo‘nalish / Davlat *</label>
                    <input
                      type="text"
                      required
                      value={form.destination}
                      onChange={(e) => updateForm('destination', e.target.value)}
                      placeholder="Turkiya"
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Mamlakat</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => updateForm('country', e.target.value)}
                      placeholder="Turkiya"
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Jo‘nash shahri *</label>
                    <input
                      type="text"
                      required
                      value={form.departureCity}
                      onChange={(e) => updateForm('departureCity', e.target.value)}
                      placeholder="Toshkent"
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Jo‘nash sanasi *</label>
                    <input
                      type="date"
                      required
                      value={form.departureDate}
                      onChange={(e) => updateForm('departureDate', e.target.value)}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Kechalar</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.nights}
                      onChange={(e) => updateForm('nights', Number(e.target.value))}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Narx ($) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.price}
                      onChange={(e) => updateForm('price', Number(e.target.value))}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none font-bold text-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Jami o‘rinlar *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.totalSeats}
                      onChange={(e) => updateForm('totalSeats', Number(e.target.value))}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Holat</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as GroupTour['status'])}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    >
                      <option value="open">Ochiq (yozilish mumkin)</option>
                      <option value="closed">Yopiq</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Rasm (URL)</label>
                    <input
                      type="url"
                      value={form.img}
                      onChange={(e) => updateForm('img', e.target.value)}
                      className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Tavsif</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Guruh sayohati haqida qisqacha..."
                    className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs"
                >
                  {editingGroup ? 'Yangilashni Saqlash' : "Guruh Sayohatini Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};