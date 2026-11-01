import type { ComponentProps, ElementType, ReactNode } from 'react';

type ChevronOrder = 'increasing' | 'decreasing';

type ChevronButtonProps<T extends ElementType> = {
  /** Élément du bouton (`button` par défaut) : `Link`, 'a', `SmoothScrollLink`… Il reçoit les autres props. */
  as?: T;
  /** `sm` : 40px de haut (langue) ; `md` : 56px (actions). */
  size?: 'sm' | 'md';
  /** `primary` : face cramoisie ; `secondary` : face sombre. */
  variant?: 'primary' | 'secondary';
  /** `true` : chevrons des deux côtés ; `'right'` : à droite seulement ; `false` : la plaque seule. */
  chevrons?: boolean | 'right';
  /** `increasing` : les chevrons grandissent vers l'extérieur ; `decreasing` : le plus grand contre la plaque. */
  order?: ChevronOrder;
  /** Classes du cadre : largeur, alignement, `group`… */
  frame?: string;
  /** Classes de la face : typographie, écart du contenu. */
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, 'as' | 'className' | 'children'>;

// Bouton-flèche (canvas « Flèches stylisées · croissant ») : une plaque à bouts pointus, bordée d'un double filet,
// flanquée de trois chevrons qui s'écartent au survol (styles `.arw` dans globals.css).
export default function ChevronButton<T extends ElementType = 'button'>({
  as,
  size = 'md',
  variant = 'secondary',
  chevrons = true,
  order = 'increasing',
  frame = '',
  className = '',
  children,
  ...props
}: ChevronButtonProps<T>) {
  const Frame: ElementType = as ?? 'button';
  const padding = chevrons === false ? 'arw-bare' : chevrons === 'right' ? 'arw-right' : '';

  return (
    <Frame {...props} className={`arw arw-${size} ${variant === 'primary' ? 'arw-p' : ''} ${padding} ${frame}`}>
      {chevrons === true && <ChevronCap side="l" order={order} />}
      <span className="arw-f">
        <span className="arw-g">
          <span className="arw-r">
            <span className={`arw-c ${className}`}>{children}</span>
          </span>
        </span>
      </span>
      {chevrons !== false && <ChevronCap side="r" order={order} />}
    </Frame>
  );
}

export function ChevronCap({ side, order = 'increasing' }: { side: 'l' | 'r'; order?: ChevronOrder }) {
  return (
    <span aria-hidden="true" className={`arw-cap arw-cap-${side}`}>
      <Chevrons order={order} />
    </span>
  );
}

// Trois chevrons barbelés pointés vers la gauche, dans la couleur du texte ; la taille vient des classes.
// `increasing` : du plus petit (contre la plaque, à droite) au plus grand (à l'extérieur) ; `decreasing` : l'inverse.
export function Chevrons({ order = 'increasing', className = '' }: { order?: ChevronOrder; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 40" preserveAspectRatio="none" className={`overflow-visible ${className}`}>
      {order === 'increasing' ? (
        <>
          <path d="M8.8 20 14.08 11.36 11.92 18.43 10.96 20 11.92 21.57 14.08 28.64z" fill="currentColor" opacity=".6" />
          <path d="M4.09 20 12.01 7.04 8.77 17.64 7.33 20 8.77 22.36 12.01 32.96z" fill="currentColor" opacity=".8" />
          <path d="M-2.43 20 8.57 2 4.07 16.73 2.07 20 4.07 23.27 8.57 38z" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M5 20 16 2 11.5 16.73 9.5 20 11.5 23.27 16 38z" fill="currentColor" />
          <path d="M-1.51 20 6.41 7.04 3.17 17.64 1.73 20 3.17 22.36 6.41 32.96z" fill="currentColor" opacity=".8" />
          <path d="M-6.23 20-.95 11.36-3.11 18.43-4.07 20-3.11 21.57-.95 28.64z" fill="currentColor" opacity=".6" />
        </>
      )}
    </svg>
  );
}
