/**
 * Lightweight mock environment for running E2E & component tests in Node.js
 */

export class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

export class MockAudio {
  constructor(src = '') {
    this.src = src;
    this.paused = true;
    this.currentTime = 0;
    this.duration = 180;
    this.volume = 1.0;
    this.listeners = {};
    this.shouldFail = false;
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, payload = {}) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(payload));
    }
  }

  async play() {
    if (this.shouldFail) {
      const err = new Error('The play() request was interrupted by new load request or autoplay restrictions.');
      err.name = 'NotAllowedError';
      this.emit('error', err);
      throw err;
    }
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit('pause');
  }
}

export class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }

  createGain() {
    return {
      gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {}
    };
  }

  async resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  async close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

export function setupTestEnvironment() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
  if (!globalThis.localStorage) {
    globalThis.localStorage = new MockLocalStorage();
  }
  if (!globalThis.Audio) {
    globalThis.Audio = MockAudio;
  }
  if (!globalThis.AudioContext) {
    globalThis.AudioContext = MockAudioContext;
  }
  return {
    localStorage: globalThis.localStorage,
    Audio: globalThis.Audio,
    AudioContext: globalThis.AudioContext
  };
}
