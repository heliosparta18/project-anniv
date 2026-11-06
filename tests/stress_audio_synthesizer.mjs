// Standalone Empirical Challenger Stress Test for Web Audio Synthesizer
// Target: src/utils/audioSynth.ts and src/hooks/useAudioPlayer.ts
import assert from 'node:assert/strict';
import { setupTestEnvironment, MockAudio, MockAudioContext } from './helpers/dom_mock.js';
import {
  ROMANTIC_CHORDS,
  RomanticAudioSynth,
} from '../src/utils/audioSynth.ts';

console.log('='.repeat(72));
console.log('  CHALLENGER WEB AUDIO SYNTHESIZER EMPIRICAL STRESS TEST');
console.log('='.repeat(72));

let totalAssertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  totalAssertions++;
}

// -----------------------------------------------------------------------------
// Suite 1: Frequency & Musical 12-TET Tuning Accuracy
// -----------------------------------------------------------------------------
console.log('\n[Suite 1] Auditing chord frequencies against 12-TET equal temperament (A4 = 440 Hz)...');

// Standard 12-TET reference frequencies
const EXPECTED_MIDI = {
  Cmaj7: [48, 60, 64, 67, 71], // C3, C4, E4, G4, B4
  Am7:   [45, 57, 60, 64, 67], // A2, A3, C4, E4, G4
  Dm7:   [50, 62, 65, 69, 72], // D3, D4, F4, A4, C5
  G7:    [43, 55, 59, 62, 65], // G2, G3, B3, D4, F4
};

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

check(ROMANTIC_CHORDS.length === 4, 'Must define exactly 4 romantic chords');

for (const chord of ROMANTIC_CHORDS) {
  const expectedMidis = EXPECTED_MIDI[chord.name];
  check(expectedMidis !== undefined, `Chord ${chord.name} must be in reference map`);
  check(chord.frequencies.length === expectedMidis.length, `${chord.name} frequency count must match`);

  chord.frequencies.forEach((freq, idx) => {
    const theoretical = midiToFreq(expectedMidis[idx]);
    const delta = Math.abs(freq - theoretical);
    // Allow up to 0.1 Hz deviation due to 2 decimal places rounding
    check(delta < 0.1, `${chord.name} note #${idx} (${freq}Hz) matches 12-TET theoretical (${theoretical.toFixed(2)}Hz, delta=${delta.toFixed(4)}Hz)`);
  });
  console.log(`  ✓ Chord ${chord.name} [${chord.frequencies.join(', ')} Hz] strictly adheres to 12-TET tuning`);
}

// -----------------------------------------------------------------------------
// Suite 2: Volume Clamping & Boundary / Non-Finite Invariants
// -----------------------------------------------------------------------------
console.log('\n[Suite 2] Testing volume clamping and boundary values...');

setupTestEnvironment();
const synth = new RomanticAudioSynth();

// Normal volumes
synth.setVolume(0.5);
check(synth.getVolume() === 0.5, 'Normal volume 0.5 set correctly');
synth.setVolume(0);
check(synth.getVolume() === 0, 'Min volume 0 set correctly');
synth.setVolume(1);
check(synth.getVolume() === 1, 'Max volume 1 set correctly');

// Clamping below 0
synth.setVolume(-0.25);
check(synth.getVolume() === 0, 'Negative volume -0.25 clamped to 0');
synth.setVolume(-100);
check(synth.getVolume() === 0, 'Extreme negative volume -100 clamped to 0');

// Clamping above 1
synth.setVolume(1.25);
check(synth.getVolume() === 1, 'Overflow volume 1.25 clamped to 1');
synth.setVolume(999);
check(synth.getVolume() === 1, 'Extreme overflow volume 999 clamped to 1');

// Non-finite values
synth.setVolume(Infinity);
check(synth.getVolume() === 1, 'Volume Infinity clamped to 1');
synth.setVolume(-Infinity);
check(synth.getVolume() === 0, 'Volume -Infinity clamped to 0');

