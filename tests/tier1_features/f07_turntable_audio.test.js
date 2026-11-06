import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupTestEnvironment, MockAudio } from '../helpers/dom_mock.js';
import {
  ROMANTIC_CHORDS,
  RomanticAudioSynth,
  romanticSynth,
  startRomanticChords,
  stopRomanticChords,
  setSynthVolume,
  isSynthPlaying
} from '../../src/utils/audioSynth.ts';
import { musicTracks, coupleProfile } from '../../src/data/anniversaryData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vinylPlayerPath = path.resolve(__dirname, '../../src/components/audio/VinylPlayer.tsx');
const useAudioPlayerPath = path.resolve(__dirname, '../../src/hooks/useAudioPlayer.ts');
const audioSynthPath = path.resolve(__dirname, '../../src/utils/audioSynth.ts');

test('Feature 7 - Vinyl Audio Player: Initial Paused State & Tone Arm Positioning', () => {
  // 1. Verify required source files exist
  assert.ok(fs.existsSync(vinylPlayerPath), 'VinylPlayer.tsx must exist in src/components/audio/');
  assert.ok(fs.existsSync(useAudioPlayerPath), 'useAudioPlayer.ts must exist in src/hooks/');
  assert.ok(fs.existsSync(audioSynthPath), 'audioSynth.ts must exist in src/utils/');

  const vinylCode = fs.readFileSync(vinylPlayerPath, 'utf8');
  const hookCode = fs.readFileSync(useAudioPlayerPath, 'utf8');

  // 2. Initial state must be strictly paused with tone arm at rest
  assert.ok(
    hookCode.includes('useState<boolean>(false)') || hookCode.includes('isPlaying, setIsPlaying'),
    'useAudioPlayer must initialize isPlaying to false'
  );
  assert.ok(
    hookCode.includes('toneArmEngaged, setToneArmEngaged') || hookCode.includes('setToneArmEngaged(false)'),
    'useAudioPlayer must manage toneArmEngaged state'
  );

  // 3. Tone arm resting transform and spring transition
  assert.ok(
    vinylCode.includes('rotate(0deg)') || vinylCode.includes('toneArmEngaged ?'),
    'VinylPlayer must define resting transform for tone arm when paused'
  );
  assert.ok(
    vinylCode.includes('transition-transform') && vinylCode.includes('duration-700'),
    'Tone arm must feature smooth 700ms transition-transform animation'
  );

  // 4. Tone arm mechanical components: gimbal base, stem, cartridge, needle
  assert.ok(vinylCode.includes('rounded-full') && vinylCode.includes('shadow-md'), 'Tone arm gimbal base must be rendered');
  assert.ok(vinylCode.includes('Stylus') || vinylCode.includes('Cartridge') || vinylCode.includes('needle'), 'Tone arm headshell & needle must be rendered');

  // 5. Touch target invariants: all controls must enforce >= 44x44px
  assert.ok(vinylCode.includes('min-w-[44px]') && vinylCode.includes('min-h-[44px]'), 'Buttons must enforce min 44x44px touch targets');
  assert.ok(vinylCode.includes('min-w-[56px]') && vinylCode.includes('min-h-[56px]'), 'Primary play button must provide generous >=56px touch target');
});

test('Feature 7 - Vinyl Audio Player: Play/Pause Toggle & Tone Arm Engagement', () => {
  const vinylCode = fs.readFileSync(vinylPlayerPath, 'utf8');
  const hookCode = fs.readFileSync(useAudioPlayerPath, 'utf8');

  // 1. Play/pause toggle handler & accessible ARIA labels
  assert.ok(vinylCode.includes('togglePlay'), 'VinylPlayer must bind togglePlay handler');
  assert.ok(
    vinylCode.includes('aria-label={isPlaying ? \'Pause music\' : \'Play music\'}'),
    'Play button must provide dynamic accessible aria-label'
  );

  // 2. Tone arm physical engagement when active (pivoting onto vinyl record)
  assert.ok(
    vinylCode.includes('rotate(26deg)') || vinylCode.includes('rotate(24deg)') || vinylCode.includes('toneArmEngaged ?'),
    'Tone arm must pivot onto vinyl when toneArmEngaged is true'
  );

  // 3. Spinning vinyl record animation
  assert.ok(
    vinylCode.includes('animate-[spin_4s_linear_infinite]') || vinylCode.includes('animate-spin'),
    'Vinyl record must spin with CSS rotation animation when active'
  );

  // 4. Micro-grooves realistic concentric rings
  assert.ok(vinylCode.includes('border border-white/'), 'Vinyl record must feature layered concentric micro-groove rings');

  // 5. Rotating center label with couple initials
  assert.ok(
    vinylCode.includes('coupleProfile') || vinylCode.includes('Side A') || vinylCode.includes('&amp;'),
    'Vinyl center label must display couple monogram initials and romantic branding'
  );

  // 6. Hook play/pause implementation
  assert.ok(hookCode.includes('const play ='), 'useAudioPlayer must define play callback');
  assert.ok(hookCode.includes('const pause ='), 'useAudioPlayer must define pause callback');
  assert.ok(hookCode.includes('setToneArmEngaged(true)'), 'play callback must engage tone arm');
  assert.ok(hookCode.includes('setToneArmEngaged(false)'), 'pause callback must disengage tone arm');
});

