import test from 'node:test';
import assert from 'node:assert/strict';
import {
  anniversaryData,
  coupleProfile,
  milestones,
  polaroids,
  loveLetter,
  loveReasons,
  coupons,
  bucketListItems,
  musicTracks
} from '../../src/data/anniversaryData.ts';

test('Feature 2 - Centralized Typed Data: CoupleProfile Production Data Validation', () => {
  assert.ok(coupleProfile, 'coupleProfile must be exported');
  assert.strictEqual(coupleProfile.partnerName, 'Dinda', 'Partner name must be Dinda');
  assert.strictEqual(coupleProfile.myName, 'Daffa', 'Author name must be Daffa');
  assert.ok(typeof coupleProfile.anniversaryDate === 'string', 'anniversaryDate must be a string');
  assert.ok(!isNaN(Date.parse(coupleProfile.anniversaryDate)), 'anniversaryDate must be a valid ISO date');
  assert.ok(coupleProfile.tagline.length > 0, 'tagline must not be empty');
  assert.ok(coupleProfile.subtagline.length > 0, 'subtagline must not be empty');
  assert.strictEqual(anniversaryData.profile, coupleProfile, 'anniversaryData.profile must reference coupleProfile');
});

test('Feature 2 - Centralized Typed Data: Milestones Array Production Validation (5 Milestones)', () => {
  assert.ok(Array.isArray(milestones), 'milestones must be an array');
  assert.strictEqual(milestones.length, 5, 'Production dataset must define exactly 5 milestones');

  const validCategories = ['firsts', 'trips', 'memories', 'milestones'];

  for (const m of milestones) {
    assert.ok(typeof m.id === 'string' && m.id.startsWith('milestone-'), `Milestone ID must start with milestone- (got ${m.id})`);
    assert.ok(typeof m.date === 'string' && m.date.length > 0, `Milestone date required for ${m.id}`);
    assert.ok(typeof m.title === 'string' && m.title.length > 0, `Milestone title required for ${m.id}`);
    assert.ok(typeof m.description === 'string' && m.description.length >= 30, `Milestone description must be substantive for ${m.id}`);
    assert.ok(validCategories.includes(m.category), `Category ${m.category} must be one of ${validCategories.join(', ')}`);
    assert.ok(typeof m.image === 'string' && m.image.startsWith('/photos/'), `Image path must point to /photos/ for ${m.id}`);
  }

  assert.strictEqual(anniversaryData.milestones, milestones, 'anniversaryData.milestones must reference milestones array');
});

test('Feature 2 - Centralized Typed Data: Polaroid Photo Array Production Validation (6 Polaroids)', () => {
  assert.ok(Array.isArray(polaroids), 'polaroids must be an array');
  assert.strictEqual(polaroids.length, 6, 'Production dataset must define exactly 6 polaroids');

  const validCategories = ['all', 'dates', 'travel', 'candid', 'favorites'];

  for (const p of polaroids) {
    assert.ok(typeof p.id === 'string' && p.id.startsWith('polaroid-'), `Polaroid ID must start with polaroid- (got ${p.id})`);
    assert.ok(typeof p.url === 'string' && p.url.startsWith('/photos/'), `Polaroid URL must point to /photos/ for ${p.id}`);
    assert.ok(typeof p.thumbnail === 'string' && p.thumbnail.startsWith('/photos/'), `Polaroid thumbnail required for ${p.id}`);
    assert.ok(typeof p.caption === 'string' && p.caption.length > 0, `Polaroid caption required for ${p.id}`);
    assert.ok(typeof p.date === 'string' && p.date.length > 0, `Polaroid date required for ${p.id}`);
    assert.ok(typeof p.location === 'string' && p.location.length > 0, `Polaroid location required for ${p.id}`);
    assert.ok(validCategories.includes(p.category), `Category ${p.category} must be valid`);
    assert.ok(typeof p.rotation === 'number', `Rotation must be numeric for ${p.id}`);
    assert.ok(p.rotation >= -5 && p.rotation <= 5, `Rotation ${p.rotation}deg must be subtle (-5 to 5 deg)`);
    assert.ok(typeof p.note === 'string' && p.note.length > 0, `Handwritten note on back required for ${p.id}`);
  }

  assert.strictEqual(anniversaryData.polaroids, polaroids);
});

test('Feature 2 - Centralized Typed Data: Love Letter Production Contract Validation', () => {
  assert.ok(loveLetter, 'loveLetter must exist');
  assert.ok(typeof loveLetter.title === 'string' && loveLetter.title.length > 0, 'Love letter title must exist');
  assert.ok(typeof loveLetter.salutation === 'string' && loveLetter.salutation.length > 0, 'Salutation required');
  assert.ok(typeof loveLetter.opening === 'string' && loveLetter.opening.length > 0, 'Opening required');
  assert.ok(Array.isArray(loveLetter.paragraphs) && loveLetter.paragraphs.length >= 3, 'Love letter must contain at least 3 heartfelt paragraphs');
  const fullText = loveLetter.paragraphs.join(' ');
  assert.ok(fullText.length >= 300, 'Love letter must contain substantive text (>300 chars)');
  assert.ok(typeof loveLetter.closing === 'string' && loveLetter.closing.length > 0, 'Closing required');
  assert.ok(loveLetter.signature.includes('Daffa'), 'Signature must contain Daffa');
  assert.ok(typeof loveLetter.sealText === 'string' && loveLetter.sealText.length > 0, 'Wax seal monogram required');
  assert.strictEqual(anniversaryData.loveLetter, loveLetter);
});

