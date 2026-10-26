describe('organizer PostgreSQL attendee directory', () => {
  let eventId = '';
  let title = '';

  function selectEventRoster() {
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-picker"]').click();
    cy.contains('button', title).click();
    cy.contains('button', 'Guest List & Check-In').click();
    cy.get('[data-cy="organizer-roster"]').should('be.visible');
  }

  function registerSyntheticGuest() {
    cy.task('db:createSyntheticRosterPass', { eventId })
      .then(registration => cy.wrap(registration).as('createdRosterPass'));
  }

  beforeEach(() => {
    title = 'Cypress roster event ' + Date.now();
    cy.get<string>('@csrfToken').then(csrfToken =>
      cy.request({
        method: 'POST', url: '/api/events',
        headers: { 'X-CSRF-Token': csrfToken },
        body: {
          title, category: 'Community & Civic', event_type: 'public', is_private: false,
          start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z',
          max_capacity: 100, ticket_price: 0,
        },
      }).then(({ status, body }) => {
        expect(status).to.eq(201);
        eventId = body.data.id;
      })
    );
  });

  it('distinguishes an API failure from an empty roster and retries', () => {
    let failFirst = true;
    cy.intercept('GET', '/api/events/' + eventId + '/registrations*', req => {
      if (failFirst) {
        req.reply({ statusCode: 503, body: { success: false, error: 'Temporary roster outage' } });
      } else req.continue();
    }).as('rosterFetch');
    selectEventRoster();
    cy.wait('@rosterFetch').its('response.statusCode').should('eq', 503);
    cy.get('[data-cy="roster-error"]').should('contain.text', 'Temporary roster outage');
    cy.get('[data-cy="roster-empty"]').should('not.exist');
    cy.then(() => { failFirst = false; });
    cy.get('[data-cy="roster-error"]').contains('button', 'Retry roster').click();
    // An in-flight StrictMode fetch can leave another captured 503 in the alias queue.
    // Assert the state visible to the organizer after retry instead of alias order.
    cy.get('[data-cy="roster-empty"]').should('contain.text', 'No registrations for this event.');
    cy.get('[data-cy="roster-error"]').should('not.exist');
  });

  it('shows persisted attendee details after refresh and rejects uncertain admissions', () => {
    registerSyntheticGuest();
    selectEventRoster();
    cy.get('[data-cy="roster-row"]').should('have.length', 1).and('contain.text', 'Browser Roster Attendee');
    cy.get('[data-cy="roster-row"]').should('contain.text', 'VIP Access');
    cy.reload();
    cy.get('[data-cy="event-picker"]').click();
    cy.contains('button', title).click();
    cy.contains('button', 'Guest List & Check-In').click();
    cy.get('[data-cy="roster-row"]').should('have.length', 1);
    cy.intercept('POST', '/api/attendees/checkin', { forceNetworkError: true }).as('refusedAdmission');
    cy.get('[data-cy="roster-admit"]').click();
    cy.wait('@refusedAdmission');
    cy.get('[data-cy="organizer-roster"] [role="status"]').should('not.contain.text', 'Admission confirmed');
    cy.get('[data-cy="roster-row"]').should('contain.text', 'Confirmed');
    cy.get('@createdRosterPass').then((registration: any) => {
      cy.task('db:registrationState', { registrationId: registration.id }).then((state: any) => {
        expect(state).to.include({ status: 'confirmed', attendance_count: 0 });
      });
    });
  });

  it('updates the confirmed admission in PostgreSQL and refreshes the roster', () => {
    registerSyntheticGuest();
    cy.intercept('GET', '/api/events/' + eventId + '/registrations*').as('rosterFetch');
    cy.intercept('POST', '/api/attendees/checkin').as('admit');
    selectEventRoster();
    cy.wait('@rosterFetch');
    cy.get('[data-cy="roster-admit"]').click();
    cy.wait('@admit').its('response.statusCode').should('eq', 200);
    cy.wait('@rosterFetch');
    cy.get('[data-cy="roster-row"]').should('contain.text', 'Checked in');
    cy.get('[data-cy="roster-admit"]').should('not.exist');
    cy.get('@createdRosterPass').then((registration: any) => {
      cy.task('db:registrationState', { registrationId: registration.id }).then((state: any) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });
    });
  });
});
