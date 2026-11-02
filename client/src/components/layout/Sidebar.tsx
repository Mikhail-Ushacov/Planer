import React from 'react';
import { 
  Calendar as CalendarIcon, LayoutGrid, Video, Users, 
  Bell, ShieldCheck, AlertTriangle, Volume2, Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { NavButton } from '../common/NavButton';
import type { ViewType } from '../../types/planner';

interface SidebarProps {
  view: ViewType;
  setView: (v: ViewType) => void;
  notificationPermission: NotificationPermission;
  requestPermission: () => void;
  handleTestNotification: () => void;
  todayStats: { meetings: number; events: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  notificationPermission,
  requestPermission,
  handleTestNotification,
  todayStats
}) => {
  return (
    <aside className="w-80 bg-white border-r border-orange-100 flex flex-col z-20 shadow-[4px_0_24px_rgba(249,115,22,0.03)]">
      {/* Логотип */}
      <div className="p-8 pb-6 flex items-center gap-3.5">
        <div className="w-12 h-12 bg-linear-to-tr from-amber-500 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
          <CalendarIcon size={24} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-stone-900">
            Planer<span className="text-orange-500">.</span>
          </span>
          <p className="text-[11px] font-semibold text-orange-600/70 tracking-wide uppercase">Органайзер</p>
        </div>
      </div>

      {/* Меню */}
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

      {/* Стан сповіщень */}
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

      {/* Статистика на день */}
      <div className="p-5 bg-linear-to-b from-orange-50/80 to-amber-50/50 mx-5 mb-6 rounded-3xl border border-orange-200/60 shadow-sm">
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
  );
};