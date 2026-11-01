import type { ComponentProps, ElementType, ReactNode } from 'react';

type HexCardProps<T extends ElementType> = {
  /** Élément de la carte (`div` par défaut) : 'form', 'section'… Il reçoit les autres props. */
  as?: T;
  /** Classes de la face : marges intérieures, mise en page du contenu. */
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, 'as' | 'className' | 'children'>;

// Carte à bouts pointus (canvas « Accueil · style flèches ») : cadre, vide, filet et face, comme la plaque des boutons-flèches.
export default function HexCard<T extends ElementType = 'div'>({ as, className = '', children, ...props }: HexCardProps<T>) {
  const Face: ElementType = as ?? 'div';

  return (
    <div className="hcard">
      <div className="hcard-g">
        <div className="hcard-r">
          <Face {...props} className={`hcard-c ${className}`}>
            {children}
          </Face>
        </div>
      </div>
    </div>
  );
}
