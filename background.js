/**
 * DarkLens Background Service Worker
 *
 * Primary signal: toolbar badge.
 * Secondary surfaces: side panel when supported, popup fallback everywhere.
 */

const TAB_STATE_PREFIX = 'darklens:tab:';

function panelSupported() {
  return Boolean(chrome.sidePanel && chrome.sidePanel.setPanelBehavior);
}

chrome.runtime.onInstalled.addListener((details) => {
  if (panelSupported()) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('docs/onboarding.html') });
  }
});

function setBadge(tabId, count, blindSpotCount) {
  if (!count || count === 0) {
    chrome.action.setBadgeText({ tabId, text: blindSpotCount ? '!' : '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: blindSpotCount ? '#64748B' : '#64748B' });
    chrome.action.setTitle({
      tabId,
      title: blindSpotCount
        ? 'DarkLens — no findings, but some parts of this page could not be reliably evaluated'
        : 'DarkLens — no findings on this page'
    });
    return;
  }

  chrome.action.setBadgeText({ tabId, text: String(count) });
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#DC2626' });
  chrome.action.setTitle({
    tabId,
    title: `DarkLens — ${count} potential pattern${count === 1 ? '' : 's'} found (evidence, not a legal conclusion)`
  });
}

async function persistTabScan(tabId, payload) {
  await chrome.storage.local.set({
    [`${TAB_STATE_PREFIX}${tabId}`]: {
      ...payload,
      tabId,
      savedAt: new Date().toISOString()
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'DARKLENS_FINDINGS' && sender.tab) {
    const findingCount = msg.findingsCount ?? msg.count ?? 0;
    const blindSpotCount = msg.blindSpotCount ?? 0;

    setBadge(sender.tab.id, findingCount, blindSpotCount);
    persistTabScan(sender.tab.id, msg).then(() => sendResponse({ ok: true })).catch((error) => {
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }

  if (msg.type === 'DARKLENS_GET_TAB_STATE' && Number.isInteger(msg.tabId)) {
    chrome.storage.local.get(`${TAB_STATE_PREFIX}${msg.tabId}`).then((items) => {
      sendResponse(items[`${TAB_STATE_PREFIX}${msg.tabId}`] || null);
    });
    return true;
  }
});

async function clearTabState(tabId) {
  await chrome.storage.local.remove(`${TAB_STATE_PREFIX}${tabId}`);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
    clearTabState(tabId).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabState(tabId).catch(() => {});
});
