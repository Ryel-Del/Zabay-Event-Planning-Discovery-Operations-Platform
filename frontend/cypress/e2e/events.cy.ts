const eventDate = '2035-11-20';

function openWizardWithEvent(title: string, hallId = 'vh-trop-harbor', date = eventDate) {
  cy.get('[data-cy="event-picker"]').click();
  cy.get('[data-cy="header-create-event"]').click();
  cy.get('[data-cy="event-title"]').type(title);
  cy.get('[data-cy="wizard-continue"]').click();
  cy.get('[data-cy="event-venue"]').select('ven-6');
  cy.get('[data-cy="event-hall"]').select(hallId);
  cy.get('[data-cy="event-start-date"]').clear().type(date);
  cy.get('[data-cy="event-end-date"]').clear().type(date);
  cy.get('[data-cy="wizard-continue"]').click();
  cy.get('[data-cy="wizard-continue"]').click();
}

describe('event creation and venue booking', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/events').as('createEvent');
    cy.intercept('POST', '/api/venues/ven-6/book').as('bookVenue');
    cy.visit('/');
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
  });

  it('creates an event and booking from the wizard and preserves both after reload', () => {
    const title = `E2E persistence ${Date.now()}`;
    openWizardWithEvent(title);
    cy.get('[data-cy="event-save"]').click();

    cy.wait('@createEvent').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const event = response?.body.data;
      expect(event.id).to.match(/^evt-[0-9a-f-]{36}$/);
      expect(event.title).to.eq(title);
      cy.wrap(event.id).as('persistedEventId');
      return cy.wait('@bookVenue').then(({ response: bookingResponse }) => {
        expect(bookingResponse?.statusCode).to.eq(201);
        return cy.request(`/api/events/${event.id}`).then(({ body }) => {
          expect(body.data.id).to.eq(event.id);
          expect(body.data.venue_id).to.eq('ven-6');
          expect(body.data.hall_id).to.eq('vh-trop-harbor');
          return cy.request('/api/venues/ven-6').then(({ body: venueBody }) => {
            expect(venueBody.data.bookings.some((booking: { event_id: string }) => booking.event_id === event.id)).to.eq(true);
          });
        });
      });
    });

    cy.reload();
    cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
    cy.get('[data-cy="event-picker"]', { timeout: 10000 }).should('contain.text', title);
    cy.get('@persistedEventId').then((eventId) => {
      cy.request(`/api/events/${eventId}`).its('body.data.id').should('eq', eventId);
    });
  });

  it('rejects an overlapping booking, retries the same saved event in another hall, and resets the closed wizard', () => {
    const firstTitle = `E2E conflict holder ${Date.now()}`;
    const retryTitle = `E2E conflict retry ${Date.now()}`;
    openWizardWithEvent(firstTitle, 'vh-trop-harbor', '2035-11-21');
    cy.get('[data-cy="event-save"]').click();
    cy.wait('@createEvent').its('response.statusCode').should('eq', 201);
    cy.wait('@bookVenue').its('response.statusCode').should('eq', 201);

    openWizardWithEvent(retryTitle, 'vh-trop-harbor', '2035-11-21');
    cy.get('[data-cy="event-save"]').click();
    cy.wait('@createEvent').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const eventId = response?.body.data.id as string;
      cy.wrap(eventId).as('retryEventId');

      return cy.wait('@bookVenue').then(({ response: bookingResponse }) => {
        expect(bookingResponse?.statusCode).to.eq(409);
        cy.get('[data-cy="saved-planning-event"]').should('contain.text', eventId);
        cy.get('[data-cy="event-submit-error"]').should('be.visible');
        return cy.request(`/api/events/${eventId}`).then(({ body }) => {
          expect(body.data.status).to.eq('planning');
          expect(body.data.venue_id).to.equal(null);
        });
      });
    });

    cy.get('[data-cy="event-hall"]').select('vh-trop-dagohoy');
    cy.get('[data-cy="wizard-continue"]').click();
    cy.get('[data-cy="wizard-continue"]').click();
    cy.get('[data-cy="event-save"]').click();
    cy.wait('@bookVenue').its('response.statusCode').should('eq', 201);

    cy.get('@retryEventId').then((eventId) => {
      cy.request(`/api/events/${eventId}`).then(({ body }) => {
        expect(body.data.id).to.eq(eventId);
        expect(body.data.hall_id).to.eq('vh-trop-dagohoy');
      });
      cy.request('/api/events').then(({ body }) => {
        expect(body.data.filter((event: { title: string }) => event.title === retryTitle)).to.have.length(1);
      });
    });

    cy.get('[data-cy="event-picker"]').click();
    cy.get('[data-cy="header-create-event"]').click();
    cy.get('[data-cy="event-title"]').should('have.value', '');
    cy.get('[data-cy="saved-planning-event"]').should('not.exist');
  });

  it('keeps a conflicting event in planning and creates a new event after closing and reopening', () => {
    const unique = Date.now();
    const titleA = `E2E recovery A ${unique}`;
    const titleB = `E2E recovery B ${unique}`;
    const titleC = `E2E recovery C ${unique}`;

    openWizardWithEvent(titleA, 'vh-trop-harbor', '2035-11-23');
    cy.get('[data-cy="event-save"]').click();
    cy.wait('@createEvent').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const eventA = response!.body.data.id as string;
      cy.wait('@bookVenue').its('response.statusCode').should('eq', 201);
      cy.task('db:eventBookingState', { eventId: eventA }).then((state) => {
        expect(state).to.include({ hall_id: 'vh-trop-harbor', booking_count: 1 });
      });
    });

    openWizardWithEvent(titleB, 'vh-trop-harbor', '2035-11-23');
    cy.get('[data-cy="event-save"]').click();
    cy.wait('@createEvent').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const eventB = response!.body.data.id as string;
      cy.wait('@bookVenue').then(({ response: bookingResponse }) => {
        expect(bookingResponse?.statusCode).to.eq(409);
        cy.get('[data-cy="saved-planning-event"]').should('contain.text', eventB);
        cy.get('[data-cy="event-submit-error"]').should('be.visible');
        cy.task('db:eventBookingState', { eventId: eventB }).then((state) => {
          expect(state).to.include({ id: eventB, status: 'planning', venue_id: null, hall_id: null, booking_count: 0 });
        });
      });

      cy.get('[data-cy="event-wizard"] button').first().click();
      cy.get('[data-cy="event-wizard"]').should('not.exist');
      cy.get('[data-cy="event-picker"]').click();
      cy.get('[data-cy="header-create-event"]').click();
      cy.get('[data-cy="event-title"]').should('have.value', '');
      cy.get('[data-cy="saved-planning-event"]').should('not.exist');
      cy.get('[data-cy="event-title"]').type(titleC);
      cy.get('[data-cy="wizard-continue"]').click();
      cy.get('[data-cy="event-venue"]').select('ven-6');
      cy.get('[data-cy="event-hall"]').select('vh-trop-dagohoy');
      cy.get('[data-cy="event-start-date"]').clear().type('2035-11-23');
      cy.get('[data-cy="event-end-date"]').clear().type('2035-11-23');
      cy.get('[data-cy="wizard-continue"]').click();
      cy.get('[data-cy="wizard-continue"]').click();
      cy.get('[data-cy="event-save"]').click();
      cy.wait('@createEvent').then(({ response: responseC }) => {
        expect(responseC?.statusCode).to.eq(201);
        const eventC = responseC!.body.data.id as string;
        expect(eventC).not.to.eq(eventB);
        cy.wait('@bookVenue').its('response.statusCode').should('eq', 201);
        cy.task('db:eventBookingState', { eventId: eventC }).then((state) => {
          expect(state).to.include({ id: eventC, hall_id: 'vh-trop-dagohoy', booking_count: 1 });
        });
        cy.task('db:eventBookingState', { eventId: eventB }).then((state) => {
          expect(state).to.include({ id: eventB, status: 'planning', booking_count: 0 });
        });
        cy.request('/api/events').then(({ body }) => {
          expect(body.data.filter((event: { title: string }) => event.title === titleB))
            .to.have.length(1);
          expect(body.data.filter((event: { title: string }) => event.title === titleC))
            .to.have.length(1);
        });
      });
    });
  });

  it('reports a booking network failure without claiming a reservation succeeded', () => {
    const title = `E2E booking network failure ${Date.now()}`;
    cy.intercept('POST', '/api/venues/ven-6/book', { forceNetworkError: true }).as('failedBooking');
    openWizardWithEvent(title, 'vh-trop-harbor', '2035-11-22');
    cy.get('[data-cy="event-save"]').click();

    cy.wait('@createEvent').then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      const eventId = response?.body.data.id as string;
      return cy.wait('@failedBooking').then(() => {
        cy.get('[data-cy="saved-planning-event"]').should('contain.text', eventId);
        cy.get('[data-cy="event-submit-error"]').should('contain.text', 'was saved in planning');
        cy.request(`/api/events/${eventId}`).then(({ body }) => {
          expect(body.data.status).to.eq('planning');
          expect(body.data.venue_id).to.equal(null);
        });
        cy.get('[data-cy="event-submit-error"]').should('not.contain.text', 'booking confirmed');
      });
    });
  });
});
