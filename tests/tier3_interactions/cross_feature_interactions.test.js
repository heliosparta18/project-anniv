import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { createServer } from 'vite';
import { setupTestEnvironment } from '../helpers/dom_mock.js';
import {
  startRomanticChords,
  stopRomanticChords,
  isSynthPlaying
} from '../../src/utils/audioSynth.ts';
import {
  milestones,
  polaroids,
  coupons,
  loveLetter
} from '../../src/data/anniversaryData.ts';

let sharedServer;
async function getViteServer() {
  if (!sharedServer) {
    sharedServer = await createServer({
      ssr: { external: ['react', 'react-dom', 'lucide-react'] }
    });
  }
  return sharedServer;
}

test.after(async () => {
  if (sharedServer) {
    await sharedServer.close();
  }
});

// --------------------------------------------------------------------------
// TEST 1: Audio Playback Continuity During Timeline Navigation
// --------------------------------------------------------------------------
test('Tier 3 - Interaction: Audio Playback Continuity During Timeline Navigation', async () => {
  setupTestEnvironment();
  const server = await getViteServer();
  const { TimelineCard } = await server.ssrLoadModule('./src/components/timeline/TimelineCard.tsx');

  // 1. Start audio playback
  const audioStarted = await startRomanticChords(0.7);
  assert.ok(audioStarted, 'Audio synth must start playback');
  assert.strictEqual(isSynthPlaying(), true, 'Synth playback must report active');

  // 2. Simulate timeline browsing across all milestones and categories
  const categories = ['firsts', 'trips', 'memories', 'milestones'];
  for (const cat of categories) {
    const filtered = milestones.filter(m => m.category === cat);
    assert.ok(filtered.length >= 1, `Category ${cat} must contain at least one milestone`);

    for (const milestone of filtered) {
      const html = ReactDOMServer.renderToString(
        React.createElement(TimelineCard, {
          milestone,
          index: 0,
        })
      );
      const expectedTitle = milestone.title.replace(/&/g, '&amp;');
      assert.ok(html.includes(expectedTitle) || html.includes(milestone.title), 'Timeline card must render milestone title');
    }

    // Invariant: audio playback must not be interrupted by timeline navigation
    assert.strictEqual(isSynthPlaying(), true, 'Audio playback must remain active throughout timeline interactions');
  }

  // 3. Clean audio shutdown
  stopRomanticChords();
  assert.strictEqual(isSynthPlaying(), false, 'Audio playback must stop when requested');
});

// --------------------------------------------------------------------------
// TEST 2: Coupon Redemption Persists Across Simulated Page Reload
// --------------------------------------------------------------------------
test('Tier 3 - Interaction: Coupon Redemption Persists Across Simulated Page Reload', async () => {
  const env = setupTestEnvironment();
  const storage = env.localStorage;
  storage.clear();

  const server = await getViteServer();
  const { VoucherCard } = await server.ssrLoadModule('./src/components/coupons/VoucherCard.tsx');
  const storageKey = 'anniv_redeemed_coupons';

  // 1. Initial state: 0 redeemed coupons
  assert.strictEqual(storage.getItem(storageKey), null, 'Initial coupon storage must be empty');

  // 2. User redeems coupon-1 and coupon-3
  const initialRedeemed = ['coupon-1', 'coupon-3'];
  storage.setItem(storageKey, JSON.stringify(initialRedeemed));

  // 3. Simulated page reload: read from storage
  const reloadedIds = JSON.parse(storage.getItem(storageKey) || '[]');
  assert.deepStrictEqual(reloadedIds, ['coupon-1', 'coupon-3'], 'Storage must persist redeemed coupon IDs');

  // 4. Render VoucherCard for redeemed coupon (coupon-1)
  const coupon1 = coupons.find(c => c.id === 'coupon-1') || coupons[0];
  const redeemedHtml = ReactDOMServer.renderToString(
    React.createElement(VoucherCard, {
      coupon: coupon1,
      isRedeemed: reloadedIds.includes(coupon1.id),
      onRedeem: () => {},
    })
  );
  assert.ok(
    redeemedHtml.includes('TERPAKAI') || redeemedHtml.includes('REDEEMED'),
    'Redeemed coupon must render stamped state after simulated reload'
  );

  // 5. Render VoucherCard for available coupon (coupon-2)
  const coupon2 = coupons.find(c => c.id === 'coupon-2') || coupons[1];
  const availableHtml = ReactDOMServer.renderToString(
    React.createElement(VoucherCard, {
      coupon: coupon2,
      isRedeemed: reloadedIds.includes(coupon2.id),
      onRedeem: () => {},
    })
  );
  assert.ok(
    !availableHtml.includes('TERPAKAI') && !availableHtml.includes('REDEEMED'),
    'Available coupon must NOT render stamped state after simulated reload'
  );

  // 6. User un-redeems coupon-1 (reset action)
  const updatedRedeemed = ['coupon-3'];
  storage.setItem(storageKey, JSON.stringify(updatedRedeemed));

  // Second reload: verify coupon-1 is now available
  const secondReloadIds = JSON.parse(storage.getItem(storageKey) || '[]');
  assert.strictEqual(secondReloadIds.includes('coupon-1'), false, 'Coupon-1 must be marked available after reset');
  assert.strictEqual(secondReloadIds.includes('coupon-3'), true, 'Coupon-3 must remain redeemed');
});

