describe('application startup', () => {
  it('hydrates operator login and revokes protected mutations after logout', () => {
    cy.visit('/');
    cy.contains('button', 'Operator logout').should('be.visible').click();
    cy.contains('button', 'Operator login').should('be.visible');
    cy.request({ method: 'POST', url: '/api/events', failOnStatusCode: false, body: {
      title: 'Denied synthetic event', category: 'test',
      start_date: '2031-03-01T10:00:00Z', end_date: '2031-03-01T12:00:00Z',
    } }).its('status').should('eq', 401);
    cy.contains('button', 'Operator login').click();
    cy.env<{ OPERATOR_USERNAME: string; OPERATOR_PASSWORD: string }>(['OPERATOR_USERNAME', 'OPERATOR_PASSWORD'])
      .then(({ OPERATOR_USERNAME, OPERATOR_PASSWORD }) => {
        cy.get('input[aria-label="Operator username"]').type(OPERATOR_USERNAME);
        cy.get('input[aria-label="Operator password"]').type(OPERATOR_PASSWORD);
      });
    cy.contains('button', 'Sign in').click();
    cy.contains('button', 'Operator logout').should('be.visible');
    cy.request('/api/auth/session').its('body.authenticated').should('eq', true);
  });
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
