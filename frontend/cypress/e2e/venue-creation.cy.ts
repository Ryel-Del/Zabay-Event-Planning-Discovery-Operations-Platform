describe('live venue creation integrity', () => {
  const openForm = () => {
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.contains('button', 'Venues & Halls').click();
    cy.contains('button', 'Add Facility / Court').click();
  };

  it('shows a failed write and keeps the venue out of local and database lists', () => {
    const name = `Rejected venue ${Date.now()}`;
    cy.intercept('POST', '/api/venues', { statusCode: 503, body: { success: false, error: 'Venue service unavailable' } }).as('rejectedVenue');
    openForm();
    cy.get('input[placeholder="e.g. CPG Sports Complex - Court C"]').type(name);
    cy.contains('button', 'Register Venue / Court').click();
    cy.wait('@rejectedVenue').its('response.statusCode').should('eq', 503);
    cy.get('[data-cy="venue-create-error"]').should('contain.text', 'Venue service unavailable');
    cy.request('/api/venues').its('body.data').should('not.deep.include', { name });
    cy.contains('button', 'Cancel').click();
    cy.contains(name).should('not.exist');
  });

  it('treats a network outcome as unconfirmed and does not retry automatically', () => {
    const name = `Ambiguous venue ${Date.now()}`;
    cy.intercept('POST', '/api/venues', { forceNetworkError: true }).as('unconfirmedVenue');
    openForm();
    cy.get('input[placeholder="e.g. CPG Sports Complex - Court C"]').type(name);
    cy.contains('button', 'Register Venue / Court').click();
    cy.wait('@unconfirmedVenue');
    cy.get('@unconfirmedVenue.all').should('have.length', 1);
    cy.get('[data-cy="venue-create-error"]').should('be.visible');
    cy.contains('button', 'Cancel').click();
    cy.contains(name).should('not.exist');
  });

  it('adds a venue only after the API returns its persisted record', () => {
    const name = `Persisted venue ${Date.now()}`;
    cy.intercept('POST', '/api/venues').as('savedVenue');
    openForm();
    cy.get('input[placeholder="e.g. CPG Sports Complex - Court C"]').type(name);
    cy.contains('button', 'Register Venue / Court').click();
    cy.wait('@savedVenue').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const id = response?.body.data.id;
      expect(id).to.be.a('string');
      cy.request(`/api/venues/${id}`).its('body.data.name').should('eq', name);
    });
    cy.contains(name).should('exist');
  });
});
