"use client";
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Video, Plus, Bell } from 'lucide-react';

export default function PlannerDashboard() {
  const [view, setView] = useState<'calendar' | 'meetings' | 'contacts'>('calendar');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events').then(res => res.json()).then(data => setEvents(data));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar - Navigation */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 text-xl font-bold text-blue-600 border-b">Мій Планер</div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('calendar')}
            className={`w-full flex items-center p-3 rounded-lg ${view === 'calendar' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <CalendarIcon className="mr-3 w-5 h-5" /> Календар
          </button>
          <button 
            onClick={() => setView('meetings')}
            className={`w-full flex items-center p-3 rounded-lg ${view === 'meetings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Video className="mr-3 w-5 h-5" /> Зустрічі
          </button>
          <button 
            onClick={() => setView('contacts')}
            className={`w-full flex items-center p-3 rounded-lg ${view === 'contacts' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            <Users className="mr-3 w-5 h-5" /> Контакти
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold capitalize">
            {view === 'calendar' ? 'Мій Календар' : view === 'meetings' ? 'Зустрічі' : 'Список контактів'}
          </h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition">
            <Plus className="mr-2 w-4 h-4" /> Додати запис
          </button>
        </header>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          {view === 'calendar' && <CalendarView events={events} />}
          {view === 'meetings' && <MeetingsList events={events.filter((e: any) => e.isMeeting)} />}
          {view === 'contacts' && <ContactsView />}
        </div>
      </main>
    </div>
  );
}

// Компонент перегляду списку зустрічей (фрагмент)
function MeetingsList({ events }: { events: any[] }) {
  return (
    <div className="space-y-4">
      {events.map((m) => (
        <div key={m.id} className="border p-4 rounded-lg flex justify-between items-center hover:border-blue-300 transition">
          <div>
            <h3 className="font-semibold text-lg">{m.title}</h3>
            <p className="text-sm text-gray-500">{new Date(m.startTime).toLocaleString()}</p>
            <p className="text-sm">📍 {m.location} | 👥 {m.participants}</p>
          </div>
          {m.reminderSet && <Bell className="text-yellow-500 w-5 h-5" />}
        </div>
      ))}
    </div>
  );
}

function CalendarView({ events }: { events: any[] }) {
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
      {/* Спрощена сітка календаря */}
      {Array.from({ length: 31 }).map((_, i) => (
        <div key={i} className="bg-white h-32 p-2 hover:bg-gray-50 transition">
          <span className="text-sm font-medium text-gray-400">{i + 1}</span>
          {events.filter(e => new Date(e.startTime).getDate() === i + 1).map(e => (
            <div key={e.id} className="text-xs bg-blue-100 text-blue-700 p-1 rounded mt-1 truncate">
              {e.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ContactsView() {
  return <div className="text-center text-gray-500 py-10">Список контактів порожній. Натисніть "Додати", щоб створити перший контакт.</div>;
}