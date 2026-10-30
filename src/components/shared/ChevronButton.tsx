import type { ComponentProps, ElementType, ReactNode } from 'react';

type ChevronButtonProps<T extends ElementType> = {
  /** Élément du bouton (`button` par défaut) : `Link`, 'a', `SmoothScrollLink`… Il reçoit les autres props. */
  as?: T;
  /** `sm` : 40px de haut (langue) ; `md` : 56px (actions). */
  size?: 'sm' | 'md';
  /** `primary` : face cramoisie ; `secondary` : face sombre. */
  variant?: 'primary' | 'secondary';
  /** Classes du cadre : largeur, alignement, `group`… */
  frame?: string;
  /** Classes de la face : typographie, écart du contenu. */
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, 'as' | 'className' | 'children'>;

// Bouton-flèche (canvas « Flèches stylisées · croissant ») : une plaque à bouts pointus, bordée d'un double filet,
// flanquée de trois chevrons qui grandissent vers l'extérieur et s'écartent au survol (styles `.arw` dans globals.css).
export default function ChevronButton<T extends ElementType = 'button'>({
  as,
  size = 'md',
  variant = 'secondary',
  frame = '',
  className = '',
  children,
  ...props
}: ChevronButtonProps<T>) {
  const Frame: ElementType = as ?? 'button';

  return (
    <Frame {...props} className={`arw arw-${size} ${variant === 'primary' ? 'arw-p' : ''} ${frame}`}>
      <ChevronCap side="l" />
      <span className="arw-f">
        <span className="arw-g">
          <span className="arw-r">
            <span className={`arw-c ${className}`}>{children}</span>
          </span>
        </span>
      </span>
      <ChevronCap side="r" />
    </Frame>
  );
}

// Trois chevrons barbelés, du plus petit (contre la plaque) au plus grand (à l'extérieur).
export function ChevronCap({ side }: { side: 'l' | 'r' }) {
  return (
    <span aria-hidden="true" className={`arw-cap arw-cap-${side}`}>
      <svg viewBox="0 0 20 40" preserveAspectRatio="none">
        <path d="M8.8 20 14.08 11.36 11.92 18.43 10.96 20 11.92 21.57 14.08 28.64z" fill="currentColor" opacity=".6" />
        <path d="M4.09 20 12.01 7.04 8.77 17.64 7.33 20 8.77 22.36 12.01 32.96z" fill="currentColor" opacity=".8" />
        <path d="M-2.43 20 8.57 2 4.07 16.73 2.07 20 4.07 23.27 8.57 38z" fill="currentColor" />
      </svg>
    </span>
  );
}
