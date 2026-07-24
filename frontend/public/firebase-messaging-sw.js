// Firebase Cloud Messaging Service Worker
// Native OS / Browser Push Notification Processor for Background & Terminated App States

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || "AIzaSyCjciJ_pYfab5D0k8XAvjxtjOhqMTil-O0",
  authDomain: urlParams.get('authDomain') || "hostel-management-system-78566.firebaseapp.com",
  projectId: urlParams.get('projectId') || "hostel-management-system-78566",
  storageBucket: urlParams.get('storageBucket') || "hostel-management-system-78566.firebasestorage.app",
  messagingSenderId: urlParams.get('messagingSenderId') || "634350989098",
  appId: urlParams.get('appId') || "1:634350989098:web:0b2ca4acd3ee80aae9f853",
  measurementId: urlParams.get('measurementId') || "G-ZF9LWGBTZ8"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const title = payload.notification?.title || payload.data?.title || 'Smart Hostel Alert';
  const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'You have a new update.';
  const icon = payload.notification?.icon || payload.data?.icon || '/logo.png';
  const data = payload.data || {};

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: '/favicon.svg',
    tag: data.eventId || payload.messageId || 'shm_' + Date.now(),
    data: {
      targetScreen: data.targetScreen || data.screen || 'overview',
      targetHash: data.targetHash || data.hash || '#dashboard',
      targetTab: data.targetTab || data.tab || data.targetScreen || 'overview',
      payloadData: data
    }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle native notification click event (Background & Terminated states)
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Native notification clicked:', event.notification);
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetHash = notificationData.targetHash || '#dashboard';
  const targetTab = notificationData.targetTab || notificationData.targetScreen || 'overview';

  const targetUrl = new URL(self.location.origin);
  targetUrl.hash = targetHash;
  if (targetTab) {
    targetUrl.searchParams.set('tab', targetTab);
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an application window is already open, focus it and post a deep-link navigation event
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'FCM_NOTIFICATION_CLICK',
            targetHash: targetHash,
            targetTab: targetTab,
            payload: notificationData.payloadData
          });
          return;
        }
      }
      // 2. If no window is open (Terminated app state), launch a new browser window to target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl.href);
      }
    })
  );
});
