beforeEach(() => {
  cy.on('window:before:load', (window) => {
    window.localStorage.removeItem('zabay-demo-mode');
    window.localStorage.removeItem('zabay-theme');
    window.localStorage.removeItem('zabay_custom_personnel');
  });
});
