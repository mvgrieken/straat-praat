/**
 * Centralized error messages for consistent user experience
 */
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Onjuiste e-mail of wachtwoord',
    ACCOUNT_LOCKED: 'Je account is geblokkeerd vanwege te veel mislukte inlogpogingen',
    EMAIL_NOT_CONFIRMED: 'Bevestig eerst je e-mailadres via de link in je e-mail',
    TOO_MANY_REQUESTS: 'Te veel inlogpogingen. Probeer het later opnieuw',
    SESSION_EXPIRED: 'Je sessie is verlopen. Log opnieuw in',
    NETWORK_ERROR: 'Geen internetverbinding. Controleer je verbinding',
    UNKNOWN_ERROR: 'Er is een onbekende fout opgetreden',
  },
  
  VALIDATION: {
    REQUIRED_FIELD: 'Dit veld is verplicht',
    INVALID_EMAIL: 'Voer een geldig e-mailadres in',
    PASSWORD_TOO_SHORT: 'Wachtwoord moet minimaal 8 tekens bevatten',
    PASSWORD_TOO_WEAK: 'Wachtwoord moet minimaal 1 kleine letter, 1 hoofdletter en 1 cijfer bevatten',
    PASSWORDS_DONT_MATCH: 'Wachtwoorden komen niet overeen',
    INVALID_PIN: 'PIN moet 4-6 cijfers bevatten',
  },
  
  NETWORK: {
    REQUEST_FAILED: 'Verzoek mislukt. Controleer je internetverbinding',
    TIMEOUT: 'Verzoek duurde te lang. Probeer het opnieuw',
    SERVER_ERROR: 'Server fout. Probeer het later opnieuw',
    RATE_LIMITED: 'Te veel verzoeken. Probeer het later opnieuw',
  },
  
  DATABASE: {
    FETCH_FAILED: 'Ophalen van gegevens mislukt',
    UPDATE_FAILED: 'Bijwerken van gegevens mislukt',
    DELETE_FAILED: 'Verwijderen van gegevens mislukt',
    NOT_FOUND: 'Gevraagde gegevens niet gevonden',
  },
  
  PERMISSIONS: {
    CAMERA_DENIED: 'Camera toegang geweigerd',
    MICROPHONE_DENIED: 'Microfoon toegang geweigerd',
    NOTIFICATIONS_DENIED: 'Notificatie toegang geweigerd',
    STORAGE_DENIED: 'Opslag toegang geweigerd',
  },
  
  GENERAL: {
    SOMETHING_WENT_WRONG: 'Er is iets misgegaan',
    TRY_AGAIN: 'Probeer het opnieuw',
    CONTACT_SUPPORT: 'Neem contact op met ondersteuning',
    REFRESH_APP: 'Ververs de app en probeer het opnieuw',
  }
} as const;

/**
 * Get error message by key with optional fallback
 */
export function getErrorMessage(
  category: keyof typeof ERROR_MESSAGES,
  key: string,
  fallback?: string
): string {
  const categoryMessages = ERROR_MESSAGES[category] as Record<string, string>;
  return categoryMessages[key] || fallback || ERROR_MESSAGES.GENERAL.SOMETHING_WENT_WRONG;
}

/**
 * Get auth error message with smart fallback
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return ERROR_MESSAGES.AUTH.UNKNOWN_ERROR;
  
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('Invalid login credentials')) {
    return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
  }
  
  if (errorMessage.includes('Email not confirmed')) {
    return ERROR_MESSAGES.AUTH.EMAIL_NOT_CONFIRMED;
  }
  
  if (errorMessage.includes('Too many requests')) {
    return ERROR_MESSAGES.AUTH.TOO_MANY_REQUESTS;
  }
  
  if (errorMessage.includes('JWT')) {
    return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
  }
  
  if (errorMessage.includes('rate limit')) {
    return ERROR_MESSAGES.AUTH.TOO_MANY_REQUESTS;
  }
  
  if (errorMessage.includes('offline')) {
    return ERROR_MESSAGES.AUTH.NETWORK_ERROR;
  }
  
  return ERROR_MESSAGES.AUTH.UNKNOWN_ERROR;
}

/**
 * Get validation error message
 */
export function getValidationErrorMessage(field: string, type: keyof typeof ERROR_MESSAGES.VALIDATION): string {
  const message = ERROR_MESSAGES.VALIDATION[type];
  return message.replace('Dit veld', field);
}
