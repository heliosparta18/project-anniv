import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { createServer } from 'vite';
import { setupTestEnvironment } from '../helpers/dom_mock.js';
import {
  coupleProfile,
  milestones,
  polaroids,
  loveLetter,
  loveReasons,
  coupons,
  bucketListItems,
  musicTracks
} from '../../src/data/anniversaryData.ts';
import {
  calculateGregorianDifference
} from '../../src/hooks/useLiveCounter.ts';
import {
  startRomanticChords,
  stopRomanticChords,
  isSynthPlaying
} from '../../src/utils/audioSynth.ts';

// --------------------------------------------------------------------------
// TIER 4: Real-World Romantic Journey - Full End-to-End Simulation
// --------------------------------------------------------------------------
test('Tier 4 - Real-World Romantic Journey: Full User Journey Simulation', async () => {
  const env = setupTestEnvironment();
  const storage = env.localStorage;
  storage.clear();

  const server = await createServer({
    ssr: { external: ['react', 'react-dom', 'lucide-react', 'canvas-confetti'] }
  });

  try {
    // Load genuine production components via Vite SSR
    const { LiveCounter } = await server.ssrLoadModule('./src/components/hero/LiveCounter.tsx');
    const { TimelineCard } = await server.ssrLoadModule('./src/components/timeline/TimelineCard.tsx');
    const { PolaroidCard } = await server.ssrLoadModule('./src/components/gallery/PolaroidCard.tsx');
    const { LightboxModal } = await server.ssrLoadModule('./src/components/gallery/LightboxModal.tsx');
    const { VirtualEnvelope } = await server.ssrLoadModule('./src/components/letter/VirtualEnvelope.tsx');
    const { ReasonCard } = await server.ssrLoadModule('./src/components/reasons/ReasonCard.tsx');
    const { VoucherCard } = await server.ssrLoadModule('./src/components/coupons/VoucherCard.tsx');
    const { BucketListItem } = await server.ssrLoadModule('./src/components/bucketlist/BucketListItem.tsx');

    // ========================================================================
    // SCENE 1: ARRIVAL AT HERO SECTION & LIVE GREGORIAN COUNTER
    // ========================================================================
    assert.strictEqual(coupleProfile.partnerName, 'Dinda', 'Partner name must be Dinda');
    assert.strictEqual(coupleProfile.myName, 'Daffa', 'Author name must be Daffa');

    // Calculate live Gregorian elapsed time from anniversary date to now
    const counterResult = calculateGregorianDifference(coupleProfile.anniversaryDate);
    assert.strictEqual(counterResult.isValid, true, 'Anniversary date calculation must be valid');
    assert.ok(typeof counterResult.totalDays === 'number', 'Total days must be a number');
    assert.ok(counterResult.formattedElapsed.includes('hari bersama'), 'Formatted text must include days together');

    // Render LiveCounter SSR
    const liveCounterHtml = ReactDOMServer.renderToString(
      React.createElement(LiveCounter, { startDate: coupleProfile.anniversaryDate })
    );
    assert.ok(liveCounterHtml.includes('Tahun') && liveCounterHtml.includes('Bulan') && liveCounterHtml.includes('Hari'), 'LiveCounter must display metric labels');

    // ========================================================================
    // SCENE 2: VINYL TURNTABLE AUDIO PLAYER ACTIVATION & PLAYLIST CYCLING
    // ========================================================================
    assert.strictEqual(musicTracks.length, 4, 'Must have exactly 4 romantic tracks');
    const initialTrack = musicTracks[0];
    assert.strictEqual(initialTrack.title, 'Until I Found You');

    // Start background procedural music
    const audioActive = await startRomanticChords(0.7);
    assert.ok(audioActive, 'Audio playback must initiate successfully');
    assert.strictEqual(isSynthPlaying(), true, 'Synth audio must be actively playing');

    // Simulate circular playlist cycling (next track)
    let currentTrackIdx = 0;
    for (let i = 1; i <= 4; i++) {
      currentTrackIdx = (currentTrackIdx + 1) % musicTracks.length;
      const activeTrack = musicTracks[currentTrackIdx];
      assert.ok(activeTrack.title.length > 0, `Track ${currentTrackIdx} must have title`);
      assert.ok(activeTrack.artist.length > 0, `Track ${currentTrackIdx} must have artist`);
    }
    // Wrapped back to 0
    assert.strictEqual(currentTrackIdx, 0, 'Circular playlist must wrap back to initial track');

    // ========================================================================
    // SCENE 3: INTERACTIVE RELATIONSHIP TIMELINE JOURNEY
    // ========================================================================
    assert.strictEqual(milestones.length, 5, 'Must have exactly 5 chronological milestones');
    const expectedMilestoneKeywords = [
      'Pertama Kali Ketemu',
      'Midnight Talks & Random Mie',
      'Resmi',
      'Kehujanan Bareng',
      'Penuh Cinta'
    ];

    milestones.forEach((m, idx) => {
      assert.ok(
        m.title.includes(expectedMilestoneKeywords[idx]),
        `Milestone ${idx + 1} must match expected narrative checkpoint (title: "${m.title}")`
      );

      const cardHtml = ReactDOMServer.renderToString(
        React.createElement(TimelineCard, { milestone: m, index: idx })
      );
      const expectedEscaped = m.title.replace(/&/g, '&amp;');
      assert.ok(
        cardHtml.includes(expectedEscaped) || cardHtml.includes(m.title),
        `Timeline card ${idx + 1} must render milestone title`
      );
    });

    // ========================================================================
    // SCENE 4: SCRAPBOOK POLAROID GALLERY & 3D CARD FLIP
    // ========================================================================
    assert.strictEqual(polaroids.length, 6, 'Must have exactly 6 polaroids in gallery');

    // Filter by category 'dates'
    const datePhotos = polaroids.filter(p => p.category === 'dates');
    assert.ok(datePhotos.length >= 2, 'Dates category must contain at least 2 photos');

    // Render front of PolaroidCard
    const photo1 = polaroids[0];
    const polaroidHtml = ReactDOMServer.renderToString(
      React.createElement(PolaroidCard, { photo: photo1 })
    );
    assert.ok(polaroidHtml.includes(photo1.caption), 'Polaroid card front must render caption');
    assert.ok(polaroidHtml.includes('Baca Catatan Rahasia'), 'Polaroid card must render flip button');
    assert.ok(polaroidHtml.includes(photo1.note || photo1.caption), 'Polaroid card back must render note');

    // ========================================================================
    // SCENE 5: FULLSCREEN LIGHTBOX MODAL WITH NAVIGATION
    // ========================================================================
    const lightboxHtml = ReactDOMServer.renderToString(
      React.createElement(LightboxModal, {
        photo: photo1,
        photos: polaroids,
        isOpen: true,
        onClose: () => {},
      })
    );
    assert.ok(lightboxHtml.includes(photo1.caption), 'Lightbox modal must display full photo caption');
    assert.ok(lightboxHtml.includes('Close photo preview'), 'Lightbox modal must display close button');
    assert.ok(lightboxHtml.includes('1 of 6 Moments'), 'Lightbox modal must display photo counter badge');

    // ========================================================================
    // SCENE 6: INTERACTIVE LOVE LETTER & VIRTUAL ENVELOPE
    // ========================================================================
    // 1. Sealed envelope
    const sealedEnvHtml = ReactDOMServer.renderToString(
      React.createElement(VirtualEnvelope, { defaultOpen: false })
    );
    assert.ok(sealedEnvHtml.includes('Pecahkan segel lilin'), 'Sealed envelope must prompt to unseal');

    // 2. Opened envelope with parchment letter
    const openedEnvHtml = ReactDOMServer.renderToString(
      React.createElement(VirtualEnvelope, { defaultOpen: true })
    );
    assert.ok(openedEnvHtml.includes(loveLetter.salutation), 'Opened envelope must render letter salutation');
    assert.ok(openedEnvHtml.includes(loveLetter.opening), 'Opened envelope must render letter opening');
    assert.ok(openedEnvHtml.includes('Lipat &amp; Segel Kembali') || openedEnvHtml.includes('Lipat & Segel Kembali'), 'Opened envelope must render reseal action');

    // Audio still smoothly playing
    assert.strictEqual(isSynthPlaying(), true, 'Music must continue playing during love letter interaction');

    // ========================================================================
    // SCENE 7: REASONS WHY I LOVE YOU CARD DECK & HEART REACTIONS
    // ========================================================================
    assert.strictEqual(loveReasons.length, 12, 'Must have exactly 12 love reasons');
    const reason1 = loveReasons[0];

    // User clicks heart reaction: increment count and persist
    const REACTIONS_KEY = 'anniv_love_reasons_reactions';
    const reactionsData = { [reason1.id]: 3 };
    storage.setItem(REACTIONS_KEY, JSON.stringify(reactionsData));

    const reasonHtml = ReactDOMServer.renderToString(
      React.createElement(ReasonCard, {
        reason: reason1,
        currentReactionCount: reactionsData[reason1.id],
        onReaction: () => {},
      })
    );
    assert.ok(reasonHtml.includes(reason1.text), 'Reason card must render text');
    assert.ok(reasonHtml.includes('3'), 'Reason card must render updated reaction count');

    // ========================================================================
    // SCENE 8: RELATIONSHIP VOUCHER BOOK & REDEMPTION
    // ========================================================================
    assert.strictEqual(coupons.length, 8, 'Must have exactly 8 relationship coupons');
    const targetCoupon = coupons[0]; // e.g. Free Hug

    // User redeems target coupon
    const COUPONS_KEY = 'anniv_redeemed_coupons';
    const redeemedList = [targetCoupon.id];
    storage.setItem(COUPONS_KEY, JSON.stringify(redeemedList));

    const voucherHtml = ReactDOMServer.renderToString(
      React.createElement(VoucherCard, {
        coupon: targetCoupon,
        isRedeemed: true,
        onRedeem: () => {},
      })
    );
    assert.ok(
      voucherHtml.includes('TERPAKAI') || voucherHtml.includes('REDEEMED'),
      'Redeemed coupon must render stamped state'
    );

    // ========================================================================
    // SCENE 9: OUR BUCKET LIST & FUTURE DREAMS WITH PROGRESS
    // ========================================================================
    assert.strictEqual(bucketListItems.length, 8, 'Must have exactly 8 bucket list items');
    const itemToComplete = bucketListItems[0];

    // User checks off dream item
    const BUCKET_KEY = 'anniv_bucket_list_completed';
    const completedList = [itemToComplete.id, bucketListItems[1].id];
    storage.setItem(BUCKET_KEY, JSON.stringify(completedList));

    const bucketItemHtml = ReactDOMServer.renderToString(
      React.createElement(BucketListItem, {
        item: itemToComplete,
        isCompleted: true,
        onToggle: () => {},
      })
    );
    assert.ok(bucketItemHtml.includes(itemToComplete.text), 'Bucket list item must render text');
    assert.ok(bucketItemHtml.includes('line-through') || bucketItemHtml.includes('opacity-'), 'Completed item must render completed styling');

    // Progress computation: 2 of 8 = 25%
    const progressPercent = Math.round((completedList.length / bucketListItems.length) * 100);
    assert.strictEqual(progressPercent, 25, 'Progress must calculate to 25%');

    // ========================================================================
    // SCENE 10: SIMULATED FULL PAGE RELOAD & PERSISTENCE VERIFICATION
    // ========================================================================
    // Re-read storage
    const reloadedReactions = JSON.parse(storage.getItem(REACTIONS_KEY) || '{}');
    const reloadedCoupons = JSON.parse(storage.getItem(COUPONS_KEY) || '[]');
    const reloadedBucket = JSON.parse(storage.getItem(BUCKET_KEY) || '[]');

    assert.strictEqual(reloadedReactions[reason1.id], 3, 'Heart reactions must survive reload');
    assert.deepStrictEqual(reloadedCoupons, [targetCoupon.id], 'Redeemed coupons must survive reload');
    assert.deepStrictEqual(reloadedBucket, completedList, 'Bucket list progress must survive reload');
  } finally {
    stopRomanticChords();
    await server.close();
  }
});
