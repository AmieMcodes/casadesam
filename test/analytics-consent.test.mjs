import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { startAnalytics } from '../js/analytics-consent.mjs';
import { analyticsConfig } from '../js/analytics-config.mjs';

const ID = 'G-TEST123456'; // Offline fixture only; never used by the browser entry point.
const KEY = 'casa-analytics-consent-v1';
const TTL = 90 * 86400000;
const activeConfig = () => ({ ...analyticsConfig, enabled: true, measurementId: ID });
function fixture({ path = '/', hostname = 'casadesam.org', protocol = 'https:', stored, blocked = false } = {}) {
  let now = 1800000000000;
  const listeners = new Map(), timers = new Map(), writes = [], elements = [];
  let nextTimer = 1;
  const values = new Map(stored === undefined ? [] : [[KEY, stored]]);
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.listeners = {}; this.hidden = false; this.style = {}; elements.push(this); }
    append(...items) { for (const item of items) { this.children.push(item); item.parentNode = this; } }
    appendChild(item) { this.append(item); return item; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
    click() { for (const callback of this.listeners.click || []) callback(); }
    focus() { doc.activeElement = this; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(item => item !== this); }
    insertBefore(item, before) { const index = this.children.indexOf(before); if (index < 0) return this.append(item); this.children.splice(index, 0, item); item.parentNode = this; }
  }
  const head = new Element('head'), body = new Element('body'), footer = new Element('footer');
  body.append(footer);
  const doc = {
    head, body, title: 'PRIVATE FORM VALUE', referrer: 'https://private.test/?email=person@example.test',
    createElement: tag => new Element(tag),
    querySelector: selector => selector === '.sam-footer' ? footer : null,
    get cookie() { return '_ga=old; _ga_TEST123456=old; unrelated=keep'; },
    set cookie(value) { writes.push({ value, disabled: win[`ga-disable-${ID}`] }); }
  };
  const win = {
    document: doc, location: { hostname, protocol, pathname: path, search: '?email=person@example.test&utm_source=PRIVATE', hash: '#PRIVATE', reload() { throw Error('Do not lose unsent chat/form input'); } },
    Date: { now: () => now },
    localStorage: { getItem: key => { if (blocked) throw Error('blocked'); return values.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw Error('blocked'); values.set(key, value); } },
    setTimeout: (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (type, callback) => { const callbacks = listeners.get(type) || []; callbacks.push(callback); listeners.set(type, callbacks); }
  };
  return { win, doc, elements, writes, values, listeners, timers,
    scripts: () => head.children.filter(el => el.tagName === 'SCRIPT'),
    commands: () => Array.from(win.casaAnalyticsLayer || [], args => Array.from(args)),
    fire: (type, event = {}) => { for (const callback of listeners.get(type) || []) callback(event); },
    advance: milliseconds => { now += milliseconds; for (const [id, item] of [...timers]) if (item.at <= now) { timers.delete(id); item.fn(); } },
    record: choice => JSON.stringify({ version: 1, choice, expiresAt: now + TTL }),
    now: () => now
  };
}
const load = f => { const script = f.scripts()[0]; assert.ok(script, 'consented loader exists'); script.onload(); };
const pageViews = f => f.commands().filter(c => c[0] === 'event' && c[1] === 'page_view');

test('disabled production config has no UI, storage, Google loader or data layer', () => {
  const f = fixture();
  assert.equal(startAnalytics(f.win, analyticsConfig), null);
  assert.equal(f.elements.length, 3); assert.equal(f.scripts().length, 0);
  assert.equal(f.win.casaAnalyticsLayer, undefined); assert.equal(f.values.size, 0);
});
for (const config of [{ enabled: true, measurementId: '' }, { enabled: true, measurementId: 'AW-123' }]) {
  test(`invalid or empty measurement ID stays inert: ${config.measurementId}`, () => {
    const f = fixture(); assert.equal(startAnalytics(f.win, { ...activeConfig(), ...config }), null); assert.equal(f.elements.length, 3);
  });
}
for (const options of [
  { hostname: 'deploy-preview-4--casadesam.netlify.app' }, { hostname: 'localhost' }, { hostname: 'casadesam.org.attacker.test' }, { protocol: 'http:' },
  { path: '/private/person@example.test' }, { path: '/store.html' }, { path: '/if-something-happened-tonight.html' }, { path: '/roi-of-independence.html' },
  { path: '/blog/_template.html' }, { path: '/blog/%70rivate' }, { path: '/__proto__' }
]) test(`ineligible location is inert: ${JSON.stringify(options)}`, () => {
  const f = fixture(options); assert.equal(startAnalytics(f.win, activeConfig()), null); assert.equal(f.elements.length, 3);
});