test('Feature 2 - Centralized Typed Data: Love Reasons Array Production Validation (12 Reasons)', () => {
  assert.ok(Array.isArray(loveReasons), 'loveReasons must be an array');
  assert.strictEqual(loveReasons.length, 12, 'Must contain exactly 12 reasons why I love you');

  const validCategories = ['habits', 'memories', 'quirks', 'feelings'];

  loveReasons.forEach((r, idx) => {
    assert.strictEqual(r.number, idx + 1, `Reason number must be sequential ${idx + 1}`);
    assert.ok(typeof r.text === 'string' && r.text.length > 10, `Reason text must be descriptive: ${r.id}`);
    assert.ok(validCategories.includes(r.category), `Reason category ${r.category} must be valid`);
  });

  assert.strictEqual(anniversaryData.reasons, loveReasons);
});

test('Feature 2 - Centralized Typed Data: Coupons Array Production Validation (8 Coupons)', () => {
  assert.ok(Array.isArray(coupons), 'coupons must be an array');
  assert.strictEqual(coupons.length, 8, 'Must contain exactly 8 romantic vouchers');

  const validCategories = ['treat', 'activity', 'pass'];

  for (const c of coupons) {
    assert.ok(typeof c.id === 'string' && c.id.startsWith('coupon-'), `Coupon ID must start with coupon- (${c.id})`);
    assert.ok(typeof c.title === 'string' && c.title.length > 0);
    assert.ok(typeof c.description === 'string' && c.description.length > 0);
    assert.ok(typeof c.terms === 'string' && c.terms.length > 0);
    assert.ok(typeof c.icon === 'string' && c.icon.length > 0);
    assert.ok(validCategories.includes(c.category), `Category ${c.category} must be valid`);
    assert.ok(c.expires === 'Never' || c.expires === 'Lifetime', 'Coupons should have no expiration (Never or Lifetime)');
  }

  assert.strictEqual(anniversaryData.coupons, coupons);
});

test('Feature 2 - Centralized Typed Data: Bucket List Production Validation (8 Items)', () => {
  assert.ok(Array.isArray(bucketListItems), 'bucketListItems must be an array');
  assert.strictEqual(bucketListItems.length, 8, 'Must contain exactly 8 bucket list items');

  for (const b of bucketListItems) {
    assert.ok(typeof b.id === 'string' && b.id.startsWith('bucket-'), `Bucket ID must start with bucket- (${b.id})`);
    assert.ok(typeof b.text === 'string' && b.text.length > 0);
    assert.strictEqual(typeof b.completed, 'boolean', 'Completed must be a boolean flag');
  }

  assert.strictEqual(anniversaryData.bucketList, bucketListItems);
});

test('Feature 2 - Centralized Typed Data: Music Tracks Production Validation (4 Tracks)', () => {
  assert.ok(Array.isArray(musicTracks), 'musicTracks must be an array');
  assert.strictEqual(musicTracks.length, 4, 'Must contain exactly 4 romantic tracks');

  for (const t of musicTracks) {
    assert.ok(typeof t.id === 'string' && t.id.startsWith('track-'));
    assert.ok(typeof t.title === 'string' && t.title.length > 0);
    assert.ok(typeof t.artist === 'string' && t.artist.length > 0);
    assert.ok(typeof t.src === 'string' && t.src.startsWith('/audio/'));
  }

  assert.strictEqual(anniversaryData.musicTracks, musicTracks);
});

test('Feature 2 - Centralized Typed Data: Gen-Z Copy Guardrails on Real Production Text', () => {
  const bannedPhrases = [
    'cinta matiku selamanya',
    'bucin lebay',
    'kamu tulang rusukku yang hilang',
    'aku tanpamu bagaikan butiran debu',
    'c1nt4 b4n63t',
    'AI Powered',
    'revolutionary',
    'seamless',
    'testament',
    'elevate',
    'delve'
  ];

  // Aggregate all production text across every data entity
  const corpus = [
    coupleProfile.partnerName,
    coupleProfile.myName,
    coupleProfile.tagline,
    coupleProfile.subtagline,
    ...milestones.map(m => `${m.title} ${m.description} ${m.location || ''}`),
    ...polaroids.map(p => `${p.caption} ${p.note || ''} ${p.location}`),
    loveLetter.title || '',
    loveLetter.salutation,
    loveLetter.opening,
    ...loveLetter.paragraphs,
    loveLetter.closing,
    loveLetter.signature,
    ...loveReasons.map(r => r.text),
    ...coupons.map(c => `${c.title} ${c.description} ${c.terms}`),
    ...bucketListItems.map(b => b.text),
    ...musicTracks.map(t => `${t.title} ${t.artist} ${t.notes || ''}`)
  ].join(' ');

  // Ensure no banned buzzwords or cringe clichés
  for (const banned of bannedPhrases) {
    assert.ok(
      !corpus.toLowerCase().includes(banned.toLowerCase()),
      `Production copy must not contain cringe cliché or banned word: "${banned}"`
    );
  }

  // Ensure couple names Daffa & Dinda are actively referenced in copy
  assert.ok(corpus.includes('Dinda'), 'Production copy must mention partner name Dinda');
  assert.ok(corpus.includes('Daffa'), 'Production copy must mention author name Daffa');
});
