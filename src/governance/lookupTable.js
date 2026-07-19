/**
 * DarkLens Governance: Deterministic Regulatory Lookup Table
 *
 * This is intentionally a static, hand-curated, version-controlled table —
 * NOT a RAG pipeline. No text below is model-generated. Every entry is
 * sourced from a primary document, with a retrieval and last-verified date.
 * See /docs/sources/ for the full extracted source text.
 *
 * If a patternId has no entry here, the UI must show
 * "No matching provision found" — never fabricate a citation.
 */
(function (global) {
  const LOOKUP_TABLE = {
    'CCPA-2023-CONFIRM-SHAMING': {
      jurisdiction: 'India',
      instrument:
        'Guidelines for Prevention and Regulation of Dark Patterns, 2023 (CCPA, under Section 18, Consumer Protection Act, 2019)',
      specifiedPattern: 'Confirm Shaming',
      sourceFile: 'docs/sources/ccpa-2023-extract.md',
      retrievedOn: '2026-07-18',
      lastVerified: '2026-07-18',
      note:
        'This is a potentially relevant provision, not a determination that this instance violates it. Human review required.'
    },
    'CCPA-2023-BASKET-SNEAKING-ADJACENT': {
      jurisdiction: 'India',
      instrument:
        'Guidelines for Prevention and Regulation of Dark Patterns, 2023 (CCPA, under Section 18, Consumer Protection Act, 2019)',
      specifiedPattern: 'Basket Sneaking (adjacent — preselected non-essential add-on/consent)',
      sourceFile: 'docs/sources/ccpa-2023-extract.md',
      retrievedOn: '2026-07-18',
      lastVerified: '2026-07-18',
      note:
        'Basket Sneaking as specified concerns added items/charges at checkout; preselected non-essential consent is mapped here as the closest specified category and flagged as an adjacent, not exact, match. Human review required.'
    },
    'CCPA-2023-INTERFACE-INTERFERENCE': {
      jurisdiction: 'India',
      instrument:
        'Guidelines for Prevention and Regulation of Dark Patterns, 2023 (CCPA, under Section 18, Consumer Protection Act, 2019)',
      specifiedPattern: 'Interface Interference',
      sourceFile: 'docs/sources/ccpa-2023-extract.md',
      retrievedOn: '2026-07-18',
      lastVerified: '2026-07-18',
      note:
        'This is a potentially relevant provision, not a determination that this instance violates it. Human review required.'
    }
  };

  function lookup(patternId) {
    return (
      LOOKUP_TABLE[patternId] || {
        jurisdiction: null,
        instrument: null,
        specifiedPattern: null,
        note: 'No matching provision found.'
      }
    );
  }

  global.DarkLensGovernance = { lookup, LOOKUP_TABLE };
})(window);
