describe('application startup', () => {
  it('connects to PostgreSQL and loads seeded venues and halls', () => {
    cy.intercept('GET', '/api/health').as('health');
    cy.intercept('GET', '/api/venues').as('venues');
    cy.intercept('GET', '/api/events').as('events');

    cy.visit('/');
    cy.wait('@health').its('response.statusCode').should('eq', 200);
    cy.wait('@venues').its('response.body.data').should('have.length.greaterThan', 0);
    cy.wait('@events').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');

    cy.get('[data-cy="open-event-wizard"]').click();
    cy.get('[data-cy="event-title"]').type('E2E initialization probe');
    cy.get('[data-cy="wizard-continue"]').click();
    cy.get('[data-cy="event-venue"] option').should('have.length.greaterThan', 1);
    cy.get('[data-cy="event-venue"]').select('ven-6');
    cy.get('[data-cy="event-hall"] option').should('contain.text', 'Harbor View Function Hall');
  });

  it('shows an unavailable state and does not fall back to sample records when the API is offline', () => {
    cy.intercept('GET', '/api/health', { forceNetworkError: true }).as('offlineHealth');

    cy.visit('/');
    cy.wait('@offlineHealth');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Offline');
    cy.get('[data-cy="attendee-mode"]').click();
    cy.get('[data-cy="event-card"]').should('not.exist');
    cy.contains('Sample Mode').should('not.exist');
  });
});
