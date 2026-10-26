// FitLife Tracker - iOS 16.4+ Compatible Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Event Handler
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("[SW] Push received but has no data");
    return;
  }

  let notificationData = {
    title: "FitLife Tracker แจ้งเตือน",
    body: "อย่าลืมดูแลสุขภาพวันนี้!",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    url: "/",
  };

  try {
    const json = event.data.json();
    notificationData = {
      ...notificationData,
      ...json,
    };
  } catch (err) {
    notificationData.body = event.data.text();
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || "/icons/icon-192.png",
    badge: notificationData.badge || "/icons/badge-72.png",
    vibrate: [100, 50, 100],
    data: {
      url: notificationData.url || "/",
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: "explore", title: "เปิดแอป FitLife" },
      { action: "close", title: "ปิด" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus if already opened
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
