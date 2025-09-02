describe('MFA Setup and Verification', () => {
  beforeAll(async () => {
    await device.launchApp();
    
    // Login first
    await element(by.placeholder('E-mail')).typeText('test@example.com');
    await element(by.placeholder('Wachtwoord')).typeText('StrongPassword123!');
    await element(by.text('Inloggen')).tap();
    
    // Wait for login to complete
    await waitFor(element(by.text('Welkom bij Straat-Praat'))).toBeVisible().withTimeout(5000);
  });

  beforeEach(async () => {
    // Navigate to profile/settings
    await element(by.text('Profiel')).tap();
    await waitFor(element(by.text('Beveiliging'))).toBeVisible().withTimeout(3000);
    await element(by.text('Beveiliging')).tap();
  });

  it('should show MFA setup option', async () => {
    await expect(element(by.text('Twee-factor authenticatie'))).toBeVisible();
    await expect(element(by.text('Verhoog de beveiliging van je account'))).toBeVisible();
  });

  it('should start MFA setup process', async () => {
    await element(by.text('Instellen')).tap();
    
    // Should show QR code and secret
    await expect(element(by.text('Scan de QR-code'))).toBeVisible();
    await expect(element(by.text('Geheime sleutel'))).toBeVisible();
    
    // Should show backup codes option
    await expect(element(by.text('Backup codes genereren'))).toBeVisible();
  });

  it('should generate backup codes', async () => {
    await element(by.text('Instellen')).tap();
    await element(by.text('Backup codes genereren')).tap();
    
    // Should show backup codes
    await expect(element(by.text('Backup codes'))).toBeVisible();
    await expect(element(by.text('Bewaar deze codes veilig'))).toBeVisible();
    
    // Should show 8 backup codes
    const backupCodes = element(by.id('backup-codes'));
    await expect(backupCodes).toBeVisible();
    
    // Verify codes are generated
    await expect(element(by.text('ABC12345'))).toBeVisible();
    await expect(element(by.text('DEF67890'))).toBeVisible();
  });

  it('should verify TOTP code', async () => {
    await element(by.text('Instellen')).tap();
    
    // Enter TOTP code
    const totpInput = element(by.placeholder('Voer 6-cijferige code in'));
    await totpInput.tap();
    await totpInput.typeText('123456');
    
    // Submit verification
    await element(by.text('Verifiëren')).tap();
    
    // Should show success message
    await expect(element(by.text('MFA succesvol geactiveerd'))).toBeVisible();
  });

  it('should handle invalid TOTP code', async () => {
    await element(by.text('Instellen')).tap();
    
    // Enter invalid TOTP code
    const totpInput = element(by.placeholder('Voer 6-cijferige code in'));
    await totpInput.tap();
    await totpInput.typeText('000000');
    
    // Submit verification
    await element(by.text('Verifiëren')).tap();
    
    // Should show error message
    await expect(element(by.text('Ongeldige code'))).toBeVisible();
  });

  it('should verify with backup code', async () => {
    await element(by.text('Instellen')).tap();
    
    // Switch to backup code verification
    await element(by.text('Backup code gebruiken')).tap();
    
    // Enter backup code
    const backupInput = element(by.placeholder('Voer backup code in'));
    await backupInput.tap();
    await backupInput.typeText('ABC12345');
    
    // Submit verification
    await element(by.text('Verifiëren')).tap();
    
    // Should show success message
    await expect(element(by.text('MFA succesvol geactiveerd'))).toBeVisible();
  });

  it('should show MFA status after activation', async () => {
    // Navigate back to security settings
    await element(by.text('Terug')).tap();
    
    // Should show MFA as active
    await expect(element(by.text('Twee-factor authenticatie'))).toBeVisible();
    await expect(element(by.text('Geactiveerd'))).toBeVisible();
    await expect(element(by.text('Uitschakelen')).toBeVisible();
  });

  it('should allow MFA deactivation', async () => {
    await element(by.text('Uitschakelen')).tap();
    
    // Should show confirmation dialog
    await expect(element(by.text('MFA uitschakelen'))).toBeVisible();
    await expect(element(by.text('Weet je zeker dat je MFA wilt uitschakelen?'))).toBeVisible();
    
    // Confirm deactivation
    await element(by.text('Uitschakelen')).tap();
    
    // Should show success message
    await expect(element(by.text('MFA succesvol uitgeschakeld'))).toBeVisible();
    
    // Should show setup option again
    await expect(element(by.text('Instellen')).toBeVisible());
  });

  it('should require MFA on subsequent login', async () => {
    // Logout
    await element(by.text('Uitloggen')).tap();
    await element(by.text('Bevestig')).tap();
    
    // Login again
    await element(by.placeholder('E-mail')).typeText('test@example.com');
    await element(by.placeholder('Wachtwoord')).typeText('StrongPassword123!');
    await element(by.text('Inloggen')).tap();
    
    // Should prompt for MFA code
    await expect(element(by.text('Voer je MFA code in'))).toBeVisible();
    await expect(element(by.placeholder('6-cijferige code'))).toBeVisible();
  });

  it('should handle MFA verification on login', async () => {
    // Enter TOTP code
    const totpInput = element(by.placeholder('6-cijferige code'));
    await totpInput.tap();
    await totpInput.typeText('123456');
    
    // Submit verification
    await element(by.text('Verifiëren')).tap();
    
    // Should complete login
    await expect(element(by.text('Welkom bij Straat-Praat'))).toBeVisible();
  });
});