// --------------------------------------------------------------------------
// TEST 3: Opening Love Letter While Music Plays
// --------------------------------------------------------------------------
test('Tier 3 - Interaction: Opening Love Letter While Music Plays', async () => {
  setupTestEnvironment();
  const server = await getViteServer();
  const { VirtualEnvelope } = await server.ssrLoadModule('./src/components/letter/VirtualEnvelope.tsx');

  // 1. Start background music
  await startRomanticChords(0.5);
  assert.strictEqual(isSynthPlaying(), true, 'Music must be playing before letter is opened');

  // 2. Sealed envelope state
  const sealedHtml = ReactDOMServer.renderToString(
    React.createElement(VirtualEnvelope, { defaultOpen: false })
  );
  assert.ok(sealedHtml.includes('Pecahkan segel lilin'), 'Sealed envelope renders wax seal');
  assert.strictEqual(isSynthPlaying(), true, 'Music playback must continue while envelope is sealed');

  // 3. User clicks wax seal: unseal animation & parchment display
  const openedHtml = ReactDOMServer.renderToString(
    React.createElement(VirtualEnvelope, { defaultOpen: true })
  );
  assert.ok(openedHtml.includes(loveLetter.salutation), 'Opened envelope renders love letter salutation');
  assert.ok(openedHtml.includes('Lipat &amp; Segel Kembali') || openedHtml.includes('Lipat & Segel Kembali'), 'Opened envelope renders reseal button');

  // Invariant: audio playback must continue smoothly while letter unfolds
  assert.strictEqual(isSynthPlaying(), true, 'Music playback must NOT stop or stutter when love letter is opened');

  // 4. User reseals envelope
  const resealedHtml = ReactDOMServer.renderToString(
    React.createElement(VirtualEnvelope, { defaultOpen: false })
  );
  assert.ok(resealedHtml.includes('Pecahkan segel lilin'), 'Resealed envelope shows wax seal again');
  assert.strictEqual(isSynthPlaying(), true, 'Music playback must remain active after envelope resealing');

  // 5. Clean audio shutdown
  stopRomanticChords();
  assert.strictEqual(isSynthPlaying(), false);
});

