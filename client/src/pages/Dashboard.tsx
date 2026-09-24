import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, Users, Video, Plus, Bell, MapPin, 
  Trash2, Edit3, X, Search, ChevronLeft, ChevronRight, 
  Clock, LayoutGrid, UserPlus, Phone, Mail, 
  ExternalLink, Sparkles, Volume2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, subMinutes
} from 'date-fns';
import { uk } from 'date-fns/locale';
import axios from 'axios';

const API_URL = '/api';

interface PlannerEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isMeeting: boolean;
  location?: string;
  participants?: string;
  meetingType?: string;
  notes?: string;
  reminderSet: boolean;
  reminderTime?: string | null;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

// Генерація приємного звукового сигналу без зовнішніх файлів
function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // Ре (D5)
    osc.frequency.setValueAtTime(880.00, now + 0.12); // Ля (A5)
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    console.warn('Audio Context failed or blocked:', e);
  }
}

// Функція показу системного сповіщення
async function triggerSystemNotification(title: string, body: string) {
  playNotificationSound();

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // 1. Спроба показати через Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
          tag: `reminder-${Date.now()}`,
          renotify: true,
        } as any);
        return;
      }
    } catch (err) {
      console.warn('ServiceWorker showNotification failed, using fallback:', err);
    }
  }

  // 2. Fallback через звичайний браузерний Notification
  new Notification(title, {
    body,
    icon: '/favicon.svg',
  });
}

