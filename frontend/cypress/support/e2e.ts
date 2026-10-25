beforeEach(() => {
  cy.on('window:before:load', (window) => {
    window.localStorage.setItem('zabay-clean-slate', 'true');
    window.localStorage.setItem('zabay-demo-mode', 'false');
    window.localStorage.removeItem('zabay-theme');
    window.localStorage.removeItem('zabay_custom_personnel');
  });
  cy.env<{ OPERATOR_USERNAME: string; OPERATOR_PASSWORD: string }>(['OPERATOR_USERNAME', 'OPERATOR_PASSWORD'])
    .then(({ OPERATOR_USERNAME, OPERATOR_PASSWORD }) => {
      cy.request('POST', '/api/auth/login', { username: OPERATOR_USERNAME, password: OPERATOR_PASSWORD })
        .then(({ body }) => {
          expect(body.authenticated).to.eq(true);
          expect(body.csrfToken).to.match(/^[a-f0-9]{64}$/);
          cy.wrap(body.csrfToken).as('csrfToken');
        });
      cy.request('/api/auth/session').its('body').should('include', {
        authenticated: true,
        operator: true,
      });
    });
});
