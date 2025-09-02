// E2E test setup
require('detox');

// Global test utilities
global.testUtils = {
  // Wait for element to be visible
  waitForElement: async (element, timeout = 5000) => {
    await waitFor(element).toBeVisible().withTimeout(timeout);
  },
  
  // Wait for element to disappear
  waitForElementToDisappear: async (element, timeout = 5000) => {
    await waitFor(element).not.toBeVisible().withTimeout(timeout);
  },
  
  // Tap element with retry
  tapWithRetry: async (element, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await element.tap();
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  },
  
  // Type text with retry
  typeTextWithRetry: async (element, text, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await element.tap();
        await element.typeText(text);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  },
  
  // Clear and type text
  clearAndTypeText: async (element, text) => {
    await element.tap();
    await element.clearText();
    await element.typeText(text);
  },
  
  // Navigate back
  goBack: async () => {
    try {
      await element(by.text('Terug')).tap();
    } catch (error) {
      // Try hardware back button on Android
      await device.pressBack();
    }
  },
  
  // Scroll to element
  scrollToElement: async (element, direction = 'down') => {
    await element.scrollTo(direction);
  },
  
  // Take screenshot
  takeScreenshot: async (name) => {
    await device.takeScreenshot(name);
  },
  
  // Wait for network idle
  waitForNetworkIdle: async (timeout = 10000) => {
    await new Promise(resolve => setTimeout(resolve, timeout));
  },
  
  // Login helper
  login: async (email, password) => {
    await element(by.placeholder('E-mail')).typeText(email);
    await element(by.placeholder('Wachtwoord')).typeText(password);
    await element(by.text('Inloggen')).tap();
    
    // Wait for login to complete
    await waitFor(element(by.text('Welkom bij Straat-Praat'))).toBeVisible().withTimeout(10000);
  },
  
  // Logout helper
  logout: async () => {
    await element(by.text('Profiel')).tap();
    await element(by.text('Uitloggen')).tap();
    await element(by.text('Bevestig')).tap();
    
    // Wait for logout to complete
    await waitFor(element(by.text('Inloggen'))).toBeVisible().withTimeout(5000);
  },
  
  // MFA verification helper
  verifyMFA: async (code) => {
    const totpInput = element(by.placeholder('6-cijferige code'));
    await totpInput.tap();
    await totpInput.typeText(code);
    await element(by.text('Verifiëren')).tap();
  },
};

// Test environment setup
beforeAll(async () => {
  // Set device orientation to portrait
  await device.setOrientation('portrait');
  
  // Set device language to Dutch
  await device.setLanguage('nl');
  
  // Set device locale to Dutch
  await device.setLocale('nl_NL');
});

afterAll(async () => {
  // Clean up after all tests
  await device.terminateApp();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
