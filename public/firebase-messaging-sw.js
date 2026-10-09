// Service Worker for Background Water Reminders & Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for background push events
self.addEventListener('push', (event) => {
  let data = {
    title: '💧 Nhắc Uống Nước',
    body: 'Đã đến giờ uống một ngụm nước rồi bạn ơi! Cùng bổ sung năng lượng nào.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'water-reminder',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
      } else {
        data = { ...data, ...payload };
      }
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'water-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'drink', title: '💧 Đã uống ngay' },
      { action: 'close', title: 'Đóng' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click notification event: focus or open the window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
