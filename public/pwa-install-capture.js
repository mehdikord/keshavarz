/*
 * Loaded async from <head>, ahead of hydration: Chromium may fire
 * `beforeinstallprompt` before React mounts, and never re-dispatches it.
 * Event names must match src/lib/pwa/platform.ts.
 */
(function () {
  try {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      window.__keshavarzInstallPrompt = event;
      window.dispatchEvent(new Event("keshavarz:install-available"));
    });
    window.addEventListener("appinstalled", function () {
      window.__keshavarzInstallPrompt = null;
      window.dispatchEvent(new Event("keshavarz:app-installed"));
    });
  } catch {
    // Older browsers: install simply stays unavailable.
  }
})();
