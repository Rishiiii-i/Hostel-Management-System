/**
 * Deep Linking Utility for FCM Notifications
 * Maps notification payloads (targetHash, targetTab, category, screen) to app routes and tabs.
 */

// Mapping helper to translate notification payload fields into standard app hashes and active tabs
export function resolveNotificationRoute(payload = {}) {
  let targetHash = payload.targetHash || payload.hash;
  let targetTab = payload.targetTab || payload.tab || payload.targetScreen || payload.screen;

  const category = (payload.category || payload.type || '').toLowerCase();

  // Infer target tab from notification category if not explicitly provided
  if (!targetTab) {
    if (category.includes('complaint')) targetTab = 'complaints';
    else if (category.includes('leave') || category.includes('gatepass')) targetTab = 'leave';
    else if (category.includes('notice') || category.includes('announcement')) targetTab = 'notices';
    else if (category.includes('fee') || category.includes('payment')) targetTab = 'fee';
    else if (category.includes('mess') || category.includes('menu')) targetTab = 'mess';
    else if (category.includes('profile')) targetTab = 'profile';
    else targetTab = 'overview';
  }

  return {
    targetHash: targetHash || '#dashboard',
    targetTab: targetTab
  };
}

/**
 * Executes navigation to target hash & tab within the React app
 * @param {Object} payload 
 * @param {Function} setActiveTabCallback 
 */
export function navigateFromNotification(payload = {}, setActiveTabCallback = null) {
  const { targetHash, targetTab } = resolveNotificationRoute(payload);

  console.log(`[DeepLinking] Navigating to hash: ${targetHash}, tab: ${targetTab}`);

  // 1. Update active tab if callback provided
  if (typeof setActiveTabCallback === 'function') {
    setActiveTabCallback(targetTab);
  }

  // 2. Broadcast window event for active components
  window.dispatchEvent(new CustomEvent('shm:navigate_tab', {
    detail: { targetHash, targetTab, payload }
  }));

  // 3. Update URL hash if needed
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}
