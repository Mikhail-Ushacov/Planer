import { prisma } from '@/lib/prisma';

export const EventController = {
  async getAll() {
    return await prisma.event.findMany({ orderBy: { startTime: 'asc' } });
  },

  async create(data: any) {
    const {
      title,
      description,
      startTime,
      endTime,
      isMeeting,
      location,
      meetingType,
      participants,
      notes,
      reminderSet,
      reminderTime,
    } = data;

    return await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isMeeting: Boolean(isMeeting),
        location,
        meetingType,
        participants,
        notes,
        reminderSet: Boolean(reminderSet),
        reminderTime: reminderTime ? new Date(reminderTime) : null,
      },
    });
  },

  async update(id: string, data: any) {
    const {
      title,
      description,
      startTime,
      endTime,
      isMeeting,
      location,
      meetingType,
      participants,
      notes,
      reminderSet,
      reminderTime,
    } = data;

    return await prisma.event.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        isMeeting: isMeeting !== undefined ? Boolean(isMeeting) : undefined,
        location: location !== undefined ? location : undefined,
        meetingType: meetingType !== undefined ? meetingType : undefined,
        participants: participants !== undefined ? participants : undefined,
        notes: notes !== undefined ? notes : undefined,
        reminderSet: reminderSet !== undefined ? Boolean(reminderSet) : undefined,
        reminderTime: reminderTime !== undefined ? (reminderTime ? new Date(reminderTime) : null) : undefined,
      },
    });
  },

  async delete(id: string) {
    return await prisma.event.delete({ where: { id } });
  },
};