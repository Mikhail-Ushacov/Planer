import { prisma } from '@/lib/prisma';

export const ContactController = {
  async getAll() {
    return await prisma.contact.findMany({ orderBy: { firstName: 'asc' } });
  },

  async create(data: { firstName: string; lastName: string; phone?: string; email?: string; notes?: string }) {
    return await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
    });
  },

  async update(id: string, data: any) {
    return await prisma.contact.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      },
    });
  },

  async delete(id: string) {
    return await prisma.contact.delete({ where: { id } });
  },
};