export default function PlannerDashboard() {
  const [view, setView] = useState<'calendar' | 'meetings' | 'contacts'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerEvent | Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Зберігаємо ID подій, для яких сповіщення вже спрацювало в цій сесії
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Перевірка дозволу на сповіщення при старті
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        triggerSystemNotification('Сповіщення активовано! 🎉', 'Тепер ви не пропустите жодної важливої зустрічі.');
      }
    }
  };

  const handleTestNotification = () => {
    triggerSystemNotification('Тестове сповіщення 🔔', 'Все працює відмінно! Ваші нагадування приходитимуть вчасно.');
  };

  const fetchData = async () => {
    try {
      const endpoint = view === 'contacts' ? `${API_URL}/contacts` : `${API_URL}/events`;
      const res = await axios.get(endpoint);
      setData(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [view]);

  // Фоновий цикл перевірки нагадувань кожні 15 секунд
  useEffect(() => {
    const checkReminders = () => {
      if (notificationPermission !== 'granted') return;

      const now = new Date();

      data.forEach((item: PlannerEvent) => {
        if (!item.reminderSet || !item.startTime) return;
        if (notifiedEventsRef.current.has(item.id)) return;

        // Визначаємо час, коли має надійти нагадування
        const targetReminderTime = item.reminderTime 
          ? new Date(item.reminderTime).getTime()
          : subMinutes(new Date(item.startTime), 10).getTime(); // За замовчуванням за 10 хв

        const diffSeconds = Math.floor((targetReminderTime - now.getTime()) / 1000);

        // Якщо час настав (у діапазоні від -60 сек до +15 сек)
        if (diffSeconds <= 15 && diffSeconds >= -60) {
          notifiedEventsRef.current.add(item.id);

          const timeFormatted = format(new Date(item.startTime), 'HH:mm');
          const prefix = item.isMeeting ? '📹 Зустріч' : '📅 Подія';
          const locationInfo = item.location ? ` • ${item.location}` : '';

          triggerSystemNotification(
            `Нагадування: ${item.title}`,
            `${prefix} розпочнеться о ${timeFormatted}${locationInfo}`
          );
        }
      });
    };

    const intervalId = setInterval(checkReminders, 15000);
    checkReminders(); // Перевірити одразу

    return () => clearInterval(intervalId);
  }, [data, notificationPermission]);

  const handleDelete = async (id: string, type: 'events' | 'contacts') => {
    if (confirm('Ви впевнені, що хочете видалити цей запис?')) {
      try {
        await axios.delete(`${API_URL}/${type}?id=${id}`);
        fetchData();
      } catch (error) {
        console.error("Delete error:", error);
        alert("Не вдалося видалити запис.");
      }
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => 
      (item.title || `${item.firstName || ''} ${item.lastName || ''}` || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Статистика на сьогодні
  const todayStats = useMemo(() => {
    if (view === 'contacts') return { meetings: 0, events: 0 };
    return {
      meetings: data.filter(e => e.isMeeting && isSameDay(new Date(e.startTime), new Date())).length,
      events: data.filter(e => !e.isMeeting && isSameDay(new Date(e.startTime), new Date())).length,
    };
  }, [data, view]);

  return (
    <div className="flex h-screen bg-[#FBF9F6] text-stone-800 font-sans antialiased overflow-hidden selection:bg-orange-200">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-orange-100 flex flex-col z-20 shadow-[4px_0_24px_rgba(249,115,22,0.03)]">
        {/* Логотип */}
        <div className="p-8 pb-6 flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <CalendarIcon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-stone-900">
              Planer<span className="text-orange-500">.</span>
            </span>
            <p className="text-[11px] font-semibold text-orange-600/70 tracking-wide uppercase">Органайзер</p>
          </div>
        </div>

        {/* Навігація */}
        <nav className="flex-1 px-5 py-4 space-y-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">Головне меню</p>
          <NavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<LayoutGrid size={20}/>} 
            label="Календар подій" 
          />
          <NavButton 
            active={view === 'meetings'} 
            onClick={() => setView('meetings')} 
            icon={<Video size={20}/>} 
            label="Зустрічі та мітинги" 
          />
          <NavButton 
            active={view === 'contacts'} 
            onClick={() => setView('contacts')} 
            icon={<Users size={20}/>} 
            label="Контакти" 
          />
        </nav>

        {/* Блок стану сповіщень */}
        <div className="px-5 mb-4">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Bell size={14} className="text-orange-500" /> Сповіщення
              </span>
              {notificationPermission === 'granted' ? (
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={12} /> Активні
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={12} /> Не дозволено
                </span>
              )}
            </div>

            {notificationPermission !== 'granted' ? (
              <button 
                onClick={requestPermission}
                className="w-full mt-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                Дозволити сповіщення
              </button>
            ) : (
              <button 
                onClick={handleTestNotification}
                className="w-full mt-1 py-1.5 px-3 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-200 text-stone-600 hover:text-orange-600 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Volume2 size={13} /> Надіслати тестовий сигнал
              </button>
            )}
          </div>
        </div>

        {/* Інформаційна плашка дня */}
        <div className="p-5 bg-gradient-to-b from-orange-50/80 to-amber-50/50 mx-5 mb-6 rounded-3xl border border-orange-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span className="text-xs font-bold text-stone-700">Сьогодні, {format(new Date(), 'd MMMM', { locale: uk })}</span>
            </div>
            <Sparkles size={16} className="text-orange-500" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center bg-white/80 px-3.5 py-1.5 rounded-xl border border-orange-100">
              <span className="text-xs font-semibold text-stone-600">Зустрічі</span>
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md text-xs font-black">
                {todayStats.meetings}
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/80 px-3.5 py-1.5 rounded-xl border border-orange-100">
              <span className="text-xs font-semibold text-stone-600">Події та задачі</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-xs font-black">
                {todayStats.events}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ОСНОВНА ЧАСТИНА */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Хедер */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-orange-100/80 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3.5 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Пошук за назвою, учасниками чи контактами..." 
              className="w-full pl-11 pr-5 py-3 bg-stone-50 border border-stone-200/80 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all outline-none text-sm font-medium shadow-inner placeholder:text-stone-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600">
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-7 py-3.5 rounded-2xl flex items-center font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all active:scale-95 group cursor-pointer"
          >
            <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={20} strokeWidth={3} />
            Створити запис
          </button>
        </header>

        {/* Контент сторінки */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {view === 'calendar' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-stone-900">Календар</h1>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Огляд ваших планів та зустрічей на місяць</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors"
                  >
                    Сьогодні
                  </button>

                  <div className="flex items-center bg-white border border-stone-200 rounded-2xl p-1.5 shadow-sm">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                      className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-stone-600 transition-colors"
                    >
                      <ChevronLeft size={18}/>
                    </button>
                    <span className="px-5 font-black text-sm min-w-[160px] text-center capitalize tracking-tight text-stone-800">
                      {format(currentMonth, 'LLLL yyyy', { locale: uk })}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                      className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-stone-600 transition-colors"
                    >
                      <ChevronRight size={18}/>
                    </button>
                  </div>
                </div>
              </div>

              <CalendarGrid 
                currentMonth={currentMonth} 
                events={filteredData} 
                onEdit={(e: PlannerEvent) => { setEditingItem(e); setIsModalOpen(true); }} 
                onDelete={(id: string) => handleDelete(id, 'events')}
              />
            </div>
          )}

          {view === 'meetings' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-stone-900">Зустрічі</h1>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Всі онлайн- та офлайн-зустрічі із зазначеними деталями</p>
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-orange-200">
                  Всього: {filteredData.filter(e => e.isMeeting).length}
                </span>
              </div>

              <MeetingsTable 
                meetings={filteredData.filter(e => e.isMeeting)} 
                onDelete={(id: string) => handleDelete(id, 'events')} 
                onEdit={(e: PlannerEvent) => { setEditingItem(e); setIsModalOpen(true); }} 
              />
            </div>
          )}

          {view === 'contacts' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-stone-900">Контакти</h1>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Список колег, клієнтів та партнерів</p>
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-orange-200">
                  Контактів: {filteredData.length}
                </span>
              </div>

              <ContactsList 
                contacts={filteredData} 
                onDelete={(id: string) => handleDelete(id, 'contacts')} 
                onEdit={(c: Contact) => { setEditingItem(c); setIsModalOpen(true); }} 
              />
            </div>
          )}
        </div>
      </main>

      {/* МОДАЛЬНЕ ВІКНО СТВОРЕННЯ/РЕДАГУВАННЯ */}
      {isModalOpen && (
        <AddEditModal 
          type={view} 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// --- КОМПОНЕНТИ КАЛЕНДАРЯ ---

function CalendarGrid({ 
  currentMonth, 
  events, 
  onEdit, 
  onDelete 
}: { 
  currentMonth: Date; 
  events: PlannerEvent[]; 
  onEdit: (e: PlannerEvent) => void;
  onDelete: (id: string) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-stone-200/90 overflow-hidden">
      <div className="grid grid-cols-7 bg-orange-50/40 border-b border-stone-200">
        {['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'].map((d, index) => (
          <div key={d} className="py-4 text-center text-xs font-black text-stone-500 uppercase tracking-wider">
            <span className="hidden md:inline">{d}</span>
            <span className="md:hidden">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][index]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-stone-200">
        {calendarDays.map(day => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
          const today = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={`min-h-[140px] p-3 transition-colors flex flex-col justify-between ${
                isCurrentMonth ? 'bg-white hover:bg-orange-50/20' : 'bg-stone-50/70 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 text-xs font-black rounded-xl transition-all ${
                  today 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-400/40 scale-105' 
                    : isCurrentMonth ? 'text-stone-700' : 'text-stone-400'
                }`}>
                  {format(day, 'd')}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-black text-orange-600 bg-orange-100/80 px-1.5 py-0.5 rounded-md">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(e => (
                  <div 
                    key={e.id}
                    className={`group/event relative w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between gap-1 ${
                      e.isMeeting 
                        ? 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-l-[3px] border-orange-500 shadow-sm' 
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-l-[3px] border-amber-500 shadow-sm'
                    }`}
                  >
                    <button 
                      type="button"
                      onClick={() => onEdit(e)}
                      title={e.title}
                      className="flex items-center gap-1.5 truncate flex-1 text-left cursor-pointer"
                    >
                      <span className="opacity-60 text-[10px] shrink-0">{format(new Date(e.startTime), 'HH:mm')}</span>
                      <span className="truncate">{e.title}</span>
                      {e.reminderSet && <Bell size={10} className="text-orange-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onDelete(e.id);
                      }}
                      title="Видалити"
                      className="opacity-0 group-hover/event:opacity-100 p-0.5 text-stone-400 hover:text-red-600 rounded transition-opacity cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-center font-bold text-orange-500 mt-1">
                    +{dayEvents.length - 3} ще
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- СПИСОК ЗУСТРІЧЕЙ ---

function MeetingsTable({ meetings, onDelete, onEdit }: { meetings: PlannerEvent[], onDelete: (id: string) => void, onEdit: (e: PlannerEvent) => void }) {
  if (meetings.length === 0) return <EmptyState label="Зустрічей не знайдено" sublabel="Заплануйте вашу першу онлайн або офлайн-зустріч!" />;

  return (
    <div className="space-y-4">
      {meetings.map((m: PlannerEvent) => (
        <div 
          key={m.id} 
          className="group bg-white border border-stone-200 hover:border-orange-300 p-6 rounded-3xl flex justify-between items-center hover:shadow-xl hover:shadow-orange-500/5 transition-all border-l-4 border-l-orange-500"
        >
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-orange-200/60">
              <Video size={24} />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-black text-stone-900 tracking-tight">{m.title}</h3>
                {m.meetingType && (
                  <span className="bg-orange-50 text-orange-700 text-[11px] font-black px-2.5 py-0.5 rounded-lg border border-orange-200">
                    {m.meetingType}
                  </span>
                )}
                {m.reminderSet && (
                  <span className="flex items-center text-amber-700 bg-amber-50 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                    <Bell size={12} className="mr-1 text-amber-600 animate-tada" /> Нагадування активне
                  </span>
                )}
              </div>

              <div className="flex items-center gap-5 text-xs font-semibold text-stone-500 flex-wrap pt-0.5">
                <span className="flex items-center text-stone-700">
                  <Clock size={14} className="mr-1.5 text-orange-500"/>
                  {format(new Date(m.startTime), 'HH:mm')} – {format(new Date(m.endTime), 'HH:mm')}, {format(new Date(m.startTime), 'd MMMM', { locale: uk })}
                </span>
                
                {m.location && (
                  <span className="flex items-center text-stone-600">
                    <MapPin size={14} className="mr-1.5 text-amber-500"/>
                    {m.location.startsWith('http') ? (
                      <a href={m.location} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline flex items-center">
                        Посилання <ExternalLink size={12} className="ml-1"/>
                      </a>
                    ) : m.location}
                  </span>
                )}

                {m.participants && (
                  <span className="flex items-center text-stone-600">
                    <Users size={14} className="mr-1.5 text-orange-400"/>
                    {m.participants}
                  </span>
                )}
              </div>

              {m.notes && (
                <p className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mt-2 line-clamp-2">
                  {m.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-4">
            <button 
              onClick={() => onEdit(m)} 
              title="Редагувати"
              className="p-3 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
            >
              <Edit3 size={18}/>
            </button>
            <button 
              onClick={() => onDelete(m.id)} 
              title="Видалити"
              className="p-3 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 size={18}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- СПИСОК КОНТАКТІВ ---

function ContactsList({ contacts, onDelete, onEdit }: { contacts: Contact[], onDelete: (id: string) => void, onEdit: (c: Contact) => void }) {
  if (contacts.length === 0) return <EmptyState label="Контактів ще немає" sublabel="Додайте ваших знайомих, щоб швидко планувати зустрічі" icon={<UserPlus size={44}/>} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contacts.map((c: Contact) => (
        <div 
          key={c.id} 
          className="group bg-white p-6 rounded-3xl border border-stone-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5 transition-all flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="w-20 h-20 bg-gradient-to-tr from-orange-100 to-amber-50 text-orange-600 rounded-3xl flex items-center justify-center text-2xl font-black mb-4 border border-orange-200/80 group-hover:scale-105 transition-transform shadow-inner">
            {c.firstName?.[0]}{c.lastName?.[0]}
          </div>

          <h3 className="text-lg font-black text-stone-900 mb-1">{c.firstName} {c.lastName}</h3>
          
          <div className="w-full space-y-1.5 my-4">
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="flex items-center justify-center text-xs font-bold text-stone-600 hover:text-orange-600 bg-stone-50 hover:bg-orange-50 py-1.5 rounded-lg border border-stone-100 transition-colors">
                <Phone size={13} className="mr-2 text-orange-500" /> {c.phone}
              </a>
            ) : (
              <span className="text-xs text-stone-400 font-semibold italic block py-1.5">Телефон не вказано</span>
            )}

            {c.email ? (
              <a href={`mailto:${c.email}`} className="flex items-center justify-center text-xs font-bold text-stone-600 hover:text-orange-600 bg-stone-50 hover:bg-orange-50 py-1.5 rounded-lg border border-stone-100 transition-colors truncate px-2">
                <Mail size={13} className="mr-2 text-orange-500 shrink-0" /> <span className="truncate">{c.email}</span>
              </a>
            ) : null}
          </div>

          {c.notes && (
            <p className="text-[11px] text-stone-500 bg-orange-50/50 border border-orange-100 p-2.5 rounded-xl w-full text-left line-clamp-2 mb-4 font-medium">
              {c.notes}
            </p>
          )}

          <div className="w-full flex gap-2 mt-auto pt-2 border-t border-stone-100">
            <button 
              onClick={() => onEdit(c)} 
              className="flex-1 bg-stone-50 hover:bg-orange-500 hover:text-white py-2.5 rounded-xl text-xs font-black text-stone-700 transition-colors cursor-pointer"
            >
              Редагувати
            </button>
            <button 
              onClick={() => onDelete(c.id)} 
              title="Видалити"
              className="p-2.5 bg-stone-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-stone-400 transition-colors cursor-pointer"
            >
              <Trash2 size={16}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- МОДАЛЬНЕ ВІКНО СТВОРЕННЯ/РЕДАГУВАННЯ ---

function AddEditModal({ type, item, onClose, onSuccess, onDelete }: any) {
  const isContacts = type === 'contacts';
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(10);
  
  const [formData, setFormData] = useState<any>(() => {
    if (item) {
      return { ...item };
    }
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    return {
      title: '',
      isMeeting: type === 'meetings',
      meetingType: 'Zoom',
      startTime: format(now, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
      location: '',
      participants: '',
      notes: '',
      reminderSet: true, // За замовчуванням увімкнено
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isContacts ? '/contacts' : '/events';

      let payload = { ...formData };
      if (!isContacts && payload.reminderSet && payload.startTime) {
        // Розраховуємо точний час нагадування
        const reminderDate = subMinutes(new Date(payload.startTime), reminderMinutesBefore);
        payload.reminderTime = reminderDate.toISOString();
      } else {
        payload.reminderTime = null;
      }

      if (item?.id) {
        await axios.put(`${API_URL}${endpoint}?id=${item.id}`, payload);
      } else {
        await axios.post(`${API_URL}${endpoint}`, payload);
      }

      // Якщо користувач увімкнув нагадування, запитуємо дозвіл у браузера
      if (!isContacts && payload.reminderSet && 'Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      onSuccess();
    } catch (error) {
      console.error("Save error:", error);
      alert("Не вдалося зберегти запис. Перевірте введені дані.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalDelete = async () => {
    if (item?.id && onDelete) {
      await onDelete(item.id, isContacts ? 'contacts' : 'events');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Хедер модалки */}
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-orange-50/50 to-amber-50/50">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {item ? 'Редагувати запис' : 'Створити новий запис'}
            </h2>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-0.5">
              {isContacts ? 'Картка контакту' : formData.isMeeting ? 'Зустріч' : 'Подія календаря'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {item?.id && (
              <button
                type="button"
                onClick={handleModalDelete}
                title="Видалити цей запис"
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <Trash2 size={16}/>
                <span className="hidden sm:inline">Видалити</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X size={20}/>
            </button>
          </div>
        </div>
        
        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {isContacts ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Ім'я" 
                  value={formData.firstName} 
                  onChange={(v: string) => setFormData({...formData, firstName: v})} 
                  required 
                  placeholder="Олександр"
                />
                <Input 
                  label="Прізвище" 
                  value={formData.lastName} 
                  onChange={(v: string) => setFormData({...formData, lastName: v})} 
                  required 
                  placeholder="Коваленко"
                />
              </div>
              <Input 
                icon={<Phone size={16}/>} 
                label="Номер телефону" 
                value={formData.phone} 
                onChange={(v: string) => setFormData({...formData, phone: v})} 
                type="tel" 
                placeholder="+380 (99) 123-45-67"
              />
              <Input 
                icon={<Mail size={16}/>} 
                label="Email" 
                value={formData.email} 
                onChange={(v: string) => setFormData({...formData, email: v})} 
                type="email" 
                placeholder="alex@example.com"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Нотатки</label>
                <textarea 
                  rows={2}
                  value={formData.notes || ""}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Додаткові відомості про людину..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-semibold bg-stone-50 resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Перемикач типу події */}
              <div className="flex bg-stone-100 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isMeeting: false})}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${!formData.isMeeting ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500'}`}
                >
                  Звичайна подія
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isMeeting: true})}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${formData.isMeeting ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'text-stone-500'}`}
                >
                  Зустріч / Мітинг
                </button>
              </div>

              <Input 
                label="Назва події" 
                value={formData.title} 
                onChange={(v: string) => setFormData({...formData, title: v})} 
                required 
                placeholder="Співбесіда / Синхронізація проекту..."
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  icon={<Clock size={16}/>} 
                  label="Час початку" 
                  value={formData.startTime?.slice(0, 16)} 
                  onChange={(v: string) => setFormData({...formData, startTime: v})} 
                  type="datetime-local" 
                  required 
                />
                <Input 
                  icon={<Clock size={16}/>} 
                  label="Час завершення" 
                  value={formData.endTime?.slice(0, 16)} 
                  onChange={(v: string) => setFormData({...formData, endTime: v})} 
                  type="datetime-local" 
                  required 
                />
              </div>

              {formData.isMeeting && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Формат</label>
                      <select 
                        className="w-full border border-stone-200 px-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-bold bg-stone-50"
                        value={formData.meetingType}
                        onChange={e => setFormData({...formData, meetingType: e.target.value})}
                      >
                        <option value="Zoom">Zoom</option>
                        <option value="Meet">Google Meet</option>
                        <option value="Teams">Microsoft Teams</option>
                        <option value="Offline">Офлайн</option>
                      </select>
                    </div>

                    <Input 
                      icon={<Users size={16}/>} 
                      label="Учасники" 
                      value={formData.participants} 
                      onChange={(v: string) => setFormData({...formData, participants: v})} 
                      placeholder="Олег, Марія..."
                    />
                  </div>

                  <Input 
                    icon={<MapPin size={16}/>} 
                    label="Місце або посилання на зустріч" 
                    value={formData.location} 
                    onChange={(v: string) => setFormData({...formData, location: v})} 
                    placeholder="https://zoom.us/j/... або Офіс, каб. 302"
                  />
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Опис / Нотатки</label>
                <textarea 
                  rows={2}
                  value={formData.notes || ""}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Порядок денний, важливі тези..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-semibold bg-stone-50 resize-none"
                />
              </div>

              {/* Блок нагадування */}
              <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200/80 space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.reminderSet} 
                    onChange={e => setFormData({...formData, reminderSet: e.target.checked})}
                    className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
                  />
                  <span className="ml-3 text-xs font-black text-orange-950 flex items-center">
                    <Bell size={16} className="mr-2 text-orange-600"/>
                    Увімкнути сповіщення
                  </span>
                </label>

                {formData.reminderSet && (
                  <div className="flex items-center gap-2 pt-1 border-t border-orange-200/60">
                    <span className="text-[11px] font-bold text-stone-600">Коли нагадати:</span>
                    <select 
                      value={reminderMinutesBefore}
                      onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                      className="text-xs font-bold bg-white border border-orange-200 px-3 py-1.5 rounded-xl outline-none text-orange-800"
                    >
                      <option value={0}>В момент початку</option>
                      <option value={5}>За 5 хвилин</option>
                      <option value={10}>За 10 хвилин</option>
                      <option value={15}>За 15 хвилин</option>
                      <option value={30}>За 30 хвилин</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Збереження...' : item ? 'Зберегти зміни' : 'Створити зараз'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- ДОПОМІЖНІ UI КОМПОНЕНТИ ---

function Input({ label, value, onChange, type = "text", required = false, icon, placeholder }: any) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-3.5 text-stone-400">{icon}</div>}
        <input 
          type={type} 
          required={required} 
          value={value || ""}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={`w-full py-3.5 pr-4 border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 text-sm font-semibold bg-stone-50 focus:bg-white transition-all ${icon ? 'pl-11' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center px-5 py-3.5 rounded-2xl transition-all group relative cursor-pointer ${
        active 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-md shadow-orange-500/25' 
          : 'text-stone-500 hover:bg-orange-50/60 hover:text-orange-600 font-bold'
      }`}
    >
      <span className={`mr-3.5 transition-transform ${active ? 'scale-105' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-2 h-2 bg-white rounded-full shadow" />}
    </button>
  );
}

function EmptyState({ label, sublabel, icon = <Search size={44}/> }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-dashed border-orange-100 rounded-3xl p-6 text-center">
      <div className="w-20 h-20 bg-orange-50 text-orange-400 rounded-3xl flex items-center justify-center mb-4 border border-orange-100">
        {icon}
      </div>
      <p className="text-stone-800 font-black text-xl tracking-tight">{label}</p>
      {sublabel && <p className="text-stone-400 text-xs font-semibold mt-1 max-w-sm">{sublabel}</p>}
    </div>
  );
}