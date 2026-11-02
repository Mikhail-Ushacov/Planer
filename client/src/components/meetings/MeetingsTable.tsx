import React from 'react';
import { Video, Clock, MapPin, Users, Edit3, Trash2, ExternalLink, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { EmptyState } from '../common/EmptyState';
import type { PlannerEvent } from '../../types/planner';

interface MeetingsTableProps {
  meetings: PlannerEvent[];
  onDelete: (id: string) => void;
  onEdit: (e: PlannerEvent) => void;
}

export const MeetingsTable: React.FC<MeetingsTableProps> = ({ meetings, onDelete, onEdit }) => {
  if (meetings.length === 0) {
    return <EmptyState label="Зустрічей не знайдено" sublabel="Заплануйте вашу першу онлайн або офлайн-зустріч!" />;
  }

  return (
    <div className="space-y-4">
      {meetings.map((m: PlannerEvent) => (
        <div 
          key={m.id} 
          className="group bg-white border border-stone-200 hover:border-orange-300 p-6 rounded-3xl flex justify-between items-center hover:shadow-xl hover:shadow-orange-500/5 transition-all border-l-4 border-l-orange-500"
        >
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 bg-linear-to-br from-orange-100 to-amber-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-orange-200/60">
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
};