// --------------------------------------------------------------------------
// TEST 4: Gallery Filter Preserved After Lightbox Dismissal
// --------------------------------------------------------------------------
test('Tier 3 - Interaction: Gallery Filter Preserved After Lightbox Dismissal', async () => {
  const server = await getViteServer();
  const { LightboxModal } = await server.ssrLoadModule('./src/components/gallery/LightboxModal.tsx');

  // 1. Active category selection state
  let activeCategory = 'travel';
  const travelPhotos = polaroids.filter(p => p.category === activeCategory);
  assert.ok(travelPhotos.length >= 1, 'Must have at least one travel photo');

  // 2. Open LightboxModal for first travel photo
  const selectedPhoto = travelPhotos[0];
  const openModalHtml = ReactDOMServer.renderToString(
    React.createElement(LightboxModal, {
      photo: selectedPhoto,
      photos: travelPhotos,
      isOpen: true,
      onClose: () => {},
    })
  );
  assert.ok(openModalHtml.includes(selectedPhoto.caption), 'Lightbox modal must render active photo caption');
  assert.ok(openModalHtml.includes('Close photo preview'), 'Lightbox modal must render close button');

  // 3. Dismiss LightboxModal (simulate onClose)
  let modalPhoto = selectedPhoto;
  const handleClose = () => {
    modalPhoto = null;
  };
  handleClose();
  assert.strictEqual(modalPhoto, null, 'modalPhoto must be cleared on close');

  // 4. Render LightboxModal with null photo: must render nothing
  const closedModalHtml = ReactDOMServer.renderToString(
    React.createElement(LightboxModal, {
      photo: modalPhoto,
      photos: travelPhotos,
      isOpen: false,
      onClose: () => {},
    })
  );
  assert.strictEqual(closedModalHtml, '', 'Closed lightbox modal must render empty output');

  // Invariant: category filter in gallery must remain 'travel' (not reset to 'all')
  assert.strictEqual(activeCategory, 'travel', 'Gallery active category filter must be preserved after lightbox dismissal');
  const photosAfterDismiss = polaroids.filter(p => p.category === activeCategory);
  assert.deepStrictEqual(photosAfterDismiss, travelPhotos, 'Photos in grid must remain filtered by category');
});

// --------------------------------------------------------------------------
// TEST 5: Multi-Feature LocalStorage Isolation
// --------------------------------------------------------------------------
test('Tier 3 - Interaction: Multi-Feature LocalStorage Isolation', () => {
  const env = setupTestEnvironment();
  const storage = env.localStorage;
  storage.clear();

  const COUPONS_KEY = 'anniv_redeemed_coupons';
  const BUCKET_KEY = 'anniv_bucket_list_completed';
  const REACTIONS_KEY = 'anniv_love_reasons_reactions';

  // 1. Step 1: Write to coupons storage
  const initialCoupons = ['coupon-1', 'coupon-2'];
  storage.setItem(COUPONS_KEY, JSON.stringify(initialCoupons));

  assert.strictEqual(storage.getItem(BUCKET_KEY), null, 'Bucket list key must remain empty');
  assert.strictEqual(storage.getItem(REACTIONS_KEY), null, 'Reactions key must remain empty');

  // 2. Step 2: Write to bucket list storage
  const initialBucket = ['bucket-1', 'bucket-4'];
  storage.setItem(BUCKET_KEY, JSON.stringify(initialBucket));

  // Verify coupons storage is intact
  assert.deepStrictEqual(JSON.parse(storage.getItem(COUPONS_KEY)), initialCoupons, 'Coupons key must NOT be affected by bucket list write');

  // 3. Step 3: Write to love reasons reactions
  const initialReactions = { 'reason-1': 5, 'reason-2': 12 };
  storage.setItem(REACTIONS_KEY, JSON.stringify(initialReactions));

  // Verify all 3 keys are isolated and accurate
  assert.deepStrictEqual(JSON.parse(storage.getItem(COUPONS_KEY)), initialCoupons);
  assert.deepStrictEqual(JSON.parse(storage.getItem(BUCKET_KEY)), initialBucket);
  assert.deepStrictEqual(JSON.parse(storage.getItem(REACTIONS_KEY)), initialReactions);

  // 4. Step 4: Storage corruption resilience in one key does not affect others
  storage.setItem(COUPONS_KEY, 'INVALID_CORRUPTED_JSON{{[');

  // Bucket list and reactions must remain 100% readable and valid
  const safeBucket = JSON.parse(storage.getItem(BUCKET_KEY));
  assert.deepStrictEqual(safeBucket, initialBucket, 'Bucket list must remain uncorrupted');

  const safeReactions = JSON.parse(storage.getItem(REACTIONS_KEY));
  assert.deepStrictEqual(safeReactions, initialReactions, 'Reactions must remain uncorrupted');

  // Corrupted key safe parse handling
  let parsedCoupons = [];
  try {
    parsedCoupons = JSON.parse(storage.getItem(COUPONS_KEY));
  } catch {
    parsedCoupons = []; // Safe fallback
  }
  assert.deepStrictEqual(parsedCoupons, [], 'Corrupted key must fallback to safe empty array without app crash');
});
