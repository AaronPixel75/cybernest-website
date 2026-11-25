import type { AnalyticsEventType } from '../types/cms';

const CONSENT_STORAGE_KEY = 'cn_privacy_analytics_pref';
const TAB_SESSION_KEY = 'cn_tab_session_id';

let sessionStartedAtMs = Date.now();

export type PrivacyPreference = 'unset' | 'accepted' | 'opted_out';

export function getPrivacyPreference(): PrivacyPreference {
  try {
    const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === 'accepted' || val === 'opted_out') return val;
  } catch {
    // Ignore storage restriction
  }
  return 'unset';
}

export function setPrivacyPreference(pref: 'accepted' | 'opted_out'): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, pref);
  } catch {
    // Ignore storage restriction
  }
}

export function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.navigator.doNotTrack === '1') return false;
  return getPrivacyPreference() !== 'opted_out';
}

export function getAnalyticsSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(TAB_SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const created =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cn-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    window.sessionStorage.setItem(TAB_SESSION_KEY, created);
    sessionStartedAtMs = Date.now();
    return created;
  } catch {
    return `cn-mem-${Date.now()}`;
  }
}

export function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  label = '',
  pagePath?: string,
  useBeacon = false,
): void {
  if (!isAnalyticsAllowed()) return;
  const path = pagePath || window.location.pathname || '/';
  if (path.startsWith('/admin')) return;

  const payload = JSON.stringify({
    sessionId: getAnalyticsSessionId(),
    eventType,
    label: label.slice(0, 180),
    pagePath: path.slice(0, 180),
    referrer: document.referrer || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    durationSec: Math.max(0, Math.round((Date.now() - sessionStartedAtMs) / 1000)),
  });

  if (useBeacon && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/public/analytics/event', blob);
    return;
  }

  fetch('/api/public/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt user flow
  });
}
