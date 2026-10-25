describe('organizer event roster', () => {
  let eventId = '';
  let eventTitle = '';
  let passCode = '';
  let registrationId = '';
  let attendeeEmail = '';
  beforeEach(() => {
    eventTitle = `Organizer roster E2E ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    attendeeEmail = `roster-fixture-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.test`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: { title: eventTitle, category: 'Community & Civic', event_type: 'public',
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 50 },
    })).then(({ status, body }) => {
      expect(status).to.eq(201);
      eventId = body.data.id;
      return cy.request('POST', '/api/auth/register', {
        name: 'Roster Fixture Guest',
        email: attendeeEmail,
        password: 'roster-test-secret-long',
      }).then(({ status }) => { expect(status).to.eq(201); });
    }).then(() => cy.request('/api/auth/session')).then(({ body: session }) => {
      return cy.request({
        method: 'POST', url: '/api/attendees/register',
        headers: { 'X-CSRF-Token': session.csrfToken,
          Origin: Cypress.config('baseUrl') || 'http://127.0.0.1:5174' },
        body: { event_id: eventId, attendee_name: 'Roster Fixture Guest',
          attendee_email: attendeeEmail, ticket_type: 'General Admission',
          registration_mode: 'account' },
      });
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      passCode = body.data.qr_pass_code;
      registrationId = body.data.id;
      return cy.env<{ OPERATOR_USERNAME: string; OPERATOR_PASSWORD: string }>(['OPERATOR_USERNAME', 'OPERATOR_PASSWORD'])
        .then(({ OPERATOR_USERNAME, OPERATOR_PASSWORD }) => cy.request('POST', '/api/auth/login',
          { username: OPERATOR_USERNAME, password: OPERATOR_PASSWORD }));
    });
  });

  const openRoster = () => {
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-picker"]').click();
    cy.contains('span', 'Switch Managed Event').closest('div.absolute').contains('button', eventTitle).click();
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
    cy.contains('span', 'Switch Managed Event').closest('div.absolute').contains('button', eventTitle).click();
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
    // The overview and directory can request the same endpoint independently.
    // A queued failed alias must not masquerade as the retry response.
    cy.contains('Roster Fixture Guest').should('be.visible');
    cy.get('@rosterFetch.all').should(requests => {
      expect(requests.some(request => request.response?.statusCode === 200)).to.eq(true);
    });
  });

  it('quick admission updates the database and re-fetches the event roster', () => {
    cy.intercept('GET', '/api/events/*/registrations*').as('rosterRead');
    cy.intercept('POST', '/api/attendees/checkin').as('admission');
    openRoster();
    cy.wait('@rosterRead');
    cy.contains('tr', 'Roster Fixture Guest').contains('button', 'Admit').click();
    cy.wait('@admission').its('response.statusCode').should('eq', 200);
    cy.wait('@rosterRead').its('response.statusCode').should('eq', 200);
    cy.contains('tr', 'Roster Fixture Guest').should('contain.text', 'Checked in');
    cy.contains('tr', 'Roster Fixture Guest').contains('button', 'Admit').should('not.exist');
    cy.task('db:registrationState', { registrationId }).then(state => {
      expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
    });
  });
});
