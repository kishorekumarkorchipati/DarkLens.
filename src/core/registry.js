/**
 * DarkLens Core Engine — Pattern Registry
 *
 * Design principle (do not remove):
 * "DarkLens detects and documents evidence of potentially manipulative
 * interface patterns. It does not determine legal liability."
 *
 * The core engine knows nothing about specific pattern logic — each
 * detector is an isolated, independently testable plugin that registers
 * itself onto window.DarkLensDetectors before this file runs (see
 * manifest.json content_scripts order).
 */
(function (global) {
  function cssPath(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && path.length < 6) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += `#${el.id}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = el;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.nodeName.toLowerCase() === selector) nth++;
        }
        selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  class DarkLensCore {
    constructor(detectors) {
      this.registry = detectors || [];
    }

    registerPattern(detector) {
      this.registry.push(detector);
    }

    /**
     * Runs every registered detector against the current document.
     * IMPORTANT: this must run BEFORE any DarkLens UI (outlines, badges)
     * is injected into the page, so evidence reflects the page's
     * original, untouched state — not DarkLens's own DOM additions.
     */
    audit(root) {
      const allFindings = [];
      for (const detector of this.registry) {
        try {
          const findings = detector.evaluate(root) || [];
          allFindings.push(...findings);
        } catch (err) {
          allFindings.push({
            patternId: detector.patternId || 'unknown',
            detectorId: detector.id || 'unknown',
            tier: 4,
            tierLabel: 'Insufficient Data',
            evidenceText: 'Detector raised an error during evaluation.',
            selector: '',
            rationale: `Detector failure: ${err.message}. Treated as a blind spot, not a negative result.`
          });
        }
      }
      return allFindings;
    }
  }

  global.DarkLensRegistry = {
    cssPath,
    Core: DarkLensCore
  };
})(window);
