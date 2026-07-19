/**
 * DarkLens Content Script
 *
 * V0.2 baseline upgrades:
 * - dynamic rescanning for modern pages
 * - deduplicated findings
 * - explicit blind-spot reporting
 * - export-friendly payload shape
 */
(function () {
  const core = new window.DarkLensRegistry.Core(window.DarkLensDetectors || []);

  let elementIndex = [];
  let activeOutlineTimeout = null;
  let latestPayload = null;
  let rescanTimer = null;
  let suppressMutationUntil = 0;

  function safeLookup(patternId) {
    return window.DarkLensGovernance?.lookup
      ? window.DarkLensGovernance.lookup(patternId)
      : {
          jurisdiction: null,
          instrument: null,
          specifiedPattern: null,
          note: 'No matching provision found.'
        };
  }

  function normalizeFindings(rawFindings) {
    const seen = new Set();
    const normalized = [];
    const nextElementIndex = [];

    for (const f of rawFindings) {
      const key = [f.patternId, f.selector || '', f.evidenceText || '', f.tier, f.rationale || ''].join('||');
      if (seen.has(key)) continue;
      seen.add(key);

      const element = f.selector ? document.querySelector(f.selector) : null;
      const id = normalized.length;
      nextElementIndex[id] = element;
      normalized.push({
        id,
        patternId: f.patternId,
        detectorId: f.detectorId,
        label: f.label || f.detectorLabel || f.detectorId,
        tier: f.tier,
        tierLabel: f.tierLabel,
        evidenceText: f.evidenceText,
        rationale: f.rationale,
        selector: f.selector || '',
        governance: safeLookup(f.patternId)
      });
    }

    elementIndex = nextElementIndex;
    return normalized;
  }

  function buildPayload(findings, reason) {
    const blindSpots = findings.filter((f) => f.tier === 4);
    const reportableFindings = findings.filter((f) => f.tier !== 4);

    return {
      type: 'DARKLENS_FINDINGS',
      reason,
      page: {
        title: document.title,
        url: location.href
      },
      scannedAt: new Date().toISOString(),
      findings: reportableFindings,
      blindSpots,
      count: reportableFindings.length,
      findingsCount: reportableFindings.length,
      blindSpotCount: blindSpots.length
    };
  }

  function publish(payload) {
    latestPayload = payload;
    chrome.runtime.sendMessage(payload, () => {
      void chrome.runtime.lastError;
    });
  }

  function runAudit(reason = 'manual') {
    const rawFindings = core.audit(document);
    const findings = normalizeFindings(rawFindings);
    const payload = buildPayload(findings, reason);
    publish(payload);
    return payload;
  }

  function scheduleAudit(reason = 'dom-mutation') {
    clearTimeout(rescanTimer);
    rescanTimer = setTimeout(() => runAudit(reason), 500);
  }

  function highlightFinding(id) {
    const el = elementIndex[id];
    if (!el) return;

    suppressMutationUntil = Date.now() + 3000;

    if (activeOutlineTimeout) clearTimeout(activeOutlineTimeout);
    const prevOutline = el.style.outline;
    const prevOffset = el.style.outlineOffset;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.outline = '2px dashed rgba(220, 38, 38, 0.9)';
    el.style.outlineOffset = '2px';

    activeOutlineTimeout = setTimeout(() => {
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
    }, 2500);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'DARKLENS_REQUEST_SCAN') {
      const payload = runAudit(msg.reason || 'manual-rescan');
      sendResponse(payload);
      return true;
    }

    if (msg.type === 'DARKLENS_HIGHLIGHT') {
      highlightFinding(msg.id);
      sendResponse({ ok: true });
      return true;
    }

    if (msg.type === 'DARKLENS_GET_LATEST') {
      sendResponse(latestPayload || runAudit('state-request'));
      return true;
    }
  });

  const observer = new MutationObserver((mutations) => {
    if (Date.now() < suppressMutationUntil) return;

    const meaningful = mutations.some((mutation) => {
      if (mutation.type === 'childList') {
        return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
      }
      if (mutation.type === 'attributes') {
        return true;
      }
      return false;
    });

    if (meaningful) scheduleAudit('dom-mutation');
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'checked', 'open']
    });
  }

  window.addEventListener('load', () => scheduleAudit('window-load'));
  window.addEventListener('popstate', () => scheduleAudit('spa-navigation'));
  window.addEventListener('hashchange', () => scheduleAudit('hash-navigation'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleAudit('tab-visible');
  });

  runAudit('initial-load');
})();
