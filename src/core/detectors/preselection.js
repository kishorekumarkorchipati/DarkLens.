/**
 * DarkLens Detector: Preselection / Default Opt-In
 */
(function (global) {
  const NON_ESSENTIAL_KEYWORDS = [
    'newsletter', 'marketing', 'promo', 'offers', 'subscribe',
    'share my data', 'partners', 'third[- ]party', 'sms updates',
    'add.*protection.*plan', 'add.*warranty', 'add.*insurance'
  ];
  const ESSENTIAL_KEYWORDS = [
    'terms', 'privacy policy', 'required', 'i agree to the terms',
    'age', 'confirm i am', 'necessary'
  ];

  function labelTextFor(input) {
    if (input.id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (explicit) return explicit.innerText || explicit.textContent || '';
    }
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.innerText || parentLabel.textContent || '';
    const sib = input.nextElementSibling;
    if (sib) return sib.innerText || sib.textContent || '';
    return '';
  }

  function matchesAny(text, patterns) {
    return patterns.some((p) => new RegExp(p, 'i').test(text));
  }

  class PreselectionDetector {
    constructor() {
      this.id = 'preselection';
      this.patternId = 'CCPA-2023-BASKET-SNEAKING-ADJACENT';
      this.label = 'Preselected Non-Essential Opt-In';
    }

    evaluate(root) {
      const findings = [];
      const checkboxes = Array.from(root.querySelectorAll('input[type="checkbox"]:checked'));

      for (const cb of checkboxes) {
        const label = labelTextFor(cb).trim();
        if (!label) continue;

        if (matchesAny(label, ESSENTIAL_KEYWORDS)) continue;

        if (matchesAny(label, NON_ESSENTIAL_KEYWORDS)) {
          findings.push({
            patternId: this.patternId,
            detectorId: this.id,
            detectorLabel: this.label,
            tier: 1,
            tierLabel: 'Directly Observed',
            evidenceText: `Preselected checkbox: "${label}"`,
            selector: window.DarkLensRegistry.cssPath(cb),
            rationale:
              'The checkbox is checked by default in the DOM (deterministic fact) and its label matches a non-essential consent category (marketing/upsell/data-sharing), not a required setting.'
          });
        } else {
          findings.push({
            patternId: this.patternId,
            detectorId: this.id,
            detectorLabel: this.label,
            tier: 3,
            tierLabel: 'Contextual Ambiguity',
            evidenceText: `Preselected checkbox: "${label}"`,
            selector: window.DarkLensRegistry.cssPath(cb),
            rationale:
              'The checkbox is checked by default, but its purpose cannot be classified as clearly essential or non-essential from label text alone. Flagged for human review.'
          });
        }
      }
      return findings;
    }
  }

  global.DarkLensDetectors = global.DarkLensDetectors || [];
  global.DarkLensDetectors.push(new PreselectionDetector());
})(window);
