/**
 * DarkLens Detector: Confirmshaming
 */
(function (global) {
  const SHAME_PHRASES = [
    /no[,]?\s+i (don'?t|do not) (want|like|need) to (save|win|get)/i,
    /no[,]?\s+i (prefer|choose) to (pay full price|miss out|overpay)/i,
    /no[,]?\s+i('| a)?m (not interested in|happy to) (saving|missing out|paying more)/i,
    /i('| a)?m (fine|ok|okay) (with|paying) (full price|missing out)/i,
    /no thanks,? i (hate|don'?t like|dislike) (saving money|discounts|deals)/i,
    /skip (this|my) (discount|savings|deal|offer)/i
  ];

  function findClickableTextNodes(root) {
    const selector = 'button, a, [role="button"], label, span[onclick], div[onclick]';
    return Array.from(root.querySelectorAll(selector));
  }

  class ConfirmshamingDetector {
    constructor() {
      this.id = 'confirmshaming';
      this.patternId = 'CCPA-2023-CONFIRM-SHAMING';
      this.label = 'Confirmshaming';
    }

    evaluate(root) {
      const findings = [];
      const candidates = findClickableTextNodes(root);

      for (const el of candidates) {
        const text = (el.innerText || el.textContent || '').trim();
        if (!text || text.length > 200) continue;

        for (const pattern of SHAME_PHRASES) {
          if (pattern.test(text)) {
            findings.push({
              patternId: this.patternId,
              detectorId: this.id,
              detectorLabel: this.label,
              tier: 2,
              tierLabel: 'Strong Heuristic',
              evidenceText: text,
              selector: window.DarkLensRegistry.cssPath(el),
              rationale:
                'Decline-option copy matches a known confirmshaming phrasing pattern (guilt/self-deprecation framing on the non-default choice).'
            });
            break;
          }
        }
      }
      return findings;
    }
  }

  global.DarkLensDetectors = global.DarkLensDetectors || [];
  global.DarkLensDetectors.push(new ConfirmshamingDetector());
})(window);
