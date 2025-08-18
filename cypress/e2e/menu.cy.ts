describe('Mobile menu smoke', () => {
  it('opens and closes the menu and updates ARIA', () => {
    cy.viewport(390, 844);
    cy.visit('/');

    cy.findByRole('button', { name: /toggle navigation/i }).as('toggle');

    cy.get('@toggle').should('have.attr', 'aria-expanded', 'false');
    cy.findByRole('menu', { hidden: true }).should('have.attr', 'aria-hidden', 'true');

    cy.get('@toggle').click();
    cy.get('@toggle').should('have.attr', 'aria-expanded', 'true');
    cy.findByRole('menu').should('have.attr', 'aria-hidden', 'false');

    cy.realPress('Escape');
    cy.get('@toggle').should('have.attr', 'aria-expanded', 'false').and('be.focused');
    cy.findByRole('menu', { hidden: true }).should('have.attr', 'aria-hidden', 'true');
  });
});
