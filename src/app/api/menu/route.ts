import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/data';

export async function GET() {
  const menuItems = await getMenuItems();
  return NextResponse.json(menuItems);
}
