/** * deep linking utility for fcm notifications * maps notification payloads (targethash targettab category screen) to app routes and tabs */

// mapping helper to translate notification payload fields into standard app hashes and active tabs
export function resolveNotificationRoute(payload = {}) {
  let targetHash = payload.targetHash || payload.hash;
  let targetTab = payload.targetTab || payload.tab || payload.targetScreen || payload.screen;

  const category = (payload.category || payload.type || '').toLowerCase();
  const title = (payload.title || '').toLowerCase();

  // infer target tab if not provided
  if (!targetTab) {
    if (category.includes('complaint')) targetTab = 'complaints';
    else if (category.includes('leave') || category.includes('gatepass')) targetTab = 'leave';
    else if (category.includes('notice') || category.includes('announcement')) targetTab = 'notices';
    else if (category.includes('fee') || category.includes('payment')) targetTab = 'fee';
    else if (category.includes('mess') || category.includes('menu')) targetTab = 'mess';
    else if (category.includes('profile')) targetTab = 'profile';
    else if (category.includes('chat') || title.includes('message from')) targetTab = 'chat';
    else targetTab = 'overview';
  }

  return {
    targetHash: targetHash || '#dashboard',
    targetTab: targetTab
  };
}

/** * executes navigation to target hash & tab within the react app * @param {object} payload * @param {function} setactivetabcallback */
export function navigateFromNotification(payload = {}, setActiveTabCallback = null) {
  const { targetHash, targetTab } = resolveNotificationRoute(payload);

  console.log(`[DeepLinking] Navigating to hash: ${targetHash}, tab: ${targetTab}`);

  // 1 update active tab if callback provided
  if (typeof setActiveTabCallback === 'function') {
    setActiveTabCallback(targetTab);
  }

  // 2 broadcast window event for active components
  window.dispatchEvent(new CustomEvent('shm:navigate_tab', {
    detail: { targetHash, targetTab, payload }
  }));

  // 3 update url hash if needed
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}
