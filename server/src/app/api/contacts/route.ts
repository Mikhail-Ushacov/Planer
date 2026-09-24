import { NextResponse } from 'next/server';
import { ContactController } from '@/controllers/contactController';

export async function GET() {
  try {
    const contacts = await ContactController.getAll();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('API /api/contacts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contact = await ContactController.create(body);
    return NextResponse.json(contact);
  } catch (error) {
    console.error('API /api/contacts POST error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await req.json();
    const updatedContact = await ContactController.update(id, body);
    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('API /api/contacts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await ContactController.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /api/contacts DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}