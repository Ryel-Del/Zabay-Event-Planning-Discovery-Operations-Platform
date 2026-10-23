beforeEach(() => {
  cy.on('window:before:load', (window) => {
    window.localStorage.removeItem('zabay-demo-mode');
    window.localStorage.removeItem('zabay-theme');
    window.localStorage.removeItem('zabay_custom_personnel');
  });
  cy.env<{ OPERATOR_USERNAME: string; OPERATOR_PASSWORD: string }>(['OPERATOR_USERNAME', 'OPERATOR_PASSWORD'])
    .then(({ OPERATOR_USERNAME, OPERATOR_PASSWORD }) => {
      cy.request('POST', '/api/auth/login', { username: OPERATOR_USERNAME, password: OPERATOR_PASSWORD })
        .its('body.csrfToken').as('csrfToken');
    });
});
