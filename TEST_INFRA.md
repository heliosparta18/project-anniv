# E2E Test Infra: Anniversary Website Modernization

## Test Philosophy
- Opaque-box, requirement-driven testing across React 19 / Vite application.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Personalization to Daffa & Dinda | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Placeholder SVG Removal | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Aesthetic Typography Cards | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Conversational Indonesian Tone | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 5 | Anti-Slop Zero Em-Dash Guardrail | Project Guidelines | 5 | 5 | ✓ | ✓ |
| 6 | Background Audio Player (YouTube) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 7 | Floating Audio Play/Pause Controls | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 8 | Build & Verification Pipeline | ORIGINAL_REQUEST §Verification | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test runner: `node tests/run_all_e2e.js`
- Test suites: 24 existing suites in `tests/` covering Tiers 1-5, plus dedicated static audits.
- Pass/Fail semantics: All tests must exit with code 0 and 0 failures.
- Zero Em-Dash assertion: `node tests/audit_emdash_comprehensive.cjs` / `tests/tier5_adversarial/tier5_m5_2_hardening.test.js`.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Romantic Journey E2E | Hero -> LiveCounter -> Timeline -> Gallery -> Letter -> Reasons -> Coupons -> BucketList | High |
| 2 | Audio Interaction Dock Workflow | Floating dock play/pause toggle, volume slider, track metadata, background playback | Medium |
| 3 | Mobile Touch and Layout Interaction | Touch target sizes >=44px, drawer navigation, responsive overflow verification | High |
