import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      // Pure logic (*.test.ts): plain Node, no DOM.
      {
        resolve: { alias },
        test: { name: 'unit', environment: 'node', include: ['tests/**/*.test.ts'] },
      },
      // React components (*.test.tsx): jsdom + Testing Library.
      {
        resolve: { alias },
        test: { name: 'components', environment: 'jsdom', include: ['tests/**/*.test.tsx'], setupFiles: ['tests/setup.tsx'] },
      },
    ],
  },
});
