import { getSessionUser } from '@/lib/auth/session';
import Header from './Header';

// En-tête des pages : lit la session côté serveur et la passe au composant client.
export default async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <Header
      account={user && { username: user.username, displayName: user.displayName, avatarUrl: user.hasAvatar ? `/api/avatar/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null }}
    />
  );
}
