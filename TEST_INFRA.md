# Test Infrastructure Specification: Comprehensive Aesthetic Anniversary Website

## 1. Executive Summary & Testing Philosophy
This document formalizes the End-to-End (E2E) and requirement-driven testing infrastructure for the Anniversary Website (`D:\anniv`).

In accordance with the **Dual-Track Testing Architecture**, all test cases are derived strictly from authoritative requirement documents:
- `C:\Users\ADVAN\.agents\teamwork\ORIGINAL_REQUEST.md` (Aesthetic warm feminine palette, natural Gen-Z copywriting, asset fallback, zero console errors, responsive integrity)
- `C:\Users\ADVAN\.agents\teamwork\orchestrator\PROJECT.md` (Features 1 through 14, Data Contracts, Responsive & Audio Architecture)

Tests are written in `D:\anniv\tests/` using an **opaque-box** methodology. The test suite exercises the external interface contracts, data schemas, DOM structures, responsive invariants, accessibility standards, audio fallback resilience, and user interaction journeys without coupling to internal component private implementation details.

---

## 2. Test Architecture & Runner Semantics

### 2.1 Runner Environment
- **Runtime**: Node.js v23 native test runner (`node --test`) with ESM module support.
- **Dedicated Orchestrator Script**: `node tests/run_all_e2e.js` which executes all tiers, performs static analysis, audits responsive layout invariants, verifies WCAG AA contrast, and outputs a formatted pass/fail summary matrix.
- **Independence & Isolation**: Tests run in an isolated in-memory simulated DOM / browser environment with mocked HTML5 Audio, Web Audio API (`AudioContext`), Canvas, and `localStorage`. No external browser binaries or network dependencies are required, guaranteeing 100% deterministic runs across any CI/local environment.

### 2.2 Pass/Fail Criteria
- **Zero Uncaught Exceptions**: All lifecycle transitions, audio play attempts, and user events must handle errors cleanly.
- **Zero Horizontal Overflow**: All viewports (320px, 375px, 414px, 768px, 1024px, 1440px) must maintain `overflow-x-clip` / `w-full max-w-` invariants.
- **WCAG AA Compliance**: Foreground/background color combinations must satisfy a minimum contrast ratio of 4.5:1 for normal text (>=12:1 achieved for primary text on warm linen).
- **Touch Target Minimums**: All interactive buttons, cards, pills, and toggles must meet or exceed 44x44 CSS pixels.
- **Asset Integrity**: 100% of referenced local SVGs, images, and audio tracks must resolve to valid files on disk.

---

## 3. Feature Inventory Mapping (Tier 1 Matrix)

The test suite provides **at least 5 distinct test cases** for every feature listed in `PROJECT.md` § Feature Inventory:

| # | Feature Name | Test Suite File | Minimum Test Cases | Target Invariants |
|---|--------------|-----------------|--------------------|-------------------|
| 1 | Soft, Warm, Feminine Design System | `tests/tier1_features/f01_design_system.test.js` | 5 | Warm cream/linen/rose wine palette tokens, Cormorant/Jakarta/Caveat typography, warm cocoa shadows, WCAG AA contrast ratio |
| 2 | Centralized Typed Data & Asset Config | `tests/tier1_features/f02_typed_data.test.js` | 5 | CoupleProfile schema, Milestone schema, PolaroidPhoto schema, LoveReason schema, natural Gen-Z copy without cringe clichés |
| 3 | Placeholder Media & Asset Fallback | `tests/tier1_features/f03_placeholder_assets.test.js` | 5 | SVG placeholder generation, gradient fallbacks, ASSETS_GUIDE documentation, image error handler fallback |
| 4 | Responsive App Shell & Ambient Particles | `tests/tier1_features/f04_app_shell.test.js` | 5 | Global container, floating petals/hearts particles, sticky navbar with blur, zero horizontal overflow (`overflow-x-clip`) |
| 5 | Hero Section with Romantic Header | `tests/tier1_features/f05_hero_section.test.js` | 5 | Couple names display, romantic title, intimate Gen-Z quote, smooth-scroll CTA link to journey, semantic header landmark |
| 6 | Live Anniversary Gregorian Counter | `tests/tier1_features/f06_live_counter.test.js` | 5 | Accurate years/months/days calculation, ticking seconds, leap year handling, positive elapsed duration, responsive unit cards |
| 7 | Aesthetic Vinyl Turntable Audio Player | `tests/tier1_features/f07_turntable_audio.test.js` | 5 | Spinning disc animation state, tone arm resting/playing toggle, play/pause state machine, track selector, Web Audio synthetic chord fallback |
| 8 | Interactive Relationship Journey Timeline | `tests/tier1_features/f08_timeline_journey.test.js` | 5 | Chronological sorting, category tags (firsts/trips/memories), photo preview slots, mobile single-spine collapse |
| 9 | Scrapbook Polaroid Flip Gallery | `tests/tier1_features/f09_polaroid_gallery.test.js` | 5 | Organic tilted rotation angles (-2.5 to 2.5 deg), washi tape styling, 3D card flip trigger, category filtering, back note display |
| 10 | Fullscreen Polaroid Lightbox Modal | `tests/tier1_features/f10_lightbox_modal.test.js` | 5 | Click opens modal, high-res preview, caption and date display, touch close button, ESC key listener, background scroll lock |
| 11 | Interactive Love Letter & Virtual Envelope | `tests/tier1_features/f11_love_letter.test.js` | 5 | Wax seal click trigger, seal break animation, envelope flap opening, parchment paper view, intimate heartfelt copy |
| 12 | "Reasons Why I Love You" Card Flipper | `tests/tier1_features/f12_reasons_deck.test.js` | 5 | Card deck sequential browsing, shuffle randomizer, reason number badge, heart reaction increment, category tags |
| 13 | Perforated Relationship Voucher Book | `tests/tier1_features/f13_relationship_vouchers.test.js` | 5 | Coupon rendering, perforated coupon border, redeem click action, visual stamped state, localStorage write/persistence |
| 14 | Our Bucket List & Future Dreams | `tests/tier1_features/f14_bucket_list.test.js` | 5 | Checklist rendering, heart checkbox toggle, completion progress percentage calculation, confetti trigger on completion, localStorage persistence |

