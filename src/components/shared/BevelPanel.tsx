import type { ComponentProps, ElementType, ReactNode } from 'react';

type BevelPanelProps<T extends ElementType> = {
  /** Élément du panneau (`div` par défaut) : 'section', 'form'… Il reçoit les autres props. */
  as?: T;
  /** Classes du cadre extérieur : largeur, ombre portée… */
  frame?: string;
  /** Classes de la face : marges intérieures, mise en page du contenu. */
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, 'as' | 'className' | 'children'>;

// Panneau cramoisi aux coins coupés (canvas « Profil, lobby & course · style cramoisi ») : cadre, vide, filet et face,
// comme <HexCard>, mais biseauté pour les blocs de contenu (graphique, clavier, invitation, paramètres).
export default function BevelPanel<T extends ElementType = 'div'>({ as, frame = '', className = '', children, ...props }: BevelPanelProps<T>) {
  const Face: ElementType = as ?? 'div';

  return (
    <div className={`bpanel ${frame}`}>
      <div className="bpanel-g">
        <div className="bpanel-r">
          <Face {...props} className={`bpanel-c ${className}`}>
            {children}
          </Face>
        </div>
      </div>
    </div>
  );
}
