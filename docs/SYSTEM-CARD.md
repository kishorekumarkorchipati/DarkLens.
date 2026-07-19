# DarkLens V0.2 — System Card

## Intended use
A research/portfolio prototype demonstrating rule-based detection of 3 dark-pattern
classes on arbitrary webpages, with evidence tiering and jurisdiction-aware
(non-authoritative) regulatory mapping.

## Out-of-scope use
- **Must not** be used as the sole or primary basis for a legal, regulatory, or
  compliance determination against any website or company.
- **Must not** be used to publicly name or accuse a specific, real company —
  V0.2's benchmark and demo materials use synthetic test pages only.
- **Must not** be treated as a certification of "no dark patterns present" when
  it reports zero findings — it only means none of the 3 current detectors matched.

## Known failure modes (V0.2)
- **CSS `outline` clipping:** on-page highlighting uses CSS `outline`, which can be
  visually clipped by ancestor elements with `overflow: hidden` (common in carousels,
  cards, and modals). The finding is still logged correctly in the side panel; only
  the visual on-page highlight may fail to render. See `benchmark/adversarial/` for
  a test case exercising this.
- **Canvas/image-rendered text:** detectors read DOM text content. Dark-pattern text
  rendered inside a `<canvas>` or as a raster image is invisible to V0.2 and produces
  no finding — this is a false negative, not a "clean" result.
- **Shadow DOM boundaries:** detectors do not currently pierce closed shadow roots.
  A pattern implemented entirely inside a closed shadow DOM will not be detected.
- **Single-language keyword lists:** confirmshaming and preselection detection rely on
  English regex patterns. Non-English pages are effectively unaudited by those two
  detectors in V0.2. This is a documented gap, not a claim of absence.
- **Toolbar badge visibility:** the primary signal (icon badge) is only visible if the
  user has pinned the extension; unpinned installs default to Chrome's puzzle-piece
  overflow menu. Mitigated with a first-run onboarding prompt, not solved outright.
- **Visual interference thresholds are heuristic, not perceptual:** the size/font-ratio
  thresholds are simplified proxies, not a WCAG-grade contrast or salience calculation.

## Evaluation status
End-to-end benchmark results pending until the extension-driven evaluation harness is running in a real extension-aware browser context. Until then, V0.2 should be presented as a rule-based research prototype with documented benchmark cases and scoring logic, not as a system with published precision / recall / F1 performance claims.

## Bias & fairness assessment
V0.2's detection is rule-based and English-only, so classical model-bias analysis
(e.g. demographic parity) does not directly apply. The relevant risk surface for this
version is **linguistic and jurisdictional coverage bias**: pages in other languages,
or aimed at non-Indian jurisdictions, are audited only against the regulatory
categories currently in the lookup table. Any future version that introduces an LLM
classifier must re-run this assessment for model-level bias (e.g. differential
accuracy across languages, dialects, or page-authoring conventions) before that
version's findings are treated as comparably reliable to V0.2's deterministic checks.

## Evidence integrity note
The audit (`core.audit()`) always runs against the page's original DOM before any
DarkLens UI (outline highlighting) is applied, so findings reflect the page's actual
state rather than DarkLens's own additions. No cryptographic evidence hashing is
implemented in V0.2 — a hash generated client-side, without a trusted third-party
timestamp or chain of custody, would not constitute verifiable forensic evidence, and
claiming otherwise would overstate what the system provides.