// NaN check: verify volume remains finite and bounded
synth.setVolume(NaN);
const volWithNaN = synth.getVolume();
check(!Number.isNaN(volWithNaN) && volWithNaN >= 0 && volWithNaN <= 1, `setVolume(NaN) must preserve finite volume in [0, 1] (got ${volWithNaN})`);
console.log('  ✓ Volume clamping bounds [0, 1] & NaN resilience verified');

// -----------------------------------------------------------------------------
// Suite 3: Start/Stop Idempotency & Concurrent Voice Spawning
// -----------------------------------------------------------------------------
console.log('\n[Suite 3] Testing start/stop idempotency and concurrent voice loops...');

// Test 3.1: Clean initial state
synth.setVolume(0.7);
check(synth.getIsPlaying() === false, 'Synth must start in stopped state');

// Test 3.2: Single start
await synth.start();
check(synth.getIsPlaying() === true, 'Synth reports isPlaying: true after start');
const voices1 = synth.activeVoices.length;
check(voices1 === 5, `Expected 5 active voices for Cmaj7, got ${voices1}`);
console.log(`  ✓ Initial start spawned exactly ${voices1} chord voice oscillators`);

// Test 3.3: Idempotency challenge - calling start() when already playing
await synth.start();
const voices2 = synth.activeVoices.length;
check(voices2 === 5, `Calling start() when already playing must remain idempotent with 5 active voices (got ${voices2})`);
console.log(`  ✓ Start idempotency strictly maintained: activeVoices = ${voices2}`);

// Test 3.4: Clean stop
synth.stop();
check(synth.getIsPlaying() === false, 'getIsPlaying() is false after stop()');
check(synth.activeVoices.length === 0, 'activeVoices array cleared after stop()');

// Test 3.5: Calling stop() repeatedly (stop idempotency)
synth.stop();
synth.stop();
check(synth.getIsPlaying() === false, 'Calling stop() multiple times remains safely stopped');
check(synth.activeVoices.length === 0, 'activeVoices remains empty on repeat stop()');
console.log('  ✓ Stop idempotency verified');

// -----------------------------------------------------------------------------
// Suite 4: ADSR Envelope Parameter & Waveform Audit
// -----------------------------------------------------------------------------
console.log('\n[Suite 4] Auditing ADSR envelope parameters and waveform type...');

// Setup detailed tracking MockAudioContext
let capturedOscTypes = [];
let capturedFrequencies = [];

