const TIER_LABELS = {
  1: 'Tier 1 · Directly Observed',
  2: 'Tier 2 · Strong Heuristic',
  3: 'Tier 3 · Contextual Ambiguity',
  4: 'Tier 4 · Insufficient Data'
};

let latestPayload = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderCard(f, container, cssClass = 'finding') {
  const el = document.createElement('div');
  el.className = `${cssClass} tier-${f.tier}`;
  const gov = f.governance || {};
  el.innerHTML = `
    <div class="finding-header">
      <span class="finding-title">${escapeHtml(f.label || f.detectorId || 'Finding')}</span>
      <span class="finding-tier">${TIER_LABELS[f.tier] || 'Unknown Tier'}</span>
    </div>
    <div class="finding-evidence">${escapeHtml(f.evidenceText)}</div>
    <div class="finding-rationale">${escapeHtml(f.rationale)}</div>
    <div class="finding-governance">
      ${
        gov.instrument
          ? `Potentially relevant to: <strong>${escapeHtml(gov.specifiedPattern)}</strong> — ${escapeHtml(gov.instrument)} (${escapeHtml(gov.jurisdiction || 'Unknown jurisdiction')}, last verified ${escapeHtml(gov.lastVerified || 'unknown')})`
          : 'No matching provision found.'
      }
      <div class="note">${escapeHtml(gov.note || '')}</div>
    </div>
  `;

  if (cssClass === 'finding') {
    el.addEventListener('click', async () => {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: 'DARKLENS_HIGHLIGHT', id: f.id }, () => {
        void chrome.runtime.lastError;
      });
    });
  }

  container.appendChild(el);
}

function renderPayload(payload) {
  latestPayload = payload;

  const findings = payload?.findings || [];
  const blindSpots = payload?.blindSpots || [];
  const summary = document.getElementById('summary');
  const findingsList = document.getElementById('findings');
  const blindSpotsList = document.getElementById('blindspots');
  const blindSpotsSection = document.getElementById('blindspots-section');

  findingsList.innerHTML = '';
  blindSpotsList.innerHTML = '';

  if (!findings.length && !blindSpots.length) {
    summary.textContent = 'No findings on this page.';
    findingsList.innerHTML = '<div class="empty-state">DarkLens did not match any of its current detectors against this page. This does not certify the page is free of manipulative patterns — only that none of DarkLens’s current detectors matched.</div>';
    blindSpotsSection.classList.add('hidden');
    return;
  }

  if (findings.length) {
    summary.textContent = `${findings.length} potential pattern${findings.length === 1 ? '' : 's'} found`;
    findings.sort((a, b) => a.tier - b.tier).forEach((f) => renderCard(f, findingsList, 'finding'));
  } else {
    summary.textContent = 'No dark pattern detected by current rules.';
    findingsList.innerHTML = '<div class="empty-state">No current detector matched. Review blind spots below before treating this page as low risk.</div>';
  }

  if (blindSpots.length) {
    blindSpotsSection.classList.remove('hidden');
    blindSpots.forEach((f) => renderCard(f, blindSpotsList, 'blindspot'));
  } else {
    blindSpotsSection.classList.add('hidden');
  }
}

async function requestScan(reason = 'popup-open') {
  document.getElementById('summary').textContent = 'Scanning current page…';
  const tab = await getActiveTab();
  if (!tab?.id) {
    document.getElementById('summary').textContent = 'No active tab available.';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'DARKLENS_REQUEST_SCAN', reason }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('summary').textContent = 'DarkLens cannot scan this page (restricted browser page, extension store, or the content script is unavailable here).';
      document.getElementById('findings').innerHTML = '<div class="empty-state">Try a normal website tab. Chrome blocks extensions on some internal and privileged pages.</div>';
      document.getElementById('blindspots-section').classList.add('hidden');
      return;
    }
    renderPayload(response || { findings: [], blindSpots: [] });
  });
}

function exportPayload() {
  if (!latestPayload) return;
  const blob = new Blob([JSON.stringify(latestPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const host = (() => {
    try {
      return new URL(latestPayload?.page?.url || 'https://example.com').hostname.replace(/[^a-z0-9.-]+/gi, '_');
    } catch {
      return 'page';
    }
  })();
  a.href = url;
  a.download = `darklens-${host}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('rescan').addEventListener('click', () => requestScan('manual-rescan'));
document.getElementById('export-json').addEventListener('click', exportPayload);
requestScan();
