import React from 'react';
import { UserPlus, Phone, Mail, Trash2 } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import type { Contact } from '../../types/planner';

interface ContactsListProps {
  contacts: Contact[];
  onDelete: (id: string) => void;
  onEdit: (c: Contact) => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({ contacts, onDelete, onEdit }) => {
  if (contacts.length === 0) {
    return <EmptyState label="Контактів ще немає" sublabel="Додайте ваших знайомих, щоб швидко планувати зустрічі" icon={<UserPlus size={44}/>} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contacts.map((c: Contact) => (
        <div 
          key={c.id} 
          className="group bg-white p-6 rounded-3xl border border-stone-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5 transition-all flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="w-20 h-20 bg-linear-to-tr from-orange-100 to-amber-50 text-orange-600 rounded-3xl flex items-center justify-center text-2xl font-black mb-4 border border-orange-200/80 group-hover:scale-105 transition-transform shadow-inner">
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
};