test('unknown and rejected consent never insert a Google resource or create a data layer', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig());
  assert.equal(controller.choice(), 'unknown'); assert.equal(f.scripts().length, 0); assert.equal(f.win.casaAnalyticsLayer, undefined);
  controller.reject(); assert.equal(controller.choice(), 'denied'); assert.equal(f.scripts().length, 0); assert.equal(f.win.casaAnalyticsLayer, undefined);
  assert.equal(JSON.parse(f.values.get(KEY)).choice, 'denied');
});

test('explicit acceptance loads once and emits only fixed sanitized metadata after the library loads', () => {
  const f = fixture({ path: '/mission' }); const controller = startAnalytics(f.win, activeConfig());
  controller.accept(); controller.accept();
  assert.equal(f.scripts().length, 1); assert.equal(f.scripts()[0].referrerPolicy, 'no-referrer');
  assert.equal(f.scripts()[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123456&l=casaAnalyticsLayer');
  assert.equal(pageViews(f).length, 0); assert.equal(f.win[`ga-disable-${ID}`], true);
  load(f);
  const config = f.commands().find(c => c[0] === 'config');
  assert.equal(config[1], ID); assert.equal(config[2].send_page_view, false);
  assert.equal(config[2].allow_google_signals, false); assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(config[2].cookie_domain, 'none'); assert.equal(config[2].cookie_path, '/');
  assert.equal(config[2].cookie_update, false); assert.equal(config[2].cookie_expires, 90 * 86400);
  assert.deepEqual(pageViews(f), [['event', 'page_view', { send_to: ID, page_location: 'https://casadesam.org/mission.html', page_title: 'Casa de SAM — Our Mission', page_referrer: '' }]]);
  assert.equal(f.win[`ga-disable-${ID}`], false);
  assert.doesNotMatch(JSON.stringify(f.commands()), /PRIVATE|person@example|utm_source|private\.test/);
  const consent = f.commands().filter(c => c[0] === 'consent');
  assert.ok(consent.length >= 2); for (const command of consent) for (const name of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(command[2][name], 'denied');
  assert.deepEqual([...f.listeners.keys()].sort(), ['pageshow', 'storage']);
});

test('revocation during pending load cannot configure, send, reload or resurrect on delayed completion', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); controller.reject(); load(f);
  assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(pageViews(f).length, 0);
  assert.equal(f.commands().filter(c => c[0] === 'config').length, 0);
  assert.ok(f.writes.length >= 2); assert.ok(f.writes.every(write => write.disabled));
  assert.ok(f.writes.every(write => /Max-Age=0/.test(write.value) && !/unrelated/.test(write.value)));
});

test('loaded revoke disables first, clears owned cookies and sends no denial command', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); load(f);
  controller.reject(); assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(f.commands().length, 0);
  assert.ok(f.writes.some(write => /^_ga=/.test(write.value))); assert.ok(f.writes.some(write => /^_ga_TEST123456=/.test(write.value)));
  assert.ok(f.writes.every(write => write.disabled));
});

test('pending revoke then reaccept reuses the request and emits one manual page view', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); controller.reject(); controller.accept(); load(f);
  assert.equal(f.scripts().length, 1); assert.equal(pageViews(f).length, 1);
});

test('reaccept after a loaded revoke does not duplicate the manual page view or script', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); load(f); controller.reject(); controller.accept();
  assert.equal(f.scripts().length, 1); assert.equal(pageViews(f).length, 0); assert.equal(f.win[`ga-disable-${ID}`], false);
});

test('remembered grant loads while remembered rejection does not', () => {
  for (const choice of ['granted', 'denied']) { const f = fixture(); f.values.set(KEY, f.record(choice)); const controller = startAnalytics(f.win, activeConfig()); assert.equal(controller.choice(), choice); assert.equal(f.scripts().length, choice === 'granted' ? 1 : 0); }
});

test('corrupt, wrong-version, expired, impossible-future and unknown stored choices fail closed', () => {
  for (const stored of ['broken', 'null', '{}', '{"version":2,"choice":"granted","expiresAt":1800000001000}', '{"version":1,"choice":"granted","expiresAt":1}', '{"version":1,"choice":"granted","expiresAt":9999999999999}', '{"version":1,"choice":"yes","expiresAt":1800000001000}']) {
    const f = fixture({ stored }); const controller = startAnalytics(f.win, activeConfig()); assert.equal(controller.choice(), 'unknown'); assert.equal(f.scripts().length, 0);
  }
});

