describe('registration API access', () => {
  let eventId: string;

  beforeEach(() => {
    cy.get<string>('@csrfToken').then(csrfToken => cy.request({
      method: 'POST', url: '/api/events', headers: { 'X-CSRF-Token': csrfToken },
      body: {
        title: `Registration access ${Date.now()}`,
        category: 'Community & Civic', event_type: 'public', is_private: false,
        start_date: '2035-12-10T08:00:00Z', end_date: '2035-12-10T17:00:00Z', max_capacity: 100,
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      eventId = body.data.id;
    }));
  });

  const registration = () => ({
    event_id: eventId, attendee_name: 'Untrusted Name', attendee_email: 'untrusted@example.test',
    ticket_type: 'General Admission',
  });

  it('rejects anonymous guest and omitted modes without inserting rows', () => {
    cy.request('/api/auth/session').then(({ body }) => cy.request({
      method: 'POST', url: '/api/auth/logout', headers: { 'X-CSRF-Token': body.csrfToken },
    }));
    for (const mode of ['guest', 'account', undefined]) {
      cy.request({ method: 'POST', url: '/api/attendees/register', failOnStatusCode: false,
        body: { ...registration(), ...(mode ? { registration_mode: mode } : {}) },
      }).its('status').should('eq', 401);
    }
    cy.request(`/api/events/${eventId}`).its('body.data.registration_count').should('eq', 0);
  });
});
