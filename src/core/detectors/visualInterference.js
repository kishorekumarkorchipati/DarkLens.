/**
 * DarkLens Detector: Visual Interference
 *
 * V0.2 improvement: compare controls inside the same likely choice container,
 * not across the whole page.
 */
(function (global) {
  const ACCEPT_WORDS = /accept|agree|allow|yes|got it|continue|ok(ay)?/i;
  const DECLINE_WORDS = /reject|decline|no thanks|disagree|manage preferences|opt out|deny/i;
  const CONTAINER_HINTS = /cookie|consent|privacy|subscribe|newsletter|offer|modal|popup|banner|dialog|overlay/i;

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function metrics(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      area: Math.max(rect.width * rect.height, 1),
      fontSize: parseFloat(style.fontSize) || 12,
      text: (el.innerText || el.textContent || '').trim()
    };
  }

  function clickableWithin(container) {
    return Array.from(container.querySelectorAll('button, a, [role="button"]')).filter(isVisible);
  }

  function containerCandidates(root) {
    const candidates = new Set();
    const structural = Array.from(
      root.querySelectorAll('dialog, form, section, aside, div, main')
    ).filter((el) => {
      if (!isVisible(el)) return false;
      const text = (el.innerText || '').slice(0, 600);
      const cls = `${el.className || ''} ${el.id || ''}`;
      const controlCount = clickableWithin(el).length;
      return controlCount >= 2 && (CONTAINER_HINTS.test(text) || CONTAINER_HINTS.test(cls) || el.matches('dialog, form, aside'));
    });

    structural.forEach((el) => candidates.add(el));

    const clickables = Array.from(root.querySelectorAll('button, a, [role="button"]')).filter(isVisible);
    clickables.forEach((el) => {
      const text = (el.innerText || '').trim();
      if (!ACCEPT_WORDS.test(text) && !DECLINE_WORDS.test(text)) return;
      const container = el.closest('dialog, form, section, aside, div');
      if (container && isVisible(container)) candidates.add(container);
    });

    return Array.from(candidates);
  }

  function bestControl(elements) {
    return elements
      .map((el) => ({ el, score: metrics(el).area }))
      .sort((a, b) => b.score - a.score)[0]?.el || null;
  }

  class VisualInterferenceDetector {
    constructor() {
      this.id = 'visual-interference';
      this.patternId = 'CCPA-2023-INTERFACE-INTERFERENCE';
      this.label = 'Visual Interference';
    }

    evaluate(root) {
      const findings = [];
      const seenContainers = new Set();

      for (const container of containerCandidates(root)) {
        const selector = window.DarkLensRegistry.cssPath(container);
        if (!selector || seenContainers.has(selector)) continue;
        seenContainers.add(selector);

        const clickables = clickableWithin(container);
        const acceptEls = clickables.filter((el) => ACCEPT_WORDS.test((el.innerText || '').trim()));
        const declineEls = clickables.filter((el) => DECLINE_WORDS.test((el.innerText || '').trim()));
        const containerText = (container.innerText || '').slice(0, 220).replace(/\s+/g, ' ').trim();

        if (acceptEls.length === 0 && declineEls.length === 0) continue;

        if (acceptEls.length === 0 || declineEls.length === 0) {
          findings.push({
            patternId: this.patternId,
            detectorId: this.id,
            detectorLabel: this.label,
            tier: 4,
            tierLabel: 'Insufficient Data',
            evidenceText: `Potential choice container found, but only one side of the choice was machine-detectable in this interface: "${containerText}"`,
            selector,
            rationale:
              'DarkLens found a likely consent/choice container but could not locate both accept and decline actions inside the same container. This interface should be treated as unevaluable by this detector, not as clean.'
          });
          continue;
        }

        const accept = bestControl(acceptEls);
        const decline = bestControl(declineEls);
        if (!accept || !decline) continue;

        const a = metrics(accept);
        const d = metrics(decline);
        const areaRatio = a.area / d.area;
        const fontRatio = a.fontSize / d.fontSize;

        if (areaRatio > 2.5 || fontRatio > 1.6) {
          findings.push({
            patternId: this.patternId,
            detectorId: this.id,
            detectorLabel: this.label,
            tier: 2,
            tierLabel: 'Strong Heuristic',
            evidenceText: `Within one choice container, accept control "${a.text}" is ~${areaRatio.toFixed(1)}x the clickable area and ~${fontRatio.toFixed(1)}x the font size of decline control "${d.text}".`,
            selector: window.DarkLensRegistry.cssPath(accept),
            rationale:
              'Significant prominence asymmetry was detected between accept and decline actions inside the same likely choice container. This is a scoped heuristic, not a perceptual or legal conclusion.'
          });
        }
      }

      return findings;
    }
  }

  global.DarkLensDetectors = global.DarkLensDetectors || [];
  global.DarkLensDetectors.push(new VisualInterferenceDetector());
})(window);
