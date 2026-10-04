import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth/session';

// « Mon profil » : mène au profil de l'utilisateur connecté, ou à la connexion pour un invité (qui n'a pas de profil).
export default async function MyProfilePage({ params }: PageProps<'/[locale]/profile'>) {
  const { locale } = await params;
  const user = await getSessionUser();
  redirect({ href: user ? `/profile/${encodeURIComponent(user.username)}` : '/login', locale: locale as Locale });
}
