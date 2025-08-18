import 'cypress-real-events/support';
import '@testing-library/cypress/add-commands';

// Ensure frontend renders main UI during e2e by mocking installation status
// This avoids relying on the backend for initial routing.
beforeEach(() => {
	cy.intercept('GET', '**/api/installation/status', {
		statusCode: 200,
		body: { installed: true },
	}).as('installationStatus');
});
