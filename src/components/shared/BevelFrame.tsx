import type { ComponentProps, ElementType, ReactNode } from 'react';

/** Bordure dégradée rouge → gris → bleu des cartes et des modales. */
export const cardFrame = 'bg-linear-160 from-primary-container via-outline-variant via-40% to-secondary-container';
/** Bordure dorée des actions principales et de la première place. */
export const goldFrame = 'bg-linear-135 from-gold to-gold-deep';

// Dans un conteneur de bloc, la face est un <div> ; ailleurs (lien, bouton, label…) un <span>, seul contenu admis dans un bouton.
const BLOCK_TAGS: ReadonlySet<ElementType> = new Set(['div', 'section', 'form', 'article', 'aside']);

type BevelFrameProps<T extends ElementType> = {
  /** Élément du cadre (`div` par défaut) : 'button', 'section', `Link`… Il reçoit les autres props. */
  as?: T;
  /** Classes du cadre : fond de la bordure, mise en page, `group`, survol… */
  frame?: string;
  /** Classes de la face : fond, marges intérieures, mise en page du contenu. */
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, 'as' | 'className' | 'children'>;

// Cadre biseauté : le fond du cadre, révélé par `p-px`, dessine une bordure de 1px autour de la face, biseautée elle aussi.
export default function BevelFrame<T extends ElementType = 'div'>({ as, frame = '', className = '', children, ...props }: BevelFrameProps<T>) {
  const Frame: ElementType = as ?? 'div';
  const Face = BLOCK_TAGS.has(Frame) ? 'div' : 'span';

  return (
    <Frame {...props} className={`bevel p-px ${frame}`}>
      <Face className={`bevel ${className}`}>{children}</Face>
    </Frame>
  );
}
