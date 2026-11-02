import { NextResponse } from 'next/server';
import { EventController } from '@/controllers/eventController';
import { eventSchema } from '@/lib/validations';

export async function GET() {
  try {
    const events = await EventController.getAll();
    return NextResponse.json(events);
  } catch (error) {
    console.error('API /api/events GET error:', error);
    return NextResponse.json({ error: 'Не вдалося завантажити події' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Застосування модуля розширення Zod
    const validationResult = eventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Помилка валідації', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newEvent = await EventController.create(validationResult.data);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('API /api/events POST error:', error);
    return NextResponse.json({ error: 'Помилка при створенні події' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Відсутній ID запису' }, { status: 400 });

    const body = await req.json();
    const validationResult = eventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Помилка валідації', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedEvent = await EventController.update(id, validationResult.data);
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('API /api/events PUT error:', error);
    return NextResponse.json({ error: 'Помилка оновлення події' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Відсутній ID запису' }, { status: 400 });

    await EventController.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/events DELETE error:', error);
    return NextResponse.json({ error: 'Помилка видалення події' }, { status: 500 });
  }
}