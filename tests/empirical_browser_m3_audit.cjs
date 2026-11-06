/**
 * Empirical Browser M3 Audit Harness (Headless Edge via CDP)
 * Verifies real DOM interactions, 3D CSS rendering, touch targets, and scroll lock lifecycle.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST_DIR = 'D:\\anniv\\dist';
const PORT = 4174; // separate port
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\156.0.4314.58\\msedge.exe';
const CDP_PORT = 9223;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg'
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexPath = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[HTTP] Static server listening at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function launchEdge() {
  console.log(`[EDGE] Launching Edge headless from ${EDGE_PATH}...`);
  return spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    'about:blank'
  ], { stdio: 'ignore' });
}

async function waitForCdp(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://localhost:${CDP_PORT}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const pageTarget = list.find((t) => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          return pageTarget.webSocketDebuggerUrl;
        }
      }
    } catch {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Failed to connect to CDP endpoint after retries');
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { res, rej } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }
}

async function main() {
  console.log('='.repeat(78));
  console.log('  EMPIRICAL BROWSER M3 AUDIT (Headless Chromium/Edge via CDP)');
  console.log('='.repeat(78));

  const server = await startStaticServer();
  const edgeProc = launchEdge();

  let cdp;
  try {
    const wsUrl = await waitForCdp();
    console.log(`[CDP] Connected to debugger at ${wsUrl}`);
    cdp = new CdpClient(wsUrl);
    await cdp.connect();

    // Enable Runtime & Page domains
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Emulate standard mobile viewport (375x812 iPhone)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log(`[CDP] Navigating to http://localhost:${PORT}/...`);
    await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/` });
    await new Promise((r) => setTimeout(r, 1500));

    // =========================================================================
    // 1. POLAROID CARD FLIP IN REAL BROWSER DOM
    // =========================================================================
    console.log('\n[1] Testing Polaroid Card Flip in Live DOM...');

    // Locate first polaroid card
    const hasGallery = await cdp.eval(`Boolean(document.getElementById('gallery'))`);
    console.log(`  - Gallery element present: ${hasGallery}`);

    // Click flip button on first card
    const flipFrontResult = await cdp.eval(`(() => {
      const btn = document.querySelector('button[aria-label="Flip card to read handwritten note on back"]');
      if (!btn) return { error: 'No flip front button found' };
      btn.click();
      return { success: true };
    })()`);
    console.log(`  - Triggered flip to note:`, flipFrontResult);
    await new Promise((r) => setTimeout(r, 300));

    // Verify card is now flipped
    const isFlippedNow = await cdp.eval(`(() => {
      const flippedEl = document.querySelector('[class*="rotateY(180deg)"]');
      const backBtn = document.querySelector('button[aria-label="Flip card back to photo"]');
      const noteEl = document.querySelector('.font-handwriting');
      return {
        hasTransform: Boolean(flippedEl),
        hasBackBtn: Boolean(backBtn),
        hasHandwriting: Boolean(noteEl)
      };
    })()`);
    console.log(`  - Flipped state verification:`, isFlippedNow);

    // Click flip back button
    const flipBackResult = await cdp.eval(`(() => {
      const btn = document.querySelector('button[aria-label="Flip card back to photo"]');
      if (!btn) return { error: 'No flip back button found' };
      btn.click();
      return { success: true };
    })()`);
    console.log(`  - Triggered flip back:`, flipBackResult);
    await new Promise((r) => setTimeout(r, 300));

    // Rapid flip toggling (50 cycles in real browser DOM)
    console.log('  - Executing 50 rapid flip toggles in browser DOM...');
    const rapidFlipResult = await cdp.eval(`(() => {
      for (let i = 0; i < 50; i++) {
        const front = document.querySelector('button[aria-label="Flip card to read handwritten note on back"]');
        const back = document.querySelector('button[aria-label="Flip card back to photo"]');
        if (i % 2 === 0 && front) front.click();
        else if (back) back.click();
      }
      return {
        frontVisible: Boolean(document.querySelector('button[aria-label="Flip card to read handwritten note on back"]')),
        bodyOverflow: document.body.style.overflow
      };
    })()`);
    console.log(`  - Rapid flip result (50 toggles):`, rapidFlipResult);

    // =========================================================================
    // 2. LIGHTBOX MODAL & BODY SCROLL-LOCK INVARIANCE
    // =========================================================================
    console.log('\n[2] Testing Lightbox Modal & Body Scroll Lock Invariance...');

    // Baseline overflow before opening
    const initialOverflow = await cdp.eval(`document.body.style.overflow`);
    console.log(`  - Initial document.body.style.overflow: "${initialOverflow}"`);

    // Click expand button on first polaroid card
    const openModalResult = await cdp.eval(`(() => {
      const expandBtn = document.querySelector('button[aria-label*="View fullscreen"]');
      if (!expandBtn) return { error: 'Expand button not found' };
      expandBtn.click();
      return { success: true };
    })()`);
    console.log(`  - Clicked expand button:`, openModalResult);
    await new Promise((r) => setTimeout(r, 400));

    // Verify modal dialog mounted and body scroll locked
    const modalOpenState = await cdp.eval(`(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      return {
        isMounted: Boolean(dialog),
        bodyOverflow: document.body.style.overflow,
        dialogLabel: dialog ? dialog.getAttribute('aria-label') : null
      };
    })()`);
    console.log(`  - Modal open state:`, modalOpenState);

    // Test Keyboard Navigation: ArrowRight
    console.log('  - Dispatching ArrowRight key event...');
    const arrowRightResult = await cdp.eval(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const badge = document.querySelector('[role="dialog"] span');
      return { text: badge ? badge.textContent : null };
    })()`);
    console.log(`  - ArrowRight navigation result:`, arrowRightResult);

    // Test Keyboard Navigation: ArrowLeft wraparound
    console.log('  - Dispatching ArrowLeft key events (wraparound to last photo)...');
    const arrowLeftResult = await cdp.eval(`(() => {
      // Dispatch 2 ArrowLeft to wrap around
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      const badge = document.querySelector('[role="dialog"] span');
      return { text: badge ? badge.textContent : null };
    })()`);
    console.log(`  - ArrowLeft wraparound result:`, arrowLeftResult);

    // Test Keyboard Escape Key Dismissal
    console.log('  - Dispatching Escape key event...');
    await cdp.eval(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await new Promise((r) => setTimeout(r, 300));

    const postEscapeState = await cdp.eval(`(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      return {
        isMounted: Boolean(dialog),
        bodyOverflow: document.body.style.overflow
      };
    })()`);
    console.log(`  - Post-Escape state (modal dismissed & overflow restored):`, postEscapeState);

    // RAPID MODAL LIFECYCLE TEST: 50 open/close cycles in real browser DOM
    console.log('\n  - Executing 50 rapid Lightbox Modal open/close lifecycle cycles in live DOM...');
    const rapidLifecycleResult = await cdp.eval(`(async () => {
      let openPassCount = 0;
      let closePassCount = 0;
      for (let i = 0; i < 50; i++) {
        // Open
        const expandBtn = document.querySelector('button[aria-label*="View fullscreen"]');
        if (expandBtn) expandBtn.click();
        await new Promise(r => setTimeout(r, 20));
        if (document.body.style.overflow === 'hidden') openPassCount++;

        // Close via close button or Escape
        const closeBtn = document.querySelector('button[aria-label="Close photo preview"]');
        if (closeBtn) closeBtn.click();
        else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 20));
        if (document.body.style.overflow === '') closePassCount++;
      }
      return {
        cyclesCompleted: 50,
        openPassCount,
        closePassCount,
        finalBodyOverflow: document.body.style.overflow
      };
    })()`);
    console.log(`  - 50 Rapid Modal Lifecycle Result:`, rapidLifecycleResult);

    // =========================================================================
    // 3. TOUCH TARGET DIMENSIONS MEASURED IN REAL BROWSER PIXELS
    // =========================================================================
    console.log('\n[3] Measuring Rendered Bounding Boxes (WCAG 2.5.5 >= 44x44px in real CSS pixels)...');

    // Open modal again to measure modal controls
    await cdp.eval(`document.querySelector('button[aria-label*="View fullscreen"]').click()`);
    await new Promise((r) => setTimeout(r, 300));

    const touchMeasurements = await cdp.eval(`(() => {
      const results = [];
      function measure(sel, name) {
        const els = document.querySelectorAll(sel);
        els.forEach((el, idx) => {
          const rect = el.getBoundingClientRect();
          const w = Math.round(rect.width * 10) / 10;
          const h = Math.round(rect.height * 10) / 10;
          results.push({
            name: els.length > 1 ? \`\${name} #\${idx + 1}\` : name,
            selector: sel,
            width: w,
            height: h,
            meets44x44: w >= 44 && h >= 44
          });
        });
      }

      measure('button[aria-label="Close photo preview"]', 'Modal Close Button');
      measure('button[aria-label="Previous photo"]', 'Modal Floating Prev Button');
      measure('button[aria-label="Next photo"]', 'Modal Floating Next Button');
      measure('button[aria-label="Previous photo button"]', 'Modal Footer Prev Button');
      measure('button[aria-label="Next photo button"]', 'Modal Footer Next Button');

      return results;
    })()`);

    // Close modal to measure card buttons
    await cdp.eval(`document.querySelector('button[aria-label="Close photo preview"]').click()`);
    await new Promise((r) => setTimeout(r, 300));

    const cardMeasurements = await cdp.eval(`(() => {
      const results = [];
      function measure(sel, name) {
        const els = document.querySelectorAll(sel);
        els.forEach((el, idx) => {
          const rect = el.getBoundingClientRect();
          const w = Math.round(rect.width * 10) / 10;
          const h = Math.round(rect.height * 10) / 10;
          results.push({
            name: els.length > 1 ? \`\${name} #\${idx + 1}\` : name,
            selector: sel,
            width: w,
            height: h,
            meets44x44: w >= 44 && h >= 44
          });
        });
      }

      measure('button[aria-label*="View fullscreen"]', 'Polaroid Card Expand Button');
      measure('button[aria-label="Flip card to read handwritten note on back"]', 'Polaroid Flip Front Button');
      measure('#gallery button[role="tab"]', 'Gallery Category Tab');

      return results;
    })()`);

    const allMeasurements = [...touchMeasurements, ...cardMeasurements];
    console.table(allMeasurements);

    const allPassed = allMeasurements.every((m) => m.meets44x44);
    console.log(`\n  All measured touch targets meet or exceed 44x44px: ${allPassed}`);

    // Output JSON result file for record
    fs.writeFileSync(
      'D:\\anniv\\tests\\empirical_browser_m3_results.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        rapidFlipResult,
        rapidLifecycleResult,
        allMeasurements,
        allPassed
      }, null, 2)
    );

  } finally {
    if (cdp && cdp.ws) {
      cdp.ws.close();
    }
    edgeProc.kill('SIGKILL');
    server.close();
  }
}

main().catch((err) => {
  console.error('Fatal error in empirical browser audit:', err);
  process.exit(1);
});
