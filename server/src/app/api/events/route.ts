import { NextResponse } from 'next/server';
import { EventController } from '@/controllers/eventController';

export async function GET() {
  try {
    const events = await EventController.getAll();
    return NextResponse.json(events);
  } catch (error) {
    console.error('API /api/events GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newEvent = await EventController.create(body);
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('API /api/events POST error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await req.json();
    const updatedEvent = await EventController.update(id, body);
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('API /api/events PUT error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await EventController.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/events DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}