test('unavailable storage requires explicit current-page consent and can still revoke', () => {
  const f = fixture({ blocked: true }); const controller = startAnalytics(f.win, activeConfig()); assert.equal(f.scripts().length, 0);
  controller.accept(); load(f); assert.equal(pageViews(f).length, 1); controller.reject(); assert.equal(f.win[`ga-disable-${ID}`], true);
  const next = fixture({ blocked: true }); assert.equal(startAnalytics(next.win, activeConfig()).choice(), 'unknown'); assert.equal(next.scripts().length, 0);
});

test('expiry disables the tag even on a page left open', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); load(f); f.advance(TTL + 1);
  assert.equal(controller.choice(), 'unknown'); assert.equal(f.win[`ga-disable-${ID}`], true);
});

test('cross-tab denial or deletion disables; cross-tab grant does not silently initialize this tab', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig());
  f.values.set(KEY, f.record('granted')); f.fire('storage', { key: KEY, newValue: f.values.get(KEY) }); assert.equal(f.scripts().length, 0);
  controller.accept(); load(f); f.values.set(KEY, f.record('denied')); f.fire('storage', { key: KEY, newValue: f.values.get(KEY) }); assert.equal(f.win[`ga-disable-${ID}`], true);
  controller.accept(); f.values.delete(KEY); f.fire('storage', { key: null }); assert.equal(f.win[`ga-disable-${ID}`], true);
});

test('bfcache restore rechecks saved rejection before further collection', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); load(f); f.values.set(KEY, f.record('denied')); f.fire('pageshow');
  assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(controller.choice(), 'denied');
});

test('library failure stays disabled and does not silently retry', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); f.scripts()[0].onerror();
  assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(pageViews(f).length, 0); assert.equal(controller.choice(), 'denied');
  controller.accept(); assert.equal(f.scripts().length, 1);
});

test('every allowed canonical page exists and clean aliases normalize to fixed public metadata', () => {
  const expectedFiles = ['index.html', 'mission.html', 'why-paraguay.html', 'sustainability.html', 'philosophy.html', 'timeline.html', 'blog.html', 'current.html', ...readdirSync(new URL('../blog', import.meta.url)).filter(f => f.endsWith('.html') && f !== '_template.html').map(f => `blog/${f}`)];
  assert.equal(Object.keys(analyticsConfig.pages).length, expectedFiles.length);
  for (const file of expectedFiles) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'); assert.ok(html.includes('reveal.js'));
    const f = fixture({ path: `/${file}` }); const controller = startAnalytics(f.win, activeConfig()); assert.ok(controller, file); controller.accept(); load(f);
    const page = pageViews(f)[0][2]; assert.ok(page.page_title.length); assert.equal(page.page_location, file === 'index.html' ? 'https://casadesam.org/' : `https://casadesam.org/${file}`);
  }
});

test('eligible notice offers equal explicit choices and footer settings can revoke without navigation', () => {
  const f = fixture(); startAnalytics(f.win, activeConfig());
  const buttons = () => f.elements.filter(e => e.tagName === 'BUTTON');
  const named = name => buttons().find(e => e.textContent === name);
  assert.ok(named('Accept analytics')); assert.ok(named('Reject analytics')); assert.ok(named('Analytics settings'));
  const notice = f.elements.find(e => e.id === 'casa-analytics-notice'); assert.ok(notice); assert.equal(notice.hidden, false);
  assert.equal(notice.getAttribute('role'), 'region'); assert.equal(notice.getAttribute('aria-labelledby'), 'casa-analytics-heading');
  named('Reject analytics').click(); assert.equal(notice.hidden, true); assert.equal(f.scripts().length, 0);
  named('Analytics settings').click(); assert.equal(notice.hidden, false);
  named('Accept analytics').click(); load(f); assert.equal(notice.hidden, true);
  named('Analytics settings').click(); named('Turn analytics off').click(); assert.equal(f.win[`ga-disable-${ID}`], true);
  assert.ok(f.elements.filter(e => Object.keys(e.listeners).length).every(e => e.tagName === 'BUTTON'));
});

