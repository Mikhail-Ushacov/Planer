import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Bell, Trash2 } from 'lucide-react';
import type { PlannerEvent } from '../../types/planner';

interface CalendarGridProps {
  currentMonth: Date;
  events: PlannerEvent[];
  onEdit: (e: PlannerEvent) => void;
  onDelete: (id: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  currentMonth, 
  events, 
  onEdit, 
  onDelete 
}) => {
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
              className={`min-h-35 p-3 transition-colors flex flex-col justify-between ${
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
};