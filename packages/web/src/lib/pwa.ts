export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', reg.scope);
      } catch (err) {
        console.warn('SW registration failed:', err);
      }
    });
  }
}

/** Offline detection hook setup — dispatches events for the app to handle. */
export function setupOfflineDetection() {
  window.addEventListener('online', () => {
    document.dispatchEvent(new CustomEvent('vibefit:online'));
  });

  window.addEventListener('offline', () => {
    document.dispatchEvent(new CustomEvent('vibefit:offline'));
  });
}