test('closing settings never opts in and repeated start does not duplicate UI or listeners', () => {
  const f = fixture(); const first = startAnalytics(f.win, activeConfig()); first.reject();
  assert.equal(startAnalytics(f.win, activeConfig()), first);
  f.elements.find(e => e.textContent === 'Analytics settings').click();
  f.elements.find(e => e.textContent === 'Close settings').click();
  assert.equal(f.scripts().length, 0); assert.equal(first.choice(), 'denied');
  assert.equal(f.elements.filter(e => e.id === 'casa-analytics-notice').length, 1);
  assert.equal(f.listeners.get('storage').length, 1);
});

test('shared reveal loader preserves reveal observation and legacy image fix while adding only a local module', async () => {
  const { runInNewContext } = await import('node:vm');
  const f = fixture({ path: '/blog/supporting-choice-without-complete-independence.html' });
  const image = { style: {} }, reveal = { classList: { add: value => reveal.added = value } };
  let ready, observeCallback; const observed = [], unobserved = [];
  f.doc.addEventListener = (name, fn) => { assert.equal(name, 'DOMContentLoaded'); ready = fn; };
  f.doc.querySelector = selector => selector === '.blog-feature-image' ? image : null;
  f.doc.querySelectorAll = selector => { assert.equal(selector, '.reveal'); return [reveal]; };
  runInNewContext(readFileSync(new URL('../js/reveal.js', import.meta.url), 'utf8'), {
    document: f.doc, window: f.win,
    IntersectionObserver: class { constructor(fn, options) { observeCallback = fn; assert.equal(options.threshold, .15); } observe(e) { observed.push(e); } unobserve(e) { unobserved.push(e); } }
  });
  ready(); assert.deepEqual(observed, [reveal]); observeCallback([{ isIntersecting: true, target: reveal }]);
  assert.equal(reveal.added, 'is-visible'); assert.deepEqual(unobserved, [reveal]);
  assert.equal(image.style.maxWidth, '520px'); assert.match(image.src, /supporting-choice-without-complete-independence\/hero-v2.webp$/);
  assert.equal(f.scripts().length, 1); assert.equal(f.scripts()[0].type, 'module'); assert.equal(f.scripts()[0].src, '/js/analytics-consent.mjs');
});

test('notice discloses Google browser/device data and provides privacy/cookie information without loading it', () => {
  const f = fixture(); startAnalytics(f.win, activeConfig());
  assert.ok(f.elements.some(e => /Google receives basic browser, device and page-usage data/.test(e.textContent || '')));
  const links = f.elements.filter(e => e.tagName === 'A');
  assert.ok(links.some(e => e.href === 'https://policies.google.com/technologies/partner-sites'));
  assert.ok(links.some(e => e.href === 'https://support.google.com/analytics/answer/11397207'));
  assert.equal(f.scripts().length, 0);
});

test('accepting or rejecting focused notice controls moves focus to the persistent settings control', () => {
  for (const label of ['Accept analytics', 'Reject analytics']) {
    const f = fixture(); startAnalytics(f.win, activeConfig()); const button = f.elements.find(e => e.textContent === label); button.focus(); button.click();
    assert.equal(f.doc.activeElement, f.elements.find(e => e.textContent === 'Analytics settings'));
  }
});

test('failed rejection persistence removes an old grant where deletion is still available', () => {
  const f = fixture(); f.values.set(KEY, f.record('granted')); const controller = startAnalytics(f.win, activeConfig());
  f.win.localStorage.setItem = () => { throw Error('quota'); };
  f.win.localStorage.removeItem = key => f.values.delete(key);
  controller.reject(); assert.equal(f.values.has(KEY), false); assert.equal(f.win[`ga-disable-${ID}`], true);
});

test('delayed initialization rereads persisted rejection even if the storage event is not yet delivered', () => {
  const f = fixture(); const controller = startAnalytics(f.win, activeConfig()); controller.accept(); f.values.set(KEY, f.record('denied')); load(f);
  assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(pageViews(f).length, 0); assert.equal(controller.choice(), 'denied');
});

test('if storage write and removal both fail, revocation stays off here and visibly warns persistence is not guaranteed', () => {
  const f = fixture(); f.values.set(KEY, f.record('granted')); const controller = startAnalytics(f.win, activeConfig()); load(f);
  f.win.localStorage.setItem = () => { throw Error('blocked'); }; f.win.localStorage.removeItem = () => { throw Error('blocked'); };
  controller.reject(); assert.equal(f.win[`ga-disable-${ID}`], true); assert.equal(controller.choice(), 'denied');
  assert.equal(f.elements.find(e => e.id === 'casa-analytics-notice').hidden, false);
  assert.ok(f.elements.some(e => /could not save this choice/.test(e.textContent || '') && /earlier saved choice may return/.test(e.textContent || '')));
});
