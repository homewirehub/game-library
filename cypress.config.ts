import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
  // Use Vite preview default port to match the root test:e2e script
  baseUrl: 'http://localhost:4173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    screenshotOnRunFailure: true,
  },
});