---

## 4. 4-Tier Test Methodology

### Tier 1: Feature Coverage (>=5 tests per feature)
- Validates that every individual feature satisfies all functional specifications, schema requirements, and visual invariants.
- 14 features × 5 tests = **70+ unit and component contract tests**.

### Tier 2: Boundary & Corner Cases
Implemented in `tests/tier2_boundaries/boundary_corner_cases.test.js`:
1. **Empty Asset Resolution**: Graceful rendering when photo URLs are null or empty strings (falls back to aesthetic SVG/CSS gradient).
2. **Invalid Date Strings**: Invalid ISO string handling in Gregorian counter without NaN or crash.
3. **Leap Year Boundary**: Correct day calculation for leap years (e.g., February 29th start date).
4. **Maximum String Lengths**: Ultra-long partner names, love letter paragraphs, or reason strings do not break card layout or cause horizontal text clipping.
5. **Zero Network Connectivity**: Entire application, fonts, and SVGs operate fully offline without external API dependencies.
6. **Autoplay Blocked Recovery**: When browser blocks audio autoplay (`NotAllowedError`), state gracefully transitions to "ready to play" without uncaught console errors.

### Tier 3: Cross-Feature Interactions
Implemented in `tests/tier3_interactions/cross_feature_interactions.test.js`:
1. **Audio Playback + Timeline Scroll**: Audio remains uninterrupted and playing smoothly while scrolling or filtering the relationship timeline.
2. **Coupon Redemption + Page Reload**: Redeeming voucher #1 and #3, updating `localStorage`, then simulating full page reload ensures redeemed state is retained.
3. **Love Letter Open + Background Music**: Opening the virtual envelope and viewing love letter does not pause or mute music playback.
4. **Gallery Filter + Lightbox Traversal**: Filtering gallery by "travel", opening a polaroid in lightbox, closing lightbox, and confirming filter remains intact.
5. **Bucket List Progress Sync**: Toggling bucket list items updates the progress bar and dynamically updates celebration readiness.

### Tier 4: Real-World Workload Scenarios
Implemented in `tests/tier4_workloads/romantic_journey_e2e.test.js`:
- Simulates the complete girlfriend anniversary viewing session:
  1. Arrives at page: Hero greets couple names, ambient particles float in background.
  2. Live counter shows exact elapsed relationship milestones.
  3. Clicks vinyl turntable play button: Audio begins playing (or synthesizer chords).
  4. Scrolls to timeline: Reviews milestone 1 through milestone N in chronological sequence.
  5. Explores polaroid gallery: Toggles category filter, flips polaroid to read handwritten note, opens polaroid in fullscreen lightbox, closes lightbox.
  6. Breaks wax seal on love letter: Envelope unfolds, parchment letter displays heartfelt message.
  7. Browses reasons deck: Flips cards, taps heart reaction counter.
  8. Browses relationship vouchers: Redeems "Late Night Boba" coupon, verifies stamp effect.
  9. Checks bucket list: Checks off a dream item, triggers celebratory confetti.
  10. Page refresh test: State remains persistent and intact.

---

## 5. Static Integrity & Invariant Audits

Implemented in `tests/static_integrity/`:
- **`asset_integrity.test.js`**: Scans public directory, data file, and HTML to verify all SVG placeholders, icons, and audio tracks exist and are readable.
- **`responsive_invariants.test.js`**: Evaluates CSS utility classes and layout specifications across 320px, 375px, 414px, 768px, 1024px, 1440px to ensure `overflow-x-clip`, flex/grid responsiveness, and no fixed-width horizontal blowouts.
- **`wcag_contrast.test.js`**: Calculates WCAG relative luminance on all text/background pairs to guarantee contrast >= 4.5:1.
- **`touch_targets.test.js`**: Inspects all interactive elements (buttons, checkboxes, coupon tabs, vinyl controls) to guarantee touch target area >= 44x44px.

---

## 6. Execution Command
To run the entire E2E and invariant test suite:
```bash
node tests/run_all_e2e.js
```
or via the native Node test runner:
```bash
node --test tests/**/*.test.js
```
