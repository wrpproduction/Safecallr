importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// This is required for FCM to work in the background.
// The config here can be empty if you use the default project.
// However, it's better to provide it.
firebase.initializeApp({
  apiKey: "AIzaSyCPrcZlZIeHjJfWT_JiD_PiwzCbhMmmgH0",
  authDomain: "gen-lang-client-0258611834.firebaseapp.com",
  projectId: "gen-lang-client-0258611834",
  storageBucket: "gen-lang-client-0258611834.firebasestorage.app",
  messagingSenderId: "763824733061",
  appId: "1:763824733061:web:1febec810fec504e1022ec"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'SafeCallr';
  const notificationOptions = {
    body: payload.notification.body || 'Nouvel appel à authentifier',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon-32x32.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
