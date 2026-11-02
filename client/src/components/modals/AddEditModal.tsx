import React, { useState } from 'react';
import { format, subMinutes } from 'date-fns';
import { X, Trash2, Clock, MapPin, Users, Phone, Mail, Bell } from 'lucide-react';
import axios from 'axios';
import { Input } from '../common/Input';
import type { PlannerEvent, Contact, ViewType } from '../../types/planner';

const API_URL = '/api';

interface AddEditModalProps {
  type: ViewType;
  item: PlannerEvent | Contact | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (id: string, type: 'events' | 'contacts') => void;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({ 
  type, 
  item, 
  onClose, 
  onSuccess, 
  onDelete 
}) => {
  const isContacts = type === 'contacts';
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      reminderSet: true,
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isContacts ? '/contacts' : '/events';
      const payload = { ...formData };

      if (!isContacts && payload.reminderSet && payload.startTime) {
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
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-orange-100 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Хедер модалки */}
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-linear-to-r from-orange-50/50 to-amber-50/50">
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
              className="w-full bg-linear-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Збереження...' : item ? 'Зберегти зміни' : 'Створити зараз'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};