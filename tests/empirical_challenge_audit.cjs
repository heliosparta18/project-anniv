const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST_DIR = 'D:\\anniv\\dist';
const PORT = 4173;
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\156.0.4314.58\\msedge.exe';
const CDP_PORT = 9222;

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

async function waitForCdp(maxRetries = 25) {
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
    this.eventListeners = new Map();
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
        } else if (data.method) {
          const listeners = this.eventListeners.get(data.method) || [];
          listeners.forEach((cb) => cb(data.params));
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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  const server = await startStaticServer();
  const edgeProc = launchEdge();

  const report = {
    viewports: [],
    touchTargets: [],
    summary: {
      allViewportsZeroOverflow: true,
      allTouchTargetsMeet44: true,
      sliderTouchTargetsPass: true
    }
  };

  try {
    const wsUrl = await waitForCdp();
    console.log(`[CDP] WebSocket connected: ${wsUrl}`);
    const client = new CdpClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    const viewports = [
      { name: '320px (iPhone SE minimum)', width: 320, height: 568 },
      { name: '375px (iPhone standard)', width: 375, height: 667 },
      { name: '414px (iPhone Plus / Pro Max)', width: 414, height: 896 },
      { name: '768px (iPad / Tablet Portrait)', width: 768, height: 1024 },
      { name: '1024px (Tablet Landscape / Laptop)', width: 1024, height: 768 },
      { name: '1440px (Desktop Display)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      console.log(`\n========================================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} [${vp.width}x${vp.height}]`);
      console.log(`========================================================`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });

      await client.send('Page.navigate', { url: `http://localhost:${PORT}` });

      // Wait for React app mount
      for (let i = 0; i < 25; i++) {
        const check = await client.send('Runtime.evaluate', {
          expression: `Boolean(document.getElementById('hero') && document.getElementById('root')?.children?.length > 0)`
        });
        if (check.result?.value === true) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      await new Promise((r) => setTimeout(r, 400));

      const overflowRes = await client.send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winWidth = window.innerWidth;

          const docScroll = docEl.scrollWidth;
          const docClient = docEl.clientWidth;
          const bodyScroll = body.scrollWidth;
          const bodyClient = body.clientWidth;

          const sections = Array.from(document.querySelectorAll('section, main, header, footer, [role="region"]'));
          const sectionOverflows = sections.map(s => {
            const id = s.id || s.getAttribute('aria-label') || s.tagName.toLowerCase();
            return {
              id,
              scrollWidth: s.scrollWidth,
              clientWidth: s.clientWidth,
              hasOverflow: s.scrollWidth > s.clientWidth + 1,
              excess: Math.max(0, s.scrollWidth - s.clientWidth)
            };
          });

          // Check all elements in DOM
          const allElements = Array.from(document.querySelectorAll('*'));
          const overflowingElements = [];
          for (const el of allElements) {
            const r = el.getBoundingClientRect();
            // allow floating point subpixel 1px
            if (r.right > winWidth + 1 && r.width > 0) {
              overflowingElements.push({
                tag: el.tagName,
                id: el.id,
                className: el.className ? String(el.className).slice(0, 60) : '',
                right: r.right,
                width: r.width,
                excess: r.right - winWidth
              });
            }
          }

          return {
            docScroll,
            docClient,
            bodyScroll,
            bodyClient,
            hasDocOverflow: docScroll > docClient + 1,
            hasBodyOverflow: bodyScroll > bodyClient + 1,
            sectionOverflows,
            overflowingElementsCount: overflowingElements.length,
            overflowingElements: overflowingElements.slice(0, 5)
          };
        })()`,
        returnByValue: true
      });

      const o = overflowRes.result.value;
      const vpHasOverflow = o.hasDocOverflow || o.hasBodyOverflow || o.overflowingElementsCount > 0;
      if (vpHasOverflow) {
        report.summary.allViewportsZeroOverflow = false;
      }

      console.log(`Doc scrollWidth: ${o.docScroll}px vs clientWidth: ${o.docClient}px (Overflow: ${o.hasDocOverflow})`);
      console.log(`Body scrollWidth: ${o.bodyScroll}px vs clientWidth: ${o.bodyClient}px (Overflow: ${o.hasBodyOverflow})`);
      console.log(`Sections audited: ${o.sectionOverflows.length}`);
      console.log(`Elements bursting viewport boundary: ${o.overflowingElementsCount}`);
      if (o.overflowingElementsCount > 0) {
        console.warn(`  Violations:`, o.overflowingElements);
      } else {
        console.log(`  ✓ 0 horizontal overflow violations detected.`);
      }

      report.viewports.push({
        viewport: vp,
        data: o,
        pass: !vpHasOverflow
      });
    }

    // Now test TOUCH TARGETS in 375px viewport
    console.log(`\n========================================================`);
    console.log(`AUDITING TOUCH TARGET SIZES & WCAG 2.5.5 (>=44x44px)`);
    console.log(`========================================================`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 1,
      mobile: true
    });

    await client.send('Page.navigate', { url: `http://localhost:${PORT}` });
    await new Promise((r) => setTimeout(r, 600));

    // Audit initial dock & hero buttons
    const dockHeroAudit = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const items = [];
        // Hero CTA
        const cta = document.querySelector('#hero button[aria-label*="Celebrate"]');
        if (cta) {
          const r = cta.getBoundingClientRect();
          items.push({ name: 'Hero CTA Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        // Dock buttons
        const dock = document.querySelector('[aria-label="Floating Vinyl Music Player"]');
        if (dock) {
          const playBtn = dock.querySelector('button[aria-label*="music"]');
          if (playBtn) {
            const r = playBtn.getBoundingClientRect();
            items.push({ name: 'Dock Play/Pause Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
          }
          const expandBtn = dock.querySelector('button[aria-label*="Expand"]');
          if (expandBtn) {
            const r = expandBtn.getBoundingClientRect();
            items.push({ name: 'Dock Expand Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
          }
          const miniDisc = dock.querySelector('.shrink-0.group');
          if (miniDisc) {
            const r = miniDisc.getBoundingClientRect();
            items.push({ name: 'Dock Mini Vinyl Disc Target', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
          }
        }
        return items;
      })()`,
      returnByValue: true
    });

    console.log('Dock and Hero Controls:', dockHeroAudit.result.value);
    report.touchTargets.push(...dockHeroAudit.result.value);

    // Expand VinylPlayer modal to test sliders and showcase controls
    console.log(`\nOpening VinylPlayer modal to evaluate scrubber and volume sliders...`);
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const expandBtn = document.querySelector('[aria-label="Floating Vinyl Music Player"] button[aria-label*="Expand"]');
        if (expandBtn) expandBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    const modalAudit = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const items = [];
        const modal = document.querySelector('[role="dialog"][aria-label*="Vinyl Turntable"]');
        if (!modal) return [{ name: 'Modal', notFound: true }];

        const closeBtn = modal.querySelector('button[aria-label*="Close"]');
        if (closeBtn) {
          const r = closeBtn.getBoundingClientRect();
          items.push({ name: 'Modal Close Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        const mainPlay = modal.querySelector('button[aria-label*="Play music"], button[aria-label*="Pause music"]');
        if (mainPlay) {
          const r = mainPlay.getBoundingClientRect();
          items.push({ name: 'Turntable Main Play Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        const prevBtn = modal.querySelector('button[aria-label="Play previous track"]');
        if (prevBtn) {
          const r = prevBtn.getBoundingClientRect();
          items.push({ name: 'Turntable Previous Track Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        const nextBtn = modal.querySelector('button[aria-label="Play next track"]');
        if (nextBtn) {
          const r = nextBtn.getBoundingClientRect();
          items.push({ name: 'Turntable Next Track Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        const noteBtn = modal.querySelector('button[aria-label*="romantic note"]');
        if (noteBtn) {
          const r = noteBtn.getBoundingClientRect();
          items.push({ name: 'Read Romantic Note Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        const muteBtn = modal.querySelector('button[aria-label*="mute volume"], button[aria-label*="Mute volume"], button[aria-label*="Unmute volume"]');
        if (muteBtn) {
          const r = muteBtn.getBoundingClientRect();
          items.push({ name: 'Volume Mute Toggle Button', width: r.width, height: r.height, meets44: r.width >= 44 && r.height >= 44 });
        }

        // 1. Scrubber Slider
        const scrubber = modal.querySelector('input[type="range"][aria-label="Track progress slider"]');
        if (scrubber) {
          const r = scrubber.getBoundingClientRect();
          const computed = window.getComputedStyle(scrubber);
          items.push({
            name: 'Track Progress Scrubber Slider',
            isSlider: true,
            width: r.width,
            height: r.height,
            computedHeight: computed.height,
            computedPadding: computed.paddingTop + ' ' + computed.paddingBottom,
            meets44: r.width >= 44 && r.height >= 44
          });
        }

        // 2. Volume Slider
        const volSlider = modal.querySelector('input[type="range"][aria-label="Volume slider"]');
        if (volSlider) {
          const r = volSlider.getBoundingClientRect();
          const computed = window.getComputedStyle(volSlider);
          items.push({
            name: 'Volume Slider',
            isSlider: true,
            width: r.width,
            height: r.height,
            computedHeight: computed.height,
            computedPadding: computed.paddingTop + ' ' + computed.paddingBottom,
            meets44: r.width >= 44 && r.height >= 44
          });
        }

        // Playlist items
        const playlistBtns = Array.from(modal.querySelectorAll('.grid button'));
        playlistBtns.forEach((btn, idx) => {
          const r = btn.getBoundingClientRect();
          items.push({
            name: 'Playlist Track Item ' + (idx + 1),
            width: r.width,
            height: r.height,
            meets44: r.width >= 44 && r.height >= 44
          });
        });

        return items;
      })()`,
      returnByValue: true
    });

    console.log('Modal Controls & Sliders:', modalAudit.result.value);
    report.touchTargets.push(...modalAudit.result.value);

    // Evaluate summary
    for (const item of report.touchTargets) {
      if (!item.meets44) {
        report.summary.allTouchTargetsMeet44 = false;
        if (item.isSlider) {
          report.summary.sliderTouchTargetsPass = false;
        }
      }
    }

    console.log(`\n========================================================`);
    console.log(`AUDIT SUMMARY VERDICT`);
    console.log(`========================================================`);
    console.log(`Zero Horizontal Overflow Across 6 Viewports: ${report.summary.allViewportsZeroOverflow}`);
    console.log(`All Touch Targets Meet >= 44x44px: ${report.summary.allTouchTargetsMeet44}`);
    console.log(`VinylPlayer Slider Touch Targets Pass: ${report.summary.sliderTouchTargetsPass}`);

    const outputPath = 'C:\\Users\\ADVAN\\.agents\\teamwork\\challenger_m2_rem_2\\audit_results.json';
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nAudit results written to: ${outputPath}`);

    client.close();
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    console.log(`[CLEANUP] Edge browser process and static server closed cleanly.`);
  }
}

main().catch(err => {
  console.error('[FATAL AUDIT ERROR]', err);
  process.exit(1);
});
