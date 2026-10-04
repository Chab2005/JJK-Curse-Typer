import { eq } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { usernameKey } from '@/lib/auth/validation';

// Photo de profil d'un compte (PROF-5). L'URL porte `?v=<version>` : l'image est donc cacheable à vie.
export async function GET(_request: NextRequest, { params }: RouteContext<'/api/avatar/[username]'>) {
  const { username } = await params;
  const [row] = await db.select({ avatar: users.avatar }).from(users).where(eq(users.usernameKey, usernameKey(decodeURIComponent(username)))).limit(1);
  if (!row?.avatar) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(row.avatar), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}
