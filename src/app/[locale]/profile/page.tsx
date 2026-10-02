import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';

// « Mon profil » : mène au profil de l'utilisateur connecté (de démonstration en attendant AUTH-8).
export default async function MyProfilePage({ params }: PageProps<'/[locale]/profile'>) {
  const { locale } = await params;
  redirect({ href: `/profile/${SAMPLE_CURRENT_USER}`, locale: locale as Locale });
}
