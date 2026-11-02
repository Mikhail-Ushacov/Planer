export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    console.warn('Audio Context failed or blocked:', e);
  }
}

export async function triggerSystemNotification(title: string, body: string) {
  playNotificationSound();

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Спроба показати через Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200],
          tag: `reminder-${Date.now()}`,
          renotify: true,
        } as NotificationOptions);
        return;
      }
    } catch (err) {
      console.warn('ServiceWorker notification error, fallback to Notification API:', err);
    }
  }

  // Fallback через стандартний браузерний Notification
  new Notification(title, {
    body,
    icon: '/favicon.svg',
  });
}