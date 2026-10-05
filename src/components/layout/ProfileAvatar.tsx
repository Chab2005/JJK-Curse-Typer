'use client';

import Avatar from '@/components/shared/Avatar';

export interface HeaderAccount {
  username: string;
  displayName: string;
  /** URL de la photo téléversée, ou `null` : initiales. */
  avatarUrl: string | null;
}

export default function ProfileAvatar({ account }: { account: HeaderAccount }) {
  return <Avatar avatar={null} name={account.displayName} src={account.avatarUrl} size={36} />;
}
