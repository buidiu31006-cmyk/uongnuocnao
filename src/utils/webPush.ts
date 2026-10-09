// Utility for Background Web Push & Service Worker Notifications

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.warn('Service Worker registration skipped or failed:', error);
    return null;
  }
}

export async function requestPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await registerServiceWorker();
    }
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function showBackgroundNotification(title: string, body: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // If Service Worker is active, use showNotification on the registration so it works even if minimized
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'water-reminder',
          data: { timestamp: Date.now() },
        });
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    return true;
  } catch (error) {
    console.warn('Could not display background notification:', error);
    return false;
  }
}
