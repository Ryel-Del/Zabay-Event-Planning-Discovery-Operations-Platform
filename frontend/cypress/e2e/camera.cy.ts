interface Registration {
  id: string;
  qr_pass_code: string;
}

describe('camera QR check-in', () => {
  it('decodes a backend-issued pass through Chromium video and checks in exactly once per attempt', () => {
    cy.task('camera:registration').then((registrationValue) => {
      const registration = registrationValue as Registration;
      let cameraStream: MediaStream | undefined;
      cy.intercept('POST', '/api/attendees/checkin').as('cameraCheckIn');
      cy.visit('/');
      cy.get('[data-cy="backend-status"]').should('have.text', 'Postgres Live');
      cy.window().then((win) => {
        const nativeGetUserMedia = win.navigator.mediaDevices.getUserMedia.bind(win.navigator.mediaDevices);
        Object.defineProperty(win.navigator, 'mediaDevices', {
          configurable: true,
          value: {
            getUserMedia: async (constraints: MediaStreamConstraints) => {
              cameraStream = await nativeGetUserMedia(constraints);
              return cameraStream;
            },
          },
        });
      });
      cy.get('[data-cy="gate-scanner-open"]').click();
      cy.contains('button', 'Start Webcam Scanner').click();
      cy.wait('@cameraCheckIn').then(({ request, response }) => {
        expect(request.body.qr_pass_code).to.eq(registration.qr_pass_code);
        expect(response?.statusCode).to.eq(200);
      });
      cy.get('[data-cy="manual-pass-code"]').should('have.value', registration.qr_pass_code);
      cy.get('[data-cy="checkin-result"]').should('contain.text', 'Cypress Camera Attendee');
      cy.get('@cameraCheckIn.all').should('have.length', 1);
      cy.then(() => {
        expect(cameraStream?.getVideoTracks()[0].readyState).to.eq('ended');
      });
      cy.get('[data-cy="qr-scanner"] video').should(($video) => {
        expect(($video[0] as HTMLVideoElement).srcObject).to.eq(null);
      });
      cy.task('db:registrationState', { registrationId: registration.id }).then((state) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });
      cy.get('[data-cy="checkin-result"]').should('contain.text', 'Cypress Camera Attendee');
      cy.get('@cameraCheckIn.all').should('have.length', 1);

      cy.contains('button', 'Scan Next Pass').click();
      cy.wait('@cameraCheckIn').then(({ request, response }) => {
        expect(request.body.qr_pass_code).to.eq(registration.qr_pass_code);
        expect(response?.statusCode).to.eq(409);
      });
      cy.get('[data-cy="checkin-result"]').should('contain.text', 'already been checked in');
      cy.get('@cameraCheckIn.all').should('have.length', 2);
      cy.then(() => {
        expect(cameraStream?.getVideoTracks()[0].readyState).to.eq('ended');
      });
      cy.task('db:registrationState', { registrationId: registration.id }).then((state) => {
        expect(state).to.include({ status: 'checked_in', attendance_count: 1 });
      });
    });
  });

  it('releases a live stream and cancels scanning when the scanner closes', () => {
    cy.intercept('POST', '/api/attendees/checkin').as('cameraCheckIn');
    cy.visit('/');
    cy.window().then((win) => {
      const canvas = win.document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvas.getContext('2d')!.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(15);
      const getUserMedia = cy.stub().resolves(stream);
      Object.defineProperty(win.navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia },
      });
      cy.spy(win, 'cancelAnimationFrame').as('cancelFrame');
      cy.get('[data-cy="gate-scanner-open"]').click();
      cy.contains('button', 'Start Webcam Scanner').click();
      cy.wrap(getUserMedia).should('have.been.calledOnce');
      cy.get('[data-cy="qr-scanner"] video').should(($video) => {
        expect(($video[0] as HTMLVideoElement).readyState).to.eq(4);
      });
      cy.get('[data-cy="qr-scanner"] button').first().click();
      cy.get('[data-cy="qr-scanner"]').should('not.exist');
      cy.wrap(stream.getVideoTracks()[0]).its('readyState').should('eq', 'ended');
      cy.get('@cancelFrame').should('have.been.called');
      cy.get('@cameraCheckIn.all').should('have.length', 0);
    });
  });
});
