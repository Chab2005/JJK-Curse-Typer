import type { ReactNode } from 'react';

// Superpose toutes les variantes dans la même case : la boîte prend la taille de la plus grande,
// et passer d'une variante à l'autre ne déplace ni ne redimensionne rien autour.
export default function Reserve<K extends string>({ variants, active, className = '' }: { variants: Record<K, ReactNode>; active: NoInfer<K>; className?: string }) {
  return (
    <div className={`grid ${className}`}>
      {(Object.keys(variants) as K[]).map((key) => (
        <div key={key} aria-hidden={key === active ? undefined : true} inert={key !== active} className={`col-start-1 row-start-1 ${key === active ? '' : 'invisible'}`}>
          {variants[key]}
        </div>
      ))}
    </div>
  );
}
