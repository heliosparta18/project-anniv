# Project: Anniversary Website Modernization (Daffa & Dinda)

## Architecture
- **Framework & Runtime**: React 19.3.1, Vite 8.3.5, TypeScript 7.0.2, Tailwind CSS v4.3.4 (`@tailwindcss/vite`).
- **Core Principles**: Single source of truth data structure (`src/data/anniversaryData.ts`), component-driven design (`src/components/*`), zero em-dash typography anti-slop compliance, mobile-responsive layout (`overflow-x: clip`, min touch targets 44x44px), WCAG AA color contrast.
- **Audio Subsystem**: Floating `VinylPlayer` dock at `fixed bottom-5 right-5` with YouTube IFrame API integration for track `o25_Tn8BnFM` ("Anugerah Terindah" by Andmesh Kamaleng) with procedural Web Audio chord synthesizer fallback for headless/test environments.
- **Card Layout & Typography**: Replacement of stock vector SVG illustrations in `TimelineCard` and `PolaroidCard` with typography-first memory and story cards utilizing Cormorant Garamond (editorial serif), Plus Jakarta Sans (clean sans), and Caveat (intimate handwriting).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Personalization to Daffa & Dinda | Update names and initials across data files, components, and page title | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Placeholder SVG Removal | Remove placeholder images and stock SVG illustrations from cards and UI | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Aesthetic Typography Cards | Rebuild Timeline and Polaroid cards into clean typography-first containers | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Conversational Indonesian Tone | Rewrite all copy, messages, notes, and captions to natural "bahasa santai" | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Anti-Slop Zero Em-Dash Guardrail | Ensure all rewritten text contains zero em-dashes and adheres to anti-slop rules | M2 | Project Guidelines |
| 6 | Background Audio Player (YouTube) | Integrate YouTube audio for https://youtu.be/o25_Tn8BnFM ("Anugerah Terindah") | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Floating Audio Play/Pause Controls | Ensure floating player dock controls audio playback seamlessly | M3 | ORIGINAL_REQUEST §R3 |
| 8 | E2E Test Suite & Build Verification | Pass 100% of test suites, npm run build, typecheck, lint, and dev runtime checks | M4 | ORIGINAL_REQUEST §Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Personalization & Aesthetic Cards | Couple names (Daffa & Dinda), remove placeholder SVGs, implement aesthetic typography card layouts in Timeline & Gallery, sync test assertions | none | DONE |
| M2 | Conversational Indonesian Copywriting | Rewrite all website messages, love letter, reasons, coupons, bucket list, and UI labels into relaxed "bahasa santai" with zero em-dashes | M1 | DONE |
| M3 | Background Audio Player & Controls | Integrate YouTube track o25_Tn8BnFM into floating VinylPlayer with robust play/pause and synth fallback | M1 | IN_PROGRESS |
| M4 | Final E2E Pass & Coverage Hardening | Run build, typecheck, lint, all 24+ test suites (Tiers 1-5), and verify runtime dev server | M1, M2, M3 | PLANNED |

## Interface Contracts
### Data Schema (`src/types/anniversary.ts` ↔ `src/data/anniversaryData.ts`)
- `coupleProfile`: `{ partnerName: 'Dinda', myName: 'Daffa', anniversaryDate: string, yearsTogether: number, ... }`
- `loveLetter`: `{ title: string, subtitle: string, greeting: string, paragraphs: string[], signature: string, sealText: 'D & D' }`
- `musicTracks`: Primary track index 0: `{ id: 'track-1', title: 'Anugerah Terindah', artist: 'Andmesh Kamaleng', youtubeId: 'o25_Tn8BnFM', duration: string, ... }`

### UI Components ↔ Floating Audio
- `VinylPlayer` dock at `bottom-5 right-5` handles `isPlaying`, `togglePlay`, `volume`, and embeds YouTube Iframe player with API hook fallback.
- Floating controls maintain accessible touch targets (`min-h-[44px] min-w-[44px]`) and ARIA labels.

## Code Layout
- `src/data/anniversaryData.ts`: Central data store for couple profile, milestones, polaroids, letter, reasons, coupons, bucket list, music.
- `src/components/timeline/TimelineCard.tsx`: Aesthetic typography milestone card (no image tags).
- `src/components/gallery/PolaroidCard.tsx`: Aesthetic typography polaroid memory card.
- `src/components/gallery/LightboxModal.tsx`: Aesthetic modal view for polaroids.
- `src/components/letter/VirtualEnvelope.tsx` & `WaxSeal.tsx`: Envelope and wax seal with D & D initials.
- `src/components/audio/VinylPlayer.tsx`: Floating dock player with YouTube audio controls.
- `src/hooks/useAudioPlayer.ts`: Audio management hook supporting YouTube iframe and procedural synth fallback.
- `tests/`: 24 test suites across Tiers 1-5.
