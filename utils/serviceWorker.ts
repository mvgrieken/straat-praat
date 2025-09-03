/**
 * Service Worker registratie utility
 */

/**
 * Registreer de service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker geregistreerd:', registration);
      
      // Luister naar updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nieuwe versie beschikbaar
              console.log('Nieuwe app versie beschikbaar');
              showUpdateNotification();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registratie mislukt:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Toon update notificatie
 */
function showUpdateNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Straat-Praat Update', {
      body: 'Er is een nieuwe versie beschikbaar. Ververs de pagina om bij te werken.',
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }
}

/**
 * Check of service worker actief is
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}

/**
 * Verstuur bericht naar service worker
 */
export async function sendMessageToSW(message: any): Promise<any> {
  if (isServiceWorkerActive()) {
    try {
      const response = await navigator.serviceWorker.controller?.postMessage(message);
      return response;
    } catch (error) {
      console.error('Bericht naar Service Worker mislukt:', error);
      return null;
    }
  }
  return null;
}

/**
 * Cache management functies
 */
export const cacheManager = {
  /**
   * Cache een URL
   */
  async cacheUrl(url: string, options?: RequestInit): Promise<void> {
    if (isServiceWorkerActive()) {
      await sendMessageToSW({
        type: 'CACHE_URL',
        url,
        options
      });
    }
  },

  /**
   * Verwijder URL uit cache
   */
  async removeFromCache(url: string): Promise<void> {
    if (isServiceWorkerActive()) {
      await sendMessageToSW({
        type: 'REMOVE_FROM_CACHE',
        url
      });
    }
  },

  /**
   * Leeg alle caches
   */
  async clearAllCaches(): Promise<void> {
    if (isServiceWorkerActive()) {
      await sendMessageToSW({
        type: 'CLEAR_ALL_CACHES'
      });
    }
  }
};

/**
 * Offline status monitoring
 */
export const offlineMonitor = {
  /**
   * Check of app offline is
   */
  isOffline(): boolean {
    return !navigator.onLine;
  },

  /**
   * Luister naar online/offline events
   */
  onOnline(callback: () => void): () => void {
    const handleOnline = () => callback();
    window.addEventListener('online', handleOnline);
    
    return () => window.removeEventListener('online', handleOnline);
  },

  /**
   * Luister naar offline events
   */
  onOffline(callback: () => void): () => void {
    const handleOffline = () => callback();
    window.addEventListener('offline', handleOffline);
    
    return () => window.removeEventListener('offline', handleOffline);
  }
};

/**
 * Background sync registratie
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync geregistreerd:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registratie mislukt:', error);
      return false;
    }
  }
  return false;
}
