'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createDomainRenderer, type DomainCharacter } from './domainPixelArt';
import styles from './PixelDomain.module.css';

/** Domain illustrations (BON-6, UI-4), suspended offscreen and for reduced motion (UI-7). */
export default function PixelDomain({ character, showCharacter = true, guide = false, children }: {
  character: DomainCharacter;
  showCharacter?: boolean;
  guide?: boolean;
  children?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createDomainRenderer(canvas, character, showCharacter);
    if (!renderer) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, frame = 0, elapsed = 0;
    let previous: number | null = null;
    let disposed = false;

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previous = null;
    }
    function tick(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || motion.matches) return;
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      renderer!.draw(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function synchronize() {
      stop();
      if (disposed) return;
      if (motion.matches) renderer!.draw(5);
      else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    }

    renderer.draw(5);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    });
    observer.observe(canvas);
    motion.addEventListener?.('change', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      motion.removeEventListener?.('change', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
      renderer.dispose();
    };
  }, [character, showCharacter]);

  return (
    <div aria-hidden="true" data-domain={character} className={`${styles.scene} ${guide ? styles.guide : ''}`}>
      <canvas ref={canvasRef} width={400} height={220} className={styles.canvas} />
      {children}
    </div>
  );
}
