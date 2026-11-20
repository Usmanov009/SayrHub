import React, { useMemo, useState } from 'react';
import { GroupTour } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Users, PlaneTakeoff } from '@/lib/flaticon-icons';

interface GroupToursViewProps {
  groupTours: GroupTour[];
  onBookGroup: (group: GroupTour) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GroupToursView: React.FC<GroupToursViewProps> = ({ groupTours, onBookGroup }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupTours
      .filter((g) =>
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.destination.toLowerCase().includes(q) ||
        g.country.toLowerCase().includes(q)
      )
      .sort((a, b) => (a.departureDate || '').localeCompare(b.departureDate || ''));
  }, [groupTours, query]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div
        className="p-4 rounded-3xl border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(14,165,233,0.12) 100%)',
          borderColor: 'var(--tw-border)'
        }}
      >
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider mb-1.5">
              <Users className="w-3 h-3" /> Guruh sayohati
            </div>
            <h3 className="text-base font-black leading-tight" style={{ color: 'var(--tw-text-main)' }}>
              Guruh bo‘lib sayohat qiling
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--tw-text-sub)' }}>
              Cheklangan o‘rinlar, qulay narx va yangi do‘stlar bilan birga turing.
            </p>
          </div>
          <Users className="w-8 h-8 text-indigo-500 shrink-0" />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--tw-surface)', borderColor: 'var(--tw-border)' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yo‘nalish yoki nom bo‘yicha qidirish..."
          className="w-full bg-zinc-100/90 dark:bg-zinc-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          style={{ color: 'var(--tw-text-main)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-3xl border p-8 text-center text-sm"
          style={{ backgroundColor: 'var(--tw-surface)', borderColor: 'var(--tw-border)', color: 'var(--tw-text-sub)' }}
        >
          Hozircha ochiq guruh sayohatlari mavjud emas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const seatsLeft = Math.max(0, group.availableSeats);
            const isFull = seatsLeft <= 0 || group.status !== 'open';
            const filled = Math.max(0, group.totalSeats - seatsLeft);
            const progress = group.totalSeats > 0 ? Math.min(100, Math.round((filled / group.totalSeats) * 100)) : 0;

            return (
              <Card key={group.id} className="rounded-2xl border-border bg-card shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="relative h-36 w-full bg-muted">
                    {group.img ? (
                      <img src={group.img} alt={group.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Users className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                      <Badge variant={isFull ? 'secondary' : 'default'} className="text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                        {isFull ? 'Yopiq' : `${seatsLeft} o‘rin qoldi`}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] font-bold bg-black/40 text-white border-white/30">
                        {group.nights} kecha
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-[11px] font-bold inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {group.destination}
                      </span>
                      <span className="text-[11px] font-bold inline-flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {group.departureDate}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold leading-tight text-foreground line-clamp-2">{group.title}</h4>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <PlaneTakeoff className="w-3 h-3 shrink-0" /> {group.departureCity}
                      </p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Band qilindi
                        </span>
                        <span className="text-foreground">
                          {filled}/{group.totalSeats}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-primary">${group.price}</span>
                      <span className="text-[10px] text-muted-foreground">/ kishi</span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-0">
                  <Button
                    type="button"
                    className="w-full rounded-xl text-xs font-bold h-9"
                    disabled={isFull}
                    onClick={() => onBookGroup(group)}
                  >
                    {isFull ? 'O‘rin yo‘q' : 'Guruhga yozilish'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};