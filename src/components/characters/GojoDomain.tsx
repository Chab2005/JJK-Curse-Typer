import type { ReactNode } from 'react';
import PixelDomain from './PixelDomain';

/** The violet void backs Gojo's domain and Maki's immunity illustration (BON-6). */
export function DomainScene({ children }: { children: ReactNode }) {
  return <PixelDomain character="gojo" showCharacter={false} guide>{children}</PixelDomain>;
}

export default function GojoDomain() {
  return <PixelDomain character="gojo" guide />;
}
