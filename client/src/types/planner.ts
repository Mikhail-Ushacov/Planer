export interface PlannerEvent {
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

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type ViewType = 'calendar' | 'meetings' | 'contacts';