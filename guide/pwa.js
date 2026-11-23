// Offline support and the "Install" bar. Only runs on http(s): a service worker cannot run from a double-clicked file.
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  const SNOOZE = 'guide.installSnooze';
  let deferred = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    if (Date.now() < +(localStorage.getItem(SNOOZE) || 0)) return;
    const bar = document.createElement('div');
    bar.className = 'install-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Install the app');
    bar.innerHTML = '<span>Install App Guide on your phone. It then works with no internet.</span><button type="button" class="go">Install</button><button type="button" class="no">Not now</button>';
    bar.querySelector('.go').onclick = async () => { bar.remove(); deferred.prompt(); await deferred.userChoice; deferred = null; };
    bar.querySelector('.no').onclick = () => { bar.remove(); localStorage.setItem(SNOOZE, String(Date.now() + 14 * 864e5)); };
    document.body.appendChild(bar);
  });
  addEventListener('appinstalled', () => document.querySelector('.install-bar')?.remove());
})();