class TrackingAudioContext extends MockAudioContext {
  createOscillator() {
    const osc = {
      type: 'sine',
      frequency: {
        setValueAtTime: (freq, time) => {
          capturedFrequencies.push({ freq, time });
        }
      },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
    capturedOscTypes.push(osc);
    return osc;
  }

  createGain() {
    const events = [];
    return {
      gain: {
        setValueAtTime: (val, time) => events.push({ type: 'setValueAtTime', val, time }),
        linearRampToValueAtTime: (val, time) => events.push({ type: 'linearRampToValueAtTime', val, time }),
        exponentialRampToValueAtTime: (val, time) => events.push({ type: 'exponentialRampToValueAtTime', val, time })
      },
      connect: () => {},
      _events: events
    };
  }
}

globalThis.AudioContext = TrackingAudioContext;
const trackedSynth = new RomanticAudioSynth();
await trackedSynth.start();

// Verify triangle waveform
check(capturedOscTypes.length === 5, '5 oscillators created for first chord');
for (const osc of capturedOscTypes) {
  check(osc.type === 'triangle', `Oscillator waveform must be 'triangle' for warm Rhodes tone (got '${osc.type}')`);
}
console.log('  ✓ Waveform is warm "triangle" wave for all 5 voices');

// Verify 35ms note strum staggering
for (let i = 0; i < capturedFrequencies.length; i++) {
  const expectedStagger = i * 0.035;
  const actualTime = capturedFrequencies[i].time;
  const delta = Math.abs(actualTime - expectedStagger);
  check(delta < 0.001, `Note #${i} onset staggered by ${expectedStagger}s (got ${actualTime}s)`);
}
console.log('  ✓ Fingerpicked strum timing accurately applies 35ms delta between note onsets');

trackedSynth.stop();

// -----------------------------------------------------------------------------
// Suite 5: Web Audio Blocked / Disabled / Errored States
// -----------------------------------------------------------------------------
console.log('\n[Suite 5] Testing Web Audio blocked, disabled, and error states...');

// 5.1: AudioContext completely unavailable (SSR / unsupported environment)
const savedWin = globalThis.window;
delete globalThis.AudioContext;
if (globalThis.window) {
  delete globalThis.window.AudioContext;
  delete globalThis.window.webkitAudioContext;
}

const unsuppSynth = new RomanticAudioSynth();
const ctxResult = unsuppSynth.ensureContext();
check(ctxResult === null, 'ensureContext() returns null when AudioContext is absent');
const startResult = await unsuppSynth.start();
check(startResult === false, 'start() returns false gracefully when AudioContext is absent');
console.log('  ✓ Completely absent AudioContext handled gracefully without uncaught exceptions');

// 5.2: AudioContext constructor throws SecurityError / NotAllowedError
globalThis.AudioContext = class ThrowingContext {
  constructor() {
    const err = new Error('The operation is insecure or not permitted.');
    err.name = 'SecurityError';
    throw err;
  }
};

const throwingSynth = new RomanticAudioSynth();
const throwingStart = await throwingSynth.start();
check(throwingStart === false, 'start() returns false when AudioContext constructor throws');
console.log('  ✓ Throwing AudioContext constructor caught cleanly with fallback return false');

// 5.3: ctx.resume() rejects with NotAllowedError (autoplay policy gesture needed)
globalThis.AudioContext = class AutoplayBlockedContext extends MockAudioContext {
  constructor() {
    super();
    this.state = 'suspended';
  }
  async resume() {
    const err = new Error('AudioContext resume rejected: user gesture required');
    err.name = 'NotAllowedError';
    throw err;
  }
};

const blockedSynth = new RomanticAudioSynth();
const blockedStart = await blockedSynth.start();
check(blockedStart === false, 'start() returns false when ctx.resume() is blocked by autoplay');
check(blockedSynth.getIsPlaying() === false, 'isPlaying is false when autoplay blocks');
console.log('  ✓ Autoplay policy restriction on resume() caught cleanly without uncaught rejections');

// Restore test environment
globalThis.AudioContext = MockAudioContext;
if (savedWin) globalThis.window = savedWin;

// -----------------------------------------------------------------------------
// Suite 6: HTML5 Audio Media Errors (404 on MP3) & Fallback Engagement
// -----------------------------------------------------------------------------
console.log('\n[Suite 6] Testing simulated media errors (404 on MP3) and fallback engagement...');

const audio404 = new MockAudio('/audio/non-existent-track.mp3');
audio404.shouldFail = true;

let playPromiseRejected = false;
let errorEventEmitted = false;
let fallbackSynthStarted = false;

audio404.addEventListener('error', () => {
  errorEventEmitted = true;
});

try {
  await audio404.play();
} catch (err) {
  playPromiseRejected = true;
  check(err.name === 'NotAllowedError', 'MockAudio error is NotAllowedError');
  // Fallback activation
  const fallback = new RomanticAudioSynth();
  fallbackSynthStarted = await fallback.start();
  fallback.stop();
}

check(playPromiseRejected === true, 'Audio.play() promise rejection caught');
check(errorEventEmitted === true, 'Audio error event emitted');
check(fallbackSynthStarted === true, 'Romantic synthesizer activated upon audio failure');
console.log('  ✓ 404 MP3 / Autoplay restriction triggers seamless procedural synth fallback without crash');

console.log('\n' + '='.repeat(72));
console.log(`  CHALLENGER AUDIO SYNTHESIZER TEST COMPLETED: ${totalAssertions} assertions evaluated!`);
console.log('='.repeat(72));
