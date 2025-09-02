describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on app launch', async () => {
    await expect(element(by.text('Inloggen'))).toBeVisible();
    await expect(element(by.text('E-mail'))).toBeVisible();
    await expect(element(by.text('Wachtwoord'))).toBeVisible();
  });

  it('should navigate to signup screen', async () => {
    await element(by.text('Nog geen account?')).tap();
    await expect(element(by.text('Registreren'))).toBeVisible();
    await expect(element(by.text('E-mail'))).toBeVisible();
    await expect(element(by.text('Wachtwoord'))).toBeVisible();
    await expect(element(by.text('Bevestig wachtwoord'))).toBeVisible();
  });

  it('should show password strength indicator', async () => {
    await element(by.text('Nog geen account?')).tap();
    
    const passwordInput = element(by.placeholder('Wachtwoord'));
    await passwordInput.tap();
    await passwordInput.typeText('weak');
    
    // Should show weak password indicator
    await expect(element(by.text('Zwak'))).toBeVisible();
    
    // Type stronger password
    await passwordInput.clearText();
    await passwordInput.typeText('StrongPassword123!');
    
    // Should show strong password indicator
    await expect(element(by.text('Sterk'))).toBeVisible();
  });

  it('should validate required fields', async () => {
    await element(by.text('Nog geen account?')).tap();
    
    // Try to submit without filling fields
    await element(by.text('Registreren')).tap();
    
    // Should show validation errors
    await expect(element(by.text('E-mail is verplicht'))).toBeVisible();
    await expect(element(by.text('Wachtwoord is verplicht'))).toBeVisible();
  });

  it('should handle successful registration', async () => {
    await element(by.text('Nog geen account?')).tap();
    
    // Fill in registration form
    await element(by.placeholder('E-mail')).typeText('test@example.com');
    await element(by.placeholder('Wachtwoord')).typeText('StrongPassword123!');
    await element(by.placeholder('Bevestig wachtwoord')).typeText('StrongPassword123!');
    
    // Submit form
    await element(by.text('Registreren')).tap();
    
    // Should show success message or redirect
    await expect(element(by.text('Account aangemaakt'))).toBeVisible();
  });

  it('should handle login with valid credentials', async () => {
    // Navigate back to login
    await element(by.text('Al een account?')).tap();
    
    // Fill in login form
    await element(by.placeholder('E-mail')).typeText('test@example.com');
    await element(by.placeholder('Wachtwoord')).typeText('StrongPassword123!');
    
    // Submit form
    await element(by.text('Inloggen')).tap();
    
    // Should navigate to main app
    await expect(element(by.text('Welkom bij Straat-Praat'))).toBeVisible();
  });

  it('should handle login with invalid credentials', async () => {
    // Fill in login form with invalid credentials
    await element(by.placeholder('E-mail')).typeText('invalid@example.com');
    await element(by.placeholder('Wachtwoord')).typeText('WrongPassword');
    
    // Submit form
    await element(by.text('Inloggen')).tap();
    
    // Should show error message
    await expect(element(by.text('Ongeldige inloggegevens'))).toBeVisible();
  });

  it('should show forgot password option', async () => {
    await expect(element(by.text('Wachtwoord vergeten?'))).toBeVisible();
    
    await element(by.text('Wachtwoord vergeten?')).tap();
    
    // Should navigate to password reset screen
    await expect(element(by.text('Wachtwoord resetten'))).toBeVisible();
    await expect(element(by.placeholder('E-mail'))).toBeVisible();
  });

  it('should handle password reset request', async () => {
    await element(by.text('Wachtwoord vergeten?')).tap();
    
    // Enter email for password reset
    await element(by.placeholder('E-mail')).typeText('test@example.com');
    await element(by.text('Reset wachtwoord')).tap();
    
    // Should show success message
    await expect(element(by.text('Reset e-mail verzonden'))).toBeVisible();
  });
});
