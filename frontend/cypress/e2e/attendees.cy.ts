interface TestRegistration {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  qr_pass_code: string;
}

describe('attendee registration and check-in', () => {
  let eventId = '';
  let eventTitle = '';

  beforeEach(() => {
    eventTitle = `E2E public attendee event ${Date.now()}`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({ method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken }, body: {
      title: eventTitle,
      description: 'A public event fixture created through the real API for Cypress.',
      category: 'Community & Civic',
      event_type: 'public',
      is_private: false,
      start_date: '2035-12-10T08:00:00Z',
      end_date: '2035-12-10T17:00:00Z',
      organizer_id: 'usr-org-1',
      expected_attendance: 20,
      max_capacity: 100,
      ticket_price: 10,
    } }).then(({ status, body }) => {
      expect(status).to.eq(201);
      eventId = body.data.id;
    }));
  });

  function signInAttendee() {
    const email = `attendee-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
    cy.request('POST', '/api/auth/register', { name: 'Cypress Attendee', email, password: 'attendee-test-secret' })
      .its('status').should('eq', 201);
  }

  function signInOperator() {
    cy.env<{ OPERATOR_USERNAME: string; OPERATOR_PASSWORD: string }>(['OPERATOR_USERNAME', 'OPERATOR_PASSWORD'])
      .then(({ OPERATOR_USERNAME, OPERATOR_PASSWORD }) => {
        cy.request('POST', '/api/auth/login', { username: OPERATOR_USERNAME, password: OPERATOR_PASSWORD });
      });
  }

  function openEventRegistration() {
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('body').then($body => {
      if ($body.find('[data-cy="attendee-mode"]').length) cy.get('[data-cy="attendee-mode"]').click();
    });
    cy.get('[data-cy="event-search"]').type(eventTitle);
    cy.get('[data-cy="event-card"]')
      .contains(eventTitle)
      .closest('[data-cy="event-card"]')
      .find('[data-cy="event-register"]')
      .click();
  }

  function submitRegistration(name: string, email: string) {
    cy.get('[data-cy="registration-name"]').clear().type(name);
    cy.get('[data-cy="registration-email"]').clear().type(email);
    cy.get('[data-cy="registration-submit"]').click();
  }

  it('rejects invalid email, issues distinct PostgreSQL passes, and shows both in the session wallet', () => {
    let firstRegistration: TestRegistration;
    let secondRegistration: TestRegistration;
    const unique = Date.now();
    cy.intercept('POST', '/api/attendees/register').as('register');
    signInAttendee();
    cy.visit('/');
    openEventRegistration();

    cy.get('[data-cy="registration-name"]').clear().type('Cypress Attendee One');
    cy.get('[data-cy="registration-email"]').clear().type('invalid-email');
    cy.get('[data-cy="registration-submit"]').click();
    cy.get('[data-cy="registration-email"]').should(($input) => {
      expect(($input[0] as HTMLInputElement).validity.typeMismatch).to.eq(true);
    });
    cy.get('@register.all').should('have.length', 0);

    submitRegistration('Cypress Attendee One', `cypress-${unique}-one@example.test`);
    cy.wait('@register').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      firstRegistration = response?.body.data;
      expect(firstRegistration.id).to.match(/^reg-[0-9a-f-]{36}$/);
      expect(firstRegistration.qr_pass_code).to.match(/^ZABAY-[A-F0-9]+$/);
      expect(firstRegistration.event_id).to.eq(eventId);
      cy.get('[data-cy="registered-pass-code"]').should('have.text', firstRegistration.qr_pass_code);
      return cy.task('db:registrationState', { registrationId: firstRegistration.id }).then((state) => {
        expect(state).to.include({ id: firstRegistration.id, status: 'confirmed' });
        expect(state).to.have.property('attendance_count', 0);
      });
    });
    cy.contains('Done & View My Passes').click();
    cy.get('[data-cy="digital-pass"]').should('have.length', 1);

    cy.get('[data-cy="browse-events"]').click();
    cy.get('[data-cy="event-search"]').clear().type(eventTitle);
    cy.get('[data-cy="event-card"]')
      .contains(eventTitle)
      .closest('[data-cy="event-card"]')
      .find('[data-cy="event-register"]')
      .click();
    submitRegistration('Cypress Attendee Two', `cypress-${unique}-two@example.test`);
    cy.wait('@register').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      secondRegistration = response?.body.data;
      expect(secondRegistration.qr_pass_code).not.to.eq(firstRegistration.qr_pass_code);
      return cy.task('db:registrationState', { registrationId: secondRegistration.id }).then((state) => {
        expect(state).to.include({ id: secondRegistration.id, status: 'confirmed' });
      });
    });
    cy.contains('Done & View My Passes').click();
    cy.get('[data-cy="my-digital-passes"]').click();
    cy.get('[data-cy="digital-pass"]').should('have.length', 2);
    cy.get('[data-cy="digital-pass-code"]').then(($codes) => {
      expect($codes.eq(0).text()).not.to.eq($codes.eq(1).text());
    });
  });

  it('shows a registration network failure without displaying a pass or success', () => {
    const email = `cypress-failure-${Date.now()}@example.test`;
    cy.intercept('POST', '/api/attendees/register', { forceNetworkError: true }).as('failedRegistration');
    signInAttendee();
    cy.visit('/');
    openEventRegistration();
    submitRegistration('Cypress Network Failure', email);
    cy.wait('@failedRegistration');
    cy.get('[data-cy="registration-error"]').should('be.visible');
    cy.get('[data-cy="registered-pass-code"]').should('not.exist');
    cy.contains('Registration Saved').should('not.exist');
    cy.task('db:registrationCountByEmail', { email }).should('eq', 0);
  });

  it('admits valid passes once, rejects duplicates and unknown codes, and admits another registration independently', () => {
    const unique = Date.now();
    signInAttendee();
    const createRegistration = (number: number) => cy.request('/api/auth/session').then(({ body: session }) => cy.request({ method: 'POST', url: '/api/attendees/register', headers: { 'X-CSRF-Token': session.csrfToken }, body: {
      event_id: eventId,
      attendee_name: `Cypress Check In ${number}`,
      attendee_email: `cypress-checkin-${unique}-${number}@example.test`,
      ticket_type: 'General Admission',
    } })).then(({ status, body }) => {
      expect(status).to.eq(201);
      return body.data as TestRegistration;
    });

    createRegistration(1).as('firstRegistration');
    createRegistration(2).as('secondRegistration');
    signInOperator();
    cy.intercept('POST', '/api/attendees/checkin').as('checkIn');
    cy.visit('/');
    cy.get('[data-cy="gate-scanner-open"]').click();
    cy.get('[data-cy="qr-scanner"] select').select(eventTitle);

    cy.get('[data-cy="manual-pass-code"]').type('E2E-UNKNOWN-PASS');
    cy.get('[data-cy="verify-pass"]').click();
    cy.wait('@checkIn').its('response.statusCode').should('eq', 404);
    cy.get('[data-cy="checkin-result"]').should('contain.text', 'Invalid QR pass code');

    cy.get('@firstRegistration').then((first: TestRegistration) => {
      cy.get('[data-cy="manual-pass-code"]').clear().type(first.qr_pass_code);
      cy.get('[data-cy="verify-pass"]').click();
      cy.wait('@checkIn').its('response.statusCode').should('eq', 200);
      cy.task('db:registrationState', { registrationId: first.id }).then((state) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });

      cy.get('[data-cy="manual-pass-code"]').clear().type(first.qr_pass_code);
      cy.get('[data-cy="verify-pass"]').click();
      cy.wait('@checkIn').its('response.statusCode').should('eq', 409);
      cy.get('[data-cy="checkin-result"]').should('contain.text', 'already been checked in');
      cy.task('db:registrationState', { registrationId: first.id }).then((state) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });
    });

    cy.get('@secondRegistration').then((second: TestRegistration) => {
      cy.get('[data-cy="manual-pass-code"]').clear().type(second.qr_pass_code);
      cy.get('[data-cy="verify-pass"]').click();
      cy.wait('@checkIn').its('response.statusCode').should('eq', 200);
      cy.task('db:registrationState', { registrationId: second.id }).then((state) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });
    });
  });

  it('does not admit a pass when the check-in request fails on the network', () => {
    signInAttendee();
    cy.request('/api/auth/session').then(({ body: session }) => cy.request({ method: 'POST', url: '/api/attendees/register', headers: { 'X-CSRF-Token': session.csrfToken }, body: {
      event_id: eventId,
      attendee_name: 'Cypress Check In Network Failure',
      attendee_email: `cypress-checkin-failure-${Date.now()}@example.test`,
      ticket_type: 'General Admission',
    } })).then(({ status, body }) => {
      expect(status).to.eq(201);
      cy.wrap(body.data).as('createdRegistration');
    });
    signInOperator();
    cy.intercept('POST', '/api/attendees/checkin', { forceNetworkError: true }).as('failedCheckIn');
    cy.visit('/');
    cy.get('[data-cy="gate-scanner-open"]').click();
    cy.get('[data-cy="qr-scanner"] select').select(eventTitle);
    cy.get('@createdRegistration').then((created: TestRegistration) => {
      cy.get('[data-cy="manual-pass-code"]').type(created.qr_pass_code);
      cy.get('[data-cy="verify-pass"]').click();
      cy.wait('@failedCheckIn');
      cy.get('[data-cy="checkin-result"]').should('contain.text', 'Backend API is unavailable. No database change was confirmed.');
      cy.task('db:registrationState', { registrationId: created.id }).then((state) => {
        expect(state).to.include({ status: 'confirmed', attendance_count: 0 });
      });
    });
  });
});
