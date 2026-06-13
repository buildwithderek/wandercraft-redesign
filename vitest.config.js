import { defineConfig } from 'vitest/config';

// JSDOM environment so component renderers (which create DOM nodes)
// and modules that read `document` can run in tests without a browser.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: false,
    reporters: 'default',
  },
});