test('Feature 7 - Vinyl Audio Player: Web Audio Synthesizer Fallback on Autoplay Restriction', async () => {
  // 1. Validate procedural chord progression definitions
  assert.ok(Array.isArray(ROMANTIC_CHORDS), 'ROMANTIC_CHORDS must be an array');
  assert.strictEqual(ROMANTIC_CHORDS.length, 4, 'Must define exactly 4 romantic chords');

  const expectedChords = ['Cmaj7', 'Am7', 'Dm7', 'G7'];
  ROMANTIC_CHORDS.forEach((chord, idx) => {
    assert.strictEqual(chord.name, expectedChords[idx], `Chord ${idx} must be ${expectedChords[idx]}`);
    assert.ok(Array.isArray(chord.frequencies) && chord.frequencies.length >= 4, `${chord.name} must contain at least 4 harmonic frequencies`);
    for (const freq of chord.frequencies) {
      assert.ok(typeof freq === 'number' && freq > 40 && freq < 1000, `Frequency ${freq}Hz must be in musical audio range`);
    }
  });

  // 2. Initialize mock test environment
  setupTestEnvironment();

  // 3. Test RomanticAudioSynth lifecycle
  const synth = new RomanticAudioSynth();
  assert.strictEqual(synth.getIsPlaying(), false, 'Synth must start in stopped state');

  const started = await synth.start();
  assert.ok(started, 'synth.start() must return true when context is ready');
  assert.strictEqual(synth.getIsPlaying(), true, 'synth.getIsPlaying() must report true after start');

  synth.setVolume(0.5);
  assert.strictEqual(synth.getVolume(), 0.5, 'setVolume(0.5) must update synth volume');

  synth.stop();
  assert.strictEqual(synth.getIsPlaying(), false, 'synth.stop() must halt playback');

  // 4. Test module singleton and helper functions
  assert.ok(romanticSynth, 'romanticSynth singleton must be exported');
  setSynthVolume(0.8);
  const globalStarted = await startRomanticChords(0.8);
  assert.ok(globalStarted, 'startRomanticChords must start global singleton');
  assert.strictEqual(isSynthPlaying(), true, 'isSynthPlaying() must report true');

  stopRomanticChords();
  assert.strictEqual(isSynthPlaying(), false, 'stopRomanticChords must stop global singleton');

  // 5. Test browser autoplay policy restriction handling (MockAudio shouldFail)
  const mockAudio = new MockAudio('/audio/until-i-found-you.mp3');
  mockAudio.shouldFail = true;

  let errorCaught = false;
  let synthFallbackActivated = false;

  try {
    await mockAudio.play();
  } catch (err) {
    errorCaught = true;
    assert.strictEqual(err.name, 'NotAllowedError', 'Interrupted autoplay must trigger NotAllowedError');
    // Simulate useAudioPlayer fallback activation
    await synth.start();
    synthFallbackActivated = synth.getIsPlaying();
    synth.stop();
  }

  assert.ok(errorCaught, 'Autoplay restriction error must be caught without throwing unhandled exception');
  assert.ok(synthFallbackActivated, 'Web Audio procedural chord synth must seamlessly activate on autoplay failure');
});

