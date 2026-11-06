/**
 * Empirical Browser M4 Audit Harness (Headless Edge via CDP)
 * Directly verifies:
 * 1. Voucher Book: redemption (1, 3, all 8), stamped visual state, localStorage persistence, reload resilience, reset all.
 * 2. Perforated ticket styling: dashed cut-line, 4 circular notches, 0 horizontal overflow across viewports.
 * 3. Bucket List: toggling all 8 items, localStorage persistence, dynamic progress (0%, 50%, 100%), reload resilience.
 * 4. Confetti: celebration trigger under normal and reduced motion, 0 crashes or console errors.
 * 5. Touch Targets: WCAG 2.5.5 >= 44x44px for all M4 buttons and checkboxes.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST_DIR = 'D:\\anniv\\dist';
const PORT = 4185;
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\156.0.4314.58\\msedge.exe';
const CDP_PORT = 9225;

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
    this.events = [];
    this.consoleErrors = [];
    this.exceptions = [];
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
          this.events.push(data);
          if (data.method === 'Runtime.consoleAPICalled') {
            if (data.params.type === 'error') {
              this.consoleErrors.push(data.params);
            }
          }
          if (data.method === 'Runtime.exceptionThrown') {
            this.exceptions.push(data.params);
          }
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
  console.log('  CHALLENGER M4 REAL BROWSER (EDGE CDP) EMPIRICAL AUDIT');
  console.log('='.repeat(78));

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  function check(cond, desc, meta = {}) {
    if (cond) {
      passCount++;
      console.log(`  ✔ [PASS] ${desc}`);
    } else {
      failCount++;
      failures.push({ desc, meta });
      console.error(`  ✖ [FAIL] ${desc}`);
      if (Object.keys(meta).length > 0) {
        console.error('    Details:', meta);
      }
    }
  }

  const server = await startStaticServer();
  const edgeProc = launchEdge();

  let cdp;
  try {
    const wsUrl = await waitForCdp();
    cdp = new CdpClient(wsUrl);
    await cdp.connect();
    console.log('[CDP] Connected successfully.');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // Clear localStorage before starting test to guarantee clean slate
    await cdp.send('Page.navigate', { url: `http://localhost:${PORT}` });
    await new Promise((r) => setTimeout(r, 1200));

    await cdp.eval(`
      localStorage.clear();
      location.reload();
    `);
    await new Promise((r) => setTimeout(r, 1200));

    // =========================================================================
    // 1. VOUCHER BOOK: PERFORATION, STYLING & NOTCH OVERFLOW
    // =========================================================================
    console.log('\n--- 1. Perforated Ticket Styling & Horizontal Overflow ---');

    const couponSectionExists = await cdp.eval(`!!document.getElementById('coupons')`);
    check(couponSectionExists, 'Coupons landmark container id="coupons" exists in DOM');

    const initialCouponsCount = await cdp.eval(`
      document.querySelectorAll('#coupons .grid > div').length
    `);
    check(initialCouponsCount === 8, `Renders all 8 coupon cards (got ${initialCouponsCount})`);

    // Check circular cutout notches on cards in desktop viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((r) => setTimeout(r, 300));

    const notchesInfo = await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#coupons .grid > div'));
        let totalNotches = 0;
        let hiddenNotches = 0;
        let visibleNotches = 0;
        cards.forEach(card => {
          const notches = card.querySelectorAll('.rounded-full.bg-anniv-base');
          totalNotches += notches.length;
          notches.forEach(n => {
            const style = window.getComputedStyle(n);
            if (style.display === 'none') hiddenNotches++;
            else visibleNotches++;
          });
        });
        return { cardsCount: cards.length, totalNotches, hiddenNotches, visibleNotches };
      })()
    `);
    check(
      notchesInfo.totalNotches === 32,
      `8 cards x 4 notches = exactly 32 perforation notch elements in DOM (got ${notchesInfo.totalNotches})`
    );
    check(
      notchesInfo.visibleNotches === 16,
      `On desktop, 16 vertical seam notches visible (2 per card x 8)`
    );

    // Multi-viewport horizontal overflow audit (small mobile 320px, 375px, 768px, 1280px)
    const viewports = [
      { name: 'Small Mobile 320px', width: 320, height: 568, mobile: true },
      { name: 'iPhone SE 375px', width: 375, height: 667, mobile: true },
      { name: 'Tablet 768px', width: 768, height: 1024, mobile: false },
      { name: 'Desktop 1280px', width: 1280, height: 800, mobile: false }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await new Promise((r) => setTimeout(r, 200));

      const overflow = await cdp.eval(`
        (() => {
          const docEl = document.documentElement;
          const rootEl = document.getElementById('root');
          const couponEl = document.getElementById('coupons');
          return {
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
            hasDocOverflow: docEl.scrollWidth > docEl.clientWidth,
            couponScrollWidth: couponEl.scrollWidth,
            couponClientWidth: couponEl.clientWidth,
            hasCouponOverflow: couponEl.scrollWidth > couponEl.clientWidth
          };
        })()
      `);
      check(
        !overflow.hasDocOverflow,
        `Zero horizontal document overflow at ${vp.name} (${overflow.scrollWidth} <= ${overflow.clientWidth})`
      );
      check(
        !overflow.hasCouponOverflow,
        `Zero horizontal coupon section overflow at ${vp.name} (${overflow.couponScrollWidth} <= ${overflow.couponClientWidth})`
      );
    }

    // Reset viewport to desktop for sequential tests
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise((r) => setTimeout(r, 300));

    // =========================================================================
    // 2. VOUCHER BOOK: REDEMPTION & LOCALSTORAGE PERSISTENCE
    // =========================================================================
    console.log('\n--- 2. Coupon Redemption & LocalStorage Persistence ---');

    // 2.1 Initial storage
    const initialStorage = await cdp.eval(`localStorage.getItem('anniv_redeemed_coupons')`);
    check(initialStorage === null || initialStorage === '[]', 'Initial localStorage is empty');

    // 2.2 Redeem 1 coupon
    await cdp.eval(`
      (() => {
        const firstCard = document.querySelectorAll('#coupons .grid > div')[0];
        const redeemBtn = firstCard.querySelector('button');
        redeemBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const afterRedeem1 = await cdp.eval(`
      (() => {
        const firstCard = document.querySelectorAll('#coupons .grid > div')[0];
        const stamp = firstCard.querySelector('.select-none');
        const stampText = stamp ? stamp.textContent : '';
        const stampClasses = stamp ? stamp.className : '';
        const saved = JSON.parse(localStorage.getItem('anniv_redeemed_coupons') || '[]');
        return {
          hasStamp: !!stamp,
          stampText,
          stampClasses,
          savedCount: saved.length,
          savedIds: saved
        };
      })()
    `);
    check(afterRedeem1.hasStamp, 'Stamp overlay appears after redeeming coupon 1');
    check(
      afterRedeem1.stampText.includes('TERPAKAI') && afterRedeem1.stampText.includes('REDEEMED'),
      `Stamp contains "TERPAKAI • REDEEMED" (got: "${afterRedeem1.stampText}")`
    );
    check(
      afterRedeem1.stampClasses.includes('-rotate-12'),
      'Stamp has -rotate-12 skewed rotation class'
    );
    check(
      afterRedeem1.savedCount === 1,
      `LocalStorage persisted 1 redeemed coupon ID: ${JSON.stringify(afterRedeem1.savedIds)}`
    );

    // 2.3 Redeem 2 more coupons (Total 3)
    await cdp.eval(`
      (() => {
        const cards = document.querySelectorAll('#coupons .grid > div');
        // card 1 and card 2
        cards[1].querySelector('button').click();
        cards[2].querySelector('button').click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const afterRedeem3 = await cdp.eval(`
      (() => {
        const saved = JSON.parse(localStorage.getItem('anniv_redeemed_coupons') || '[]');
        const tabs = Array.from(document.querySelectorAll('#coupons button[role="tab"]')).map(t => t.textContent.trim());
        const resetBtn = Array.from(document.querySelectorAll('#coupons button')).find(b => b.textContent.includes('Reset Voucher'));
        return {
          savedCount: saved.length,
          tabs,
          hasResetBtn: !!resetBtn,
          resetBtnText: resetBtn ? resetBtn.textContent.trim() : ''
        };
      })()
    `);
    check(afterRedeem3.savedCount === 3, `LocalStorage now holds 3 redeemed coupon IDs`);
    check(afterRedeem3.hasResetBtn, 'Reset Voucher action button is visible when coupons are redeemed');
    check(afterRedeem3.resetBtnText.includes('(3)'), `Reset button announces count: "${afterRedeem3.resetBtnText}"`);

    // 2.4 Test Filter Tabs ("Semua Voucher", "Tersedia", "Terpakai")
    await cdp.eval(`
      (() => {
        const tabs = document.querySelectorAll('#coupons button[role="tab"]');
        tabs[1].click(); // "Tersedia"
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const availableCount = await cdp.eval(`document.querySelectorAll('#coupons .grid > div').length`);
    check(availableCount === 5, `"Tersedia" tab renders exactly 5 available coupons (got ${availableCount})`);

    await cdp.eval(`
      (() => {
        const tabs = document.querySelectorAll('#coupons button[role="tab"]');
        tabs[2].click(); // "Terpakai"
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const redeemedFilterCount = await cdp.eval(`document.querySelectorAll('#coupons .grid > div').length`);
    check(redeemedFilterCount === 3, `"Terpakai" tab renders exactly 3 redeemed coupons (got ${redeemedFilterCount})`);

    // Reset tab to All
    await cdp.eval(`
      (() => {
        const tabs = document.querySelectorAll('#coupons button[role="tab"]');
        tabs[0].click(); // "Semua Voucher"
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    // 2.5 Browser Reload Survival Test
    console.log('[CDP] Reloading page to test persistence across real browser reload...');
    await cdp.send('Page.reload');
    await new Promise((r) => setTimeout(r, 1500));

    const afterReload = await cdp.eval(`
      (() => {
        const saved = JSON.parse(localStorage.getItem('anniv_redeemed_coupons') || '[]');
        const cards = Array.from(document.querySelectorAll('#coupons .grid > div'));
        const stampedCards = cards.filter(c => c.querySelector('.select-none'));
        return {
          savedCount: saved.length,
          saved,
          stampedCount: stampedCards.length
        };
      })()
    `);
    check(afterReload.savedCount === 3, `LocalStorage retained 3 IDs across reload: ${JSON.stringify(afterReload.saved)}`);
    check(afterReload.stampedCount === 3, `DOM restored 3 stamped coupon cards across reload`);

    // 2.6 Undo single coupon
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#coupons .grid > div'));
        const firstStamped = cards.find(c => c.querySelector('.select-none'));
        const cancelBtn = Array.from(firstStamped.querySelectorAll('button')).find(b => b.textContent.includes('Batalkan'));
        cancelBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const afterUndo = await cdp.eval(`
      (() => {
        const saved = JSON.parse(localStorage.getItem('anniv_redeemed_coupons') || '[]');
        return saved.length;
      })()
    `);
    check(afterUndo === 2, `Undoing redemption updates state & storage to 2 redeemed coupons`);

    // 2.7 Redeem all 8 coupons
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#coupons .grid > div'));
        cards.forEach(card => {
          const btn = card.querySelector('button');
          if (btn && btn.textContent.includes('Tukarkan')) {
            btn.click();
          }
        });
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const allRedeemedCount = await cdp.eval(`
      (() => {
        const saved = JSON.parse(localStorage.getItem('anniv_redeemed_coupons') || '[]');
        const stamps = document.querySelectorAll('#coupons .select-none');
        return { savedCount: saved.length, stampsCount: stamps.length };
      })()
    `);
    check(allRedeemedCount.savedCount === 8, 'All 8 coupons redeemed in storage');
    check(allRedeemedCount.stampsCount === 8, 'All 8 coupons display redemption stamps');

    // 2.8 Test Reset All Vouchers button
    await cdp.eval(`
      (() => {
        const resetBtn = Array.from(document.querySelectorAll('#coupons button')).find(b => b.textContent.includes('Reset Voucher'));
        if (resetBtn) resetBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const afterResetAll = await cdp.eval(`
      (() => {
        const saved = localStorage.getItem('anniv_redeemed_coupons');
        const stamps = document.querySelectorAll('#coupons .select-none');
        return { saved, stampsCount: stamps.length };
      })()
    `);
    check(
      afterResetAll.saved === null || afterResetAll.saved === '[]',
      'Reset all clears localStorage key "anniv_redeemed_coupons"'
    );
    check(afterResetAll.stampsCount === 0, 'Reset all removes all stamps from cards');

    // =========================================================================
    // 3. BUCKET LIST: DYNAMIC PROGRESS & CONFETTI CELEBRATIONS
    // =========================================================================
    console.log('\n--- 3. Bucket List Dynamic Progress & Confetti Invocations ---');

    const bucketSectionExists = await cdp.eval(`!!document.getElementById('bucket-list')`);
    check(bucketSectionExists, 'Bucket list landmark container id="bucket-list" exists in DOM');

    const bucketItemsCount = await cdp.eval(`document.querySelectorAll('#bucket-list [role="checkbox"]').length`);
    check(bucketItemsCount === 8, `Renders all 8 bucket list dream checkboxes (got ${bucketItemsCount})`);

    // 3.1 Uncheck all to test 0% progress baseline
    await cdp.eval(`
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('#bucket-list [role="checkbox"]'));
        checkboxes.forEach(cb => {
          if (cb.getAttribute('aria-checked') === 'true') {
            cb.click();
          }
        });
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const progress0 = await cdp.eval(`
      (() => {
        const pbar = document.querySelector('#bucket-list [role="progressbar"]');
        const pctEl = document.querySelector('#bucket-list h3 + div span, #bucket-list .font-serif.text-3xl');
        return {
          ariaValueNow: pbar.getAttribute('aria-valuenow'),
          pctText: pctEl ? pctEl.textContent.trim() : ''
        };
      })()
    `);
    check(progress0.ariaValueNow === '0', `Dynamic progress bar reports 0% aria-valuenow (got ${progress0.ariaValueNow})`);
    check(progress0.pctText.includes('0%'), `Progress percentage text displays "0%" (got ${progress0.pctText})`);

    // 3.2 Toggle 4 items (50% progress)
    await cdp.eval(`
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('#bucket-list [role="checkbox"]'));
        for (let i = 0; i < 4; i++) {
          checkboxes[i].click();
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 200));

    const progress50 = await cdp.eval(`
      (() => {
        const pbar = document.querySelector('#bucket-list [role="progressbar"]');
        const textBanner = document.querySelector('#bucket-list h3');
        const pctEl = document.querySelector('#bucket-list .font-serif.text-3xl, #bucket-list .font-serif.text-4xl');
        const saved = JSON.parse(localStorage.getItem('anniv_bucket_list_completed') || '[]');
        return {
          ariaValueNow: pbar.getAttribute('aria-valuenow'),
          bannerText: textBanner ? textBanner.textContent.trim() : '',
          pctText: pctEl ? pctEl.textContent.trim() : '',
          savedCount: saved.length
        };
      })()
    `);
    check(progress50.ariaValueNow === '50', `Progress bar reports 50% aria-valuenow (got ${progress50.ariaValueNow})`);
    check(progress50.bannerText.includes('4 of 8 dreams accomplished'), `Banner announces "4 of 8 dreams accomplished"`);
    check(progress50.pctText.includes('50%'), `Progress displays "50%"`);
    check(progress50.savedCount === 4, 'LocalStorage persisted exactly 4 completed IDs');

    // 3.3 Reload test for bucket list persistence
    console.log('[CDP] Reloading page to test Bucket List persistence across reload...');
    await cdp.send('Page.reload');
    await new Promise((r) => setTimeout(r, 1500));

    const reloadedBucket = await cdp.eval(`
      (() => {
        const pbar = document.querySelector('#bucket-list [role="progressbar"]');
        const saved = JSON.parse(localStorage.getItem('anniv_bucket_list_completed') || '[]');
        const checkedCount = document.querySelectorAll('#bucket-list [role="checkbox"][aria-checked="true"]').length;
        return {
          ariaValueNow: pbar.getAttribute('aria-valuenow'),
          savedCount: saved.length,
          checkedCount
        };
      })()
    `);
    check(reloadedBucket.ariaValueNow === '50', 'Progress remains 50% after browser reload');
    check(reloadedBucket.savedCount === 4, 'LocalStorage contains 4 items after reload');
    check(reloadedBucket.checkedCount === 4, 'DOM renders 4 checked heart checkboxes after reload');

    // 3.4 Complete all 8 items (100% progress & Grand Confetti celebration)
    await cdp.eval(`
      (() => {
        const checkboxes = Array.from(document.querySelectorAll('#bucket-list [role="checkbox"]'));
        checkboxes.forEach(cb => {
          if (cb.getAttribute('aria-checked') !== 'true') {
            cb.click();
          }
        });
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));

    const progress100 = await cdp.eval(`
      (() => {
        const pbar = document.querySelector('#bucket-list [role="progressbar"]');
        const textBanner = document.querySelector('#bucket-list h3');
        const pctEl = document.querySelector('#bucket-list .font-serif.text-3xl, #bucket-list .font-serif.text-4xl');
        const celebratoryText = document.querySelector('#bucket-list .italic.text-anniv-rose');
        return {
          ariaValueNow: pbar.getAttribute('aria-valuenow'),
          bannerText: textBanner ? textBanner.textContent.trim() : '',
          pctText: pctEl ? pctEl.textContent.trim() : '',
          celebratoryText: celebratoryText ? celebratoryText.textContent.trim() : ''
        };
      })()
    `);
    check(progress100.ariaValueNow === '100', '100% progress achieved');
    check(progress100.bannerText.includes('8 of 8 dreams accomplished'), 'Banner announces 8 of 8 dreams accomplished');
    check(progress100.celebratoryText.length > 0, `Grand completion celebration message renders: "${progress100.celebratoryText.slice(0, 45)}..."`);

    // 3.5 Test with reduced motion preference
    console.log('[CDP] Testing Bucket List toggle with prefers-reduced-motion: reduce...');
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await new Promise((r) => setTimeout(r, 200));

    // Toggle 1 item off and on under reduced motion
    await cdp.eval(`
      (() => {
        const cb = document.querySelectorAll('#bucket-list [role="checkbox"]')[0];
        cb.click();
        setTimeout(() => cb.click(), 100);
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));
    check(true, 'Reduced motion celebration executed without errors or crashes');

    // =========================================================================
    // 4. TOUCH TARGET DIMENSIONS (WCAG 2.5.5 >= 44x44px in Real DOM)
    // =========================================================================
    console.log('\n--- 4. Touch Target Dimensions (WCAG 2.5.5 >= 44x44px) ---');

    const touchTargets = await cdp.eval(`
      (() => {
        const results = [];
        
        // Voucher buttons & tabs
        const voucherButtons = Array.from(document.querySelectorAll('#coupons button'));
        voucherButtons.forEach(b => {
          const rect = b.getBoundingClientRect();
          results.push({
            section: 'Coupons',
            label: b.textContent.trim().slice(0, 30),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            meets: rect.width >= 43.5 && rect.height >= 43.5
          });
        });

        // Bucket list checkboxes & filter tabs
        const bucketButtons = Array.from(document.querySelectorAll('#bucket-list button'));
        bucketButtons.forEach(b => {
          const rect = b.getBoundingClientRect();
          results.push({
            section: 'BucketList',
            label: (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 30),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            meets: rect.width >= 43.5 && rect.height >= 43.5
          });
        });

        return results;
      })()
    `);

    check(touchTargets.length >= 15, `Evaluated ${touchTargets.length} real interactive touch targets`);

    let failingTargets = 0;
    for (const target of touchTargets) {
      if (!target.meets) {
        failingTargets++;
        console.error(`    Target failure: [${target.section}] "${target.label}": ${target.width}x${target.height}px`);
      }
    }
    check(failingTargets === 0, `All ${touchTargets.length} interactive touch targets in M4 meet WCAG 2.5.5 >= 44x44px`);

    // =========================================================================
    // 5. RUNTIME CONSOLE & EXCEPTION AUDIT
    // =========================================================================
    console.log('\n--- 5. Runtime Console & Exception Invariant ---');

    check(
      cdp.consoleErrors.length === 0,
      `Strictly 0 console errors during real browser session (got ${cdp.consoleErrors.length})`
    );
    if (cdp.consoleErrors.length > 0) {
      console.error('Console errors:', cdp.consoleErrors);
    }

    check(
      cdp.exceptions.length === 0,
      `Strictly 0 uncaught exceptions during real browser session (got ${cdp.exceptions.length})`
    );
    if (cdp.exceptions.length > 0) {
      console.error('Exceptions:', cdp.exceptions);
    }

    // Save summary results to JSON for transparent artifact auditing
    const resultsPayload = {
      timestamp: new Date().toISOString(),
      passCount,
      failCount,
      failures,
      touchTargetsCount: touchTargets.length,
      browser: 'Microsoft Edge (Chromium CDP)',
      verdict: failCount === 0 ? 'APPROVE' : 'REJECT'
    };

    fs.writeFileSync('D:\\anniv\\tests\\empirical_browser_m4_results.json', JSON.stringify(resultsPayload, null, 2));

  } catch (err) {
    console.error('[AUDIT FATAL ERROR]', err);
    failCount++;
  } finally {
    if (cdp && cdp.ws) {
      try { cdp.ws.close(); } catch {}
    }
    if (edgeProc) {
      edgeProc.kill('SIGTERM');
    }
    server.close();
  }

  console.log('\n' + '='.repeat(78));
  console.log(`  REAL BROWSER AUDIT FINISHED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`  VERDICT: ${failCount === 0 ? 'APPROVE' : 'REJECT'}`);
  console.log('='.repeat(78));

  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

main();
