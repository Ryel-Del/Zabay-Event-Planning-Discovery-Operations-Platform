describe('database-backed registration wallet', () => {
  it('prompts guests to sign in and continues registration for the chosen event', () => {
    const unique = Date.now();
    const title = `Guest sign-in event ${unique}`;
    const email = `guest-flow-${unique}@example.test`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: { title, category: 'Community & Civic', event_type: 'public', is_private: false,
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 100 },
    }).its('status').should('eq', 201));
    cy.request('POST', '/api/auth/register', { name: 'Guest Flow Owner', email, password: 'guest-flow-secret' });
    cy.request('/api/auth/session').then(({ body }) => cy.request({ method: 'POST', url: '/api/auth/logout', headers: { 'X-CSRF-Token': body.csrfToken } }));
    cy.visit('/');
    cy.get('[data-cy="event-search"]').type(title);
    cy.get('[data-cy="event-card"]').contains(title).closest('[data-cy="event-card"]').find('[data-cy="event-register"]').click();
    cy.get('[data-cy="registration-signin-prompt"]').should('contain.text', title);
    cy.get('[data-cy="registration-form"]').should('not.exist');
    cy.get('input[placeholder="name@organization.ph"]').type(email);
    cy.get('input[placeholder="Enter secure password..."]').type('guest-flow-secret');
    cy.contains('button', 'Sign In to Workspace').click();
    cy.get('[data-cy="registration-form"]').should('contain.text', title);
  });

  it('retrieves a pass in a second browser session and hides it from another account', () => {
    const unique = Date.now();
    const email = `wallet-${unique}@example.test`;
    const otherEmail = `wallet-other-${unique}@example.test`;
    const password = 'wallet-test-secret';
    const eventTitle = `Wallet event ${unique}`;
    let code = '';
    let accountId = '';

    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: {
        title: eventTitle, category: 'Community & Civic', event_type: 'public', is_private: false,
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z',
        expected_attendance: 20, max_capacity: 100, ticket_price: 0,
      },
    }).its('status').should('eq', 201));
    cy.request('POST', '/api/auth/register', { name: 'Wallet Owner', email, password })
      .then(({ body }) => { accountId = body.user.id; });
    cy.request('POST', '/api/auth/register', { name: 'Another Wallet Owner', email: otherEmail, password });

    const useDevice = (device: string, loginEmail: string) => cy.session(`${unique}-${device}`, () => {
      cy.request('POST', '/api/auth/user-login', { email: loginEmail, password })
        .its('status').should('eq', 200);
    });

    useDevice('first', email);
    cy.intercept('POST', '/api/attendees/register').as('registration');
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-search"]').type(eventTitle);
    cy.get('[data-cy="event-card"]').contains(eventTitle).closest('[data-cy="event-card"]')
      .find('[data-cy="event-register"]').click();
    cy.get('[data-cy="registration-name"]').clear().type('A Different Display Name');
    cy.get('[data-cy="registration-email"]').clear().type(otherEmail);
    cy.get('[data-cy="registration-submit"]').click();
    cy.wait('@registration').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.data.attendee_id).to.eq(accountId);
      code = response?.body.data.qr_pass_code;
      return cy.task('db:registrationState', { registrationId: response?.body.data.id })
        .then(state => expect(state).to.include({ qr_pass_code: code }));
    });
    cy.contains('Done & View My Passes').click();
    cy.get('[data-cy="digital-pass-code"]').should('contain.text', code);

    useDevice('second', email);
    cy.visit('/');
    cy.get('[data-cy="my-digital-passes"]').click();
    cy.get('[data-cy="digital-pass-code"]').should('contain.text', code);
    cy.reload();
    cy.get('[data-cy="my-digital-passes"]').click();
    cy.get('[data-cy="digital-pass-code"]').should('contain.text', code);

    useDevice('other', otherEmail);
    cy.visit('/');
    cy.get('[data-cy="my-digital-passes"]').click();
    cy.get('[data-cy="digital-pass"]').should('not.exist');
  });

  it('does not show a successful registration after a failed backend write', () => {
    const eventTitle = `Wallet failure event ${Date.now()}`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: { title: eventTitle, category: 'Community & Civic', event_type: 'public', is_private: false,
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 100 },
    }));
    cy.clearCookie('zabay_session');
    cy.request('POST', '/api/auth/register', { name: 'Wallet Failure', email: `wallet-failure-${Date.now()}@example.test`, password: 'wallet-test-secret' });
    cy.intercept('POST', '/api/attendees/register', { forceNetworkError: true }).as('failedWrite');
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-search"]').type(eventTitle);
    cy.get('[data-cy="event-card"]').contains(eventTitle).closest('[data-cy="event-card"]')
      .find('[data-cy="event-register"]').click();
    cy.get('[data-cy="registration-name"]').clear().type('Wallet Failure');
    cy.get('[data-cy="registration-email"]').clear().type('failure@example.test');
    cy.get('[data-cy="registration-submit"]').click();
    cy.wait('@failedWrite');
    cy.get('[data-cy="registration-error"]').should('be.visible');
    cy.get('[data-cy="registered-pass-code"]').should('not.exist');
  });

  it('rejects an account registration after its backend session ends without creating a guest row', () => {
    const unique = Date.now();
    const email = `expired-wallet-${unique}@example.test`;
    const eventTitle = `Expired wallet event ${unique}`;
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: { title: eventTitle, category: 'Community & Civic', event_type: 'public', is_private: false,
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 100 },
    }).its('status').should('eq', 201));
    cy.request('POST', '/api/auth/register', { name: 'Expiring Wallet Owner', email, password: 'wallet-test-secret' });
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-search"]').type(eventTitle);
    cy.get('[data-cy="event-card"]').contains(eventTitle).closest('[data-cy="event-card"]')
      .find('[data-cy="event-register"]').click();
    cy.request('/api/auth/session').then(({ body }) => {
      expect(body.authenticated).to.eq(true);
      return cy.request({ method: 'POST', url: '/api/auth/logout', headers: { 'X-CSRF-Token': body.csrfToken } });
    });
    cy.intercept('GET', '/api/auth/me').as('expiredSessionCheck');
    cy.get('[data-cy="registration-name"]').clear().type('Expiring Wallet Owner');
    cy.get('[data-cy="registration-email"]').clear().type(email);
    cy.get('[data-cy="registration-submit"]').click();
    cy.wait('@expiredSessionCheck').then(({ response }) => {
      expect(response?.statusCode).to.eq(401);
    });
    cy.get('[data-cy="registration-error"]').should('contain.text', 'session expired');
    cy.get('[data-cy="registered-pass-code"]').should('not.exist');
    cy.task('db:registrationCountByEmail', { email }).should('eq', 0);
  });

  it('starts live mode without sample events when the API is offline and clean slate was never set', () => {
    cy.intercept('GET', '/api/health', { forceNetworkError: true }).as('offlineHealth');
    cy.visit('/', { onBeforeLoad(window) { window.localStorage.removeItem('zabay-clean-slate'); } });
    cy.wait('@offlineHealth');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Offline');
    cy.get('[data-cy="event-load-error"]').should('be.visible').contains('Retry');
    cy.get('[data-cy="event-card"]').should('not.exist');
  });

  it('reports a wallet retrieval failure and reloads passes on retry', () => {
    const email = `wallet-retry-${Date.now()}@example.test`;
    cy.request('POST', '/api/auth/register', { name: 'Wallet Retry Owner', email, password: 'wallet-test-secret' });
    let failing = true;
    cy.intercept('GET', '/api/attendees/registrations/me', req => {
      if (failing) req.reply({ statusCode: 503, body: { success: false, error: 'Unavailable' } });
      else req.continue();
    }).as('walletRequest');
    cy.visit('/');
    cy.get('[data-cy="my-digital-passes"]').click();
    cy.get('[data-cy="wallet-load-error"]').should('be.visible');
    cy.contains('No Registered Passes').should('not.exist');
    cy.then(() => { failing = false; });
    cy.get('[data-cy="wallet-load-error"]').contains('button', 'Retry').click();
    cy.get('[data-cy="wallet-load-error"]').should('not.exist');
    cy.contains('No Registered Passes').should('be.visible');
  });
});
