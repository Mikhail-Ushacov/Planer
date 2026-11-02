import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, X, Search, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { format, isSameDay, addMonths, subMonths, subMinutes } from 'date-fns';
import { uk } from 'date-fns/locale';
import axios from 'axios';

import type { PlannerEvent, Contact, ViewType } from '../types/planner';
import { triggerSystemNotification } from '../utils/notifications';
import { Sidebar } from '../components/layout/Sidebar';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { MeetingsTable } from '../components/meetings/MeetingsTable';
import { ContactsList } from '../components/contacts/ContactsList';
import { AddEditModal } from '../components/modals/AddEditModal';

const API_URL = '/api';

export default function PlannerDashboard() {
  const [view, setView] = useState<ViewType>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerEvent | Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Перевірка дозволу
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

  // Цикл нагадувань
  useEffect(() => {
    const checkReminders = () => {
      if (notificationPermission !== 'granted') return;

      const now = new Date();

      data.forEach((item: PlannerEvent) => {
        if (!item.reminderSet || !item.startTime) return;
        if (notifiedEventsRef.current.has(item.id)) return;

        const targetReminderTime = item.reminderTime 
          ? new Date(item.reminderTime).getTime()
          : subMinutes(new Date(item.startTime), 10).getTime();

        const diffSeconds = Math.floor((targetReminderTime - now.getTime()) / 1000);

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
    checkReminders();

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
      <Sidebar 
        view={view}
        setView={setView}
        notificationPermission={notificationPermission}
        requestPermission={requestPermission}
        handleTestNotification={handleTestNotification}
        todayStats={todayStats}
      />

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
            className="bg-linear-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-7 py-3.5 rounded-2xl flex items-center font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all active:scale-95 group cursor-pointer"
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
                    className="px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors cursor-pointer"
                  >
                    Сьогодні
                  </button>

                  <div className="flex items-center bg-white border border-stone-200 rounded-2xl p-1.5 shadow-sm">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                      className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-stone-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={18}/>
                    </button>
                    <span className="px-5 font-black text-sm min-w-40 text-center capitalize tracking-tight text-stone-800">
                      {format(currentMonth, 'LLLL yyyy', { locale: uk })}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                      className="p-2 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-stone-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={18}/>
                    </button>
                  </div>
                </div>
              </div>

              <CalendarGrid 
                currentMonth={currentMonth} 
                events={filteredData} 
                onEdit={(e) => { setEditingItem(e); setIsModalOpen(true); }} 
                onDelete={(id) => handleDelete(id, 'events')}
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
                onDelete={(id) => handleDelete(id, 'events')} 
                onEdit={(e) => { setEditingItem(e); setIsModalOpen(true); }} 
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
                onDelete={(id) => handleDelete(id, 'contacts')} 
                onEdit={(c) => { setEditingItem(c); setIsModalOpen(true); }} 
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