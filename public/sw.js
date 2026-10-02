// PulseBoard service worker: only shows Web Push notifications (no offline cache).
// Payload: { title, body, path } — path is an in-app link, opened on click.
self.addEventListener("push", (event) => {
  let data = { title: "PulseBoard", body: "", path: "/dashboard" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  const path = typeof data.path === "string" && data.path.startsWith("/") ? data.path : "/dashboard";
  event.waitUntil(self.registration.showNotification(String(data.title).slice(0, 80), { body: String(data.body).slice(0, 200), icon: "/pulseboard-icon.svg", data: { path } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.path) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).origin === self.location.origin && "focus" in c) {
          c.navigate(path);
          return c.focus();
        }
      }
      return self.clients.openWindow(path);
    })
  );
});
