import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDateComparisonWindow,
  computeDeltaPct,
  formatTimeBucket,
  normalizeReferrerSource,
  parseUserAgent,
  resolveApproximateRegion,
} from './analyticsUtils.ts';

test('parseUserAgent detects mobile, tablet, desktop, browser, and OS accurately', () => {
  const androidMobile = parseUserAgent(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  );
  assert.equal(androidMobile.device, 'mobile');
  assert.equal(androidMobile.browser, 'Chrome');
  assert.equal(androidMobile.os, 'Android');

  const ipadTablet = parseUserAgent(
    'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  );
  assert.equal(ipadTablet.device, 'tablet');
  assert.equal(ipadTablet.browser, 'Safari');
  assert.equal(ipadTablet.os, 'iOS');

  const windowsEdge = parseUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  );
  assert.equal(windowsEdge.device, 'desktop');
  assert.equal(windowsEdge.browser, 'Edge');
  assert.equal(windowsEdge.os, 'Windows');
});

test('normalizeReferrerSource classifies direct, internal, and external domains', () => {
  assert.equal(normalizeReferrerSource('', 'cybernestug.com'), 'Direct');
  assert.equal(normalizeReferrerSource('https://www.cybernestug.com/about', 'cybernestug.com'), 'Internal');
  assert.equal(normalizeReferrerSource('https://www.google.com/search?q=cybernest', 'cybernestug.com'), 'google.com');
  assert.equal(normalizeReferrerSource('not-a-valid-url', 'cybernestug.com'), 'Direct');
});

test('resolveApproximateRegion maps country headers and East African timezones cleanly', () => {
  assert.equal(resolveApproximateRegion('UG', 'Africa/Kampala'), 'Uganda');
  assert.equal(resolveApproximateRegion(undefined, 'Africa/Kampala'), 'Uganda (Approx. TZ)');
  assert.equal(resolveApproximateRegion('XX', 'Africa/Nairobi'), 'Kenya / East Africa (Approx. TZ)');
  assert.equal(resolveApproximateRegion(undefined, ''), 'Local / Unspecified');
});

test('computeDeltaPct handles zero baselines and normal growth/decline deltas', () => {
  assert.equal(computeDeltaPct(0, 0), null);
  assert.equal(computeDeltaPct(5, 0), 100);
  assert.equal(computeDeltaPct(15, 10), 50);
  assert.equal(computeDeltaPct(7, 10), -30);
});

test('formatTimeBucket formats daily, weekly (Monday start), and monthly buckets', () => {
  const iso = '2026-11-25T14:30:00.000Z'; // Wednesday Nov 25, 2026
  assert.equal(formatTimeBucket(iso, 'daily'), '2026-11-25');
  assert.equal(formatTimeBucket(iso, 'weekly'), '2026-11-23'); // Monday Nov 23
  assert.equal(formatTimeBucket(iso, 'monthly'), '2026-11');
});

test('computeDateComparisonWindow calculates equal-length prior period immediately preceding start', () => {
  const win = computeDateComparisonWindow('2026-11-10', '2026-11-16');
  assert.equal(win.prevEndMs, win.startMs - 1);
  assert.equal(win.endMs - win.startMs, win.prevEndMs - win.prevStartMs);
});
