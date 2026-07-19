# Source extract: Guidelines for Prevention and Regulation of Dark Patterns, 2023 (India)

- **Instrument:** Guidelines for Prevention and Regulation of Dark Patterns, 2023
- **Issuing authority:** Central Consumer Protection Authority (CCPA), India
- **Legal basis:** Section 18 of the Consumer Protection Act, 2019
- **Date notified:** 30 November 2023
- **Retrieved on:** 2026-07-18
- **Last verified:** 2026-07-18
- **Status note:** As of mid-2025 reporting, CCPA compliance advisories to
  e-commerce platforms under these guidelines have been characterized as an
  advisory with self-audit expectations, not yet paired with a defined penalty
  or investigation mechanism specific to this instrument — verify current
  enforcement status before citing this as binding law in any external-facing
  material.

## Definition (as extracted)
"Dark patterns" are defined as practices or deceptive design patterns using UI/UX
interactions on any platform designed to mislead or trick users into doing something
they did not originally intend, by subverting or impairing consumer autonomy,
decision-making, or choice — amounting to a misleading advertisement, unfair trade
practice, or violation of consumer rights.

## 13 specified dark patterns (Annexure I)
1. False Urgency
2. Basket Sneaking
3. Confirm Shaming
4. Forced Action
5. Subscription Trap
6. Interface Interference
7. Bait and Switch
8. Drip Pricing
9. Disguised Advertisement
10. Nagging
11. Trick Wording
12. SaaS Billing
13. Rogue Malware

## Patterns mapped by DarkLens V0.2
- **Confirm Shaming** → `confirmshaming.js`
- **Interface Interference** → `visualInterference.js`
- **Basket Sneaking** → mapped *adjacently* (not exactly) to `preselection.js`;
  the specified pattern concerns added items/charges at checkout, while V0.2's
  detector targets preselected non-essential consent checkboxes. This is
  documented as an approximate mapping, not an exact one — see `GOVERNANCE.md`.

**Do not treat this file as a substitute for the primary legal text.** It is a
working extract for engineering reference; verify against the official CCPA
publication before any external or compliance-facing use.
