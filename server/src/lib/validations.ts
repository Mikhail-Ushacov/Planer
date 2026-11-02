import { z } from 'zod';

// Схема валідації для створення/оновлення події
export const eventSchema = z.object({
  title: z.string().trim().min(1, "Назва події обов'язкова").max(200),
  description: z.string().optional().nullable(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Некоректний формат часу початку",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Некоректний формат часу завершення",
  }),
  isMeeting: z.boolean().default(false),
  location: z.string().optional().nullable(),
  meetingType: z.string().optional().nullable(),
  participants: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  reminderSet: z.boolean().default(false),
  reminderTime: z.string().optional().nullable(),
}).refine((data) => new Date(data.endTime) >= new Date(data.startTime), {
  message: "Час завершення не може бути раніше за час початку",
  path: ["endTime"],
});

// Схема валідації для контактів
export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Ім'я обов'язкове"),
  lastName: z.string().trim().min(1, "Прізвище обов'язкове"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Некоректна email-адреса").optional().or(z.literal('')).nullable(),
  notes: z.string().optional().nullable(),
});