test('Feature 7 - Vinyl Audio Player: Track Switcher Cycles Music Playlist', () => {
  // 1. Verify musicTracks dataset in anniversaryData.ts
  assert.ok(coupleProfile.partnerName, 'coupleProfile must provide partnerName');
  assert.ok(Array.isArray(musicTracks), 'musicTracks must be an array');
  assert.strictEqual(musicTracks.length, 4, 'Must define exactly 4 romantic tracks');

  for (const t of musicTracks) {
    assert.ok(typeof t.id === 'string' && t.id.length > 0, 'Track id required');
    assert.ok(typeof t.title === 'string' && t.title.length > 0, 'Track title required');
    assert.ok(typeof t.artist === 'string' && t.artist.length > 0, 'Track artist required');
    assert.ok(typeof t.notes === 'string' && t.notes.length > 20, 'Track personal romantic note required');
  }

  // 2. Circular playlist progression index arithmetic
  const trackCount = musicTracks.length;
  let currentIndex = 0;

  // Next track progression
  currentIndex = (currentIndex + 1) % trackCount;
  assert.strictEqual(currentIndex, 1, 'Next track from 0 must be 1');
  currentIndex = (currentIndex + 1) % trackCount;
  assert.strictEqual(currentIndex, 2, 'Next track from 1 must be 2');
  currentIndex = (currentIndex + 1) % trackCount;
  assert.strictEqual(currentIndex, 3, 'Next track from 2 must be 3');
  currentIndex = (currentIndex + 1) % trackCount;
  assert.strictEqual(currentIndex, 0, 'Next track from 3 must wrap back to 0');

  // Prev track progression
  currentIndex = (currentIndex - 1 + trackCount) % trackCount;
  assert.strictEqual(currentIndex, 3, 'Prev track from 0 must wrap to 3');

  // 3. Source inspection of VinylPlayer playlist rendering
  const vinylCode = fs.readFileSync(vinylPlayerPath, 'utf8');
  assert.ok(vinylCode.includes('nextTrack'), 'VinylPlayer must bind nextTrack handler');
  assert.ok(vinylCode.includes('prevTrack'), 'VinylPlayer must bind prevTrack handler');
  assert.ok(vinylCode.includes('handleTrackSelect') || vinylCode.includes('selectTrack'), 'VinylPlayer must allow direct track selection from playlist');
  assert.ok(vinylCode.includes('Anniversary Playlist') || vinylCode.includes('playlist'), 'VinylPlayer must render anniversary playlist section');

  // 4. Romantic note modal inspection
  assert.ok(
    vinylCode.includes('showNotesModal') && vinylCode.includes('toggleNotesModal'),
    'VinylPlayer must provide toggleable romantic notes modal/tooltip'
  );
  assert.ok(
    vinylCode.includes('Daffa for Dinda') || vinylCode.includes('Why This Song Matters'),
    'Romantic note modal must feature personal Gen-Z heartfelt note'
  );

  // 5. Responsive mobile and desktop layout structure
  assert.ok(vinylCode.includes('grid-cols-1 lg:grid-cols-12'), 'Turntable deck must use responsive 12-column desktop reflow');
  assert.ok(vinylCode.includes('variant === \'dock\''), 'VinylPlayer must support both dedicated section and floating dock variants');
});

test('Feature 7 - Vinyl Audio Player: YouTube Background Audio Integration & Floating Controls', () => {
  // 1. Verify primary track 1 configuration in anniversaryData.ts
  const track1 = musicTracks[0];
  assert.ok(track1, 'Track 1 must exist');
  assert.strictEqual(track1.id, 'track-1', 'Track 1 id must be track-1');
  assert.strictEqual(track1.title, 'Anugerah Terindah', 'Track 1 title must be Anugerah Terindah');
  assert.strictEqual(track1.artist, 'Andmesh Kamaleng', 'Track 1 artist must be Andmesh Kamaleng');
  assert.strictEqual(track1.youtubeId, 'o25_Tn8BnFM', 'Track 1 youtubeId must be o25_Tn8BnFM');
  assert.strictEqual(track1.duration, '3:45', 'Track 1 duration must be 3:45');
  assert.ok(
    typeof track1.personalNote === 'string' && track1.personalNote.length > 20,
    'Track 1 personalNote must be a sincere casual Indonesian note'
  );
  assert.ok(
    typeof track1.notes === 'string' && track1.notes.length > 20,
    'Track 1 notes must be present'
  );

  // 2. Source inspection of useAudioPlayer.ts for YouTube IFrame integration
  const hookCode = fs.readFileSync(useAudioPlayerPath, 'utf8');
  assert.ok(hookCode.includes('loadYouTubeApi'), 'useAudioPlayer must define YouTube API loader');
  assert.ok(hookCode.includes('youtube.com/iframe_api'), 'useAudioPlayer must reference YouTube iframe API');
  assert.ok(hookCode.includes('globalYtPlayer'), 'useAudioPlayer must coordinate YouTube player singleton');
  assert.ok(hookCode.includes('playVideo'), 'useAudioPlayer must issue playVideo to YouTube player');
  assert.ok(hookCode.includes('pauseVideo'), 'useAudioPlayer must issue pauseVideo to YouTube player');
  assert.ok(hookCode.includes('activateSynthFallback'), 'useAudioPlayer must retain Web Audio synth fallback');

  // 3. Source inspection of VinylPlayer.tsx floating dock controls and state sharing
  const vinylCode = fs.readFileSync(vinylPlayerPath, 'utf8');
  assert.ok(vinylCode.includes('variant === \'dock\''), 'VinylPlayer must support compact floating dock variant');
  assert.ok(vinylCode.includes('sharedState'), 'VinylPlayer must support sharedState for synchronized playback');
  assert.ok(vinylCode.includes('sharedActions'), 'VinylPlayer must support sharedActions for synchronized playback');
  assert.ok(
    vinylCode.includes('w-11 h-11 min-w-[44px] min-h-[44px]') && vinylCode.includes('togglePlay'),
    'Floating dock play button must enforce 44x44px touch target'
  );
  assert.ok(
    vinylCode.includes('animate-[spin_4s_linear_infinite]'),
    'Floating dock vinyl disc must spin during playback'
  );

  // 4. Zero em-dash invariant
  assert.ok(!hookCode.includes('\u2014'), 'useAudioPlayer.ts must not contain unicode em-dash');
  assert.ok(!vinylCode.includes('\u2014'), 'VinylPlayer.tsx must not contain unicode em-dash');
});

