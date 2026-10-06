'use client';

import Avatar from '@/components/shared/Avatar';
import BevelFrame from '@/components/shared/BevelFrame';

export interface HeaderAccount {
  username: string;
  displayName: string;
  /** URL de la photo téléversée, ou `null` : initiales. */
  avatarUrl: string | null;
}

// Cadre biseauté (filet + marge) ; le lien parent porte `group` pour l'effet de survol.
export default function ProfileAvatar({ account }: { account: HeaderAccount }) {
  return (
    <BevelFrame as="span" frame="flex bg-primary-container transition-colors group-hover:bg-primary" className="flex bg-surface-container-lowest p-0.5">
      <Avatar avatar={null} name={account.displayName} src={account.avatarUrl} size={36} shape="bevel" />
    </BevelFrame>
  );
}
