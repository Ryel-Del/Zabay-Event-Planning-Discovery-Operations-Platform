describe('organizer event roster', () => {
  let eventId = '';
  let eventTitle = '';
  let passCode = '';
  beforeEach(() => {
    eventTitle = `Organizer roster E2E ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: { title: eventTitle, category: 'Community & Civic', event_type: 'public',
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 50 },
    })).then(({ status, body }) => {
      expect(status).to.eq(201);
      eventId = body.data.id;
      return cy.request({
        method: 'POST', url: '/api/attendees/register',
        body: { event_id: eventId, attendee_name: 'Roster Fixture Guest',
          attendee_email: 'roster-fixture@example.test', ticket_type: 'General Admission',
          registration_mode: 'guest' },
      });
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      passCode = body.data.qr_pass_code;
    });
  });

  const openRoster = () => {
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-picker"]').click();
    cy.contains('button', eventTitle).click();
    cy.contains('button', 'Guest List & Check-In').click();
    cy.contains('Event Attendee & Gate Directory').should('be.visible');
  };

  it('shows server registrations that are not in the local attendee wallet, including after reload', () => {
    cy.intercept('GET', '/api/events/*/registrations*').as('roster');
    openRoster();
    cy.wait('@roster').its('response.statusCode').should('eq', 200);
    cy.contains('Roster Fixture Guest').should('be.visible');
    cy.contains(passCode).should('exist');
    cy.reload();
    cy.get('[data-cy="event-picker"]').click();
    cy.contains('button', eventTitle).click();
    cy.contains('button', 'Guest List & Check-In').click();
    cy.contains('Roster Fixture Guest').should('be.visible');
  });

  it('shows a genuine error and retries instead of displaying wallet rows as a roster', () => {
    let blocked = true;
    cy.intercept('GET', '/api/events/*/registrations*', req => {
      if (blocked) req.reply({ statusCode: 503, body: { success: false, error: 'Simulated roster outage' } });
      else req.continue();
    }).as('rosterFetch');
    openRoster();
    cy.wait('@rosterFetch').its('response.statusCode').should('eq', 503);
    cy.contains('Simulated roster outage').should('be.visible');
    cy.contains('Roster Fixture Guest').should('not.exist');
    cy.then(() => { blocked = false; });
    cy.contains('button', 'Retry').click();
    cy.wait('@rosterFetch').its('response.statusCode').should('eq', 200);
    cy.contains('Roster Fixture Guest').should('be.visible');
  });
});
