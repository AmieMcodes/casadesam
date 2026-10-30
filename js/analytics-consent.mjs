import { analyticsConfig } from './analytics-config.mjs';

const STORAGE_KEY = 'casa-analytics-consent-v1';
const LIFETIME = 90 * 24 * 60 * 60 * 1000;
const MAX_TIMEOUT = 2147483647;
const controllers = new WeakMap();

// This is intentionally not a general-purpose event API. No DOM/input data is read.
export function startAnalytics(win, config = analyticsConfig) {
  const { location, document: doc } = win;
  if (!config.enabled || !/^G-[A-Z0-9]+$/.test(config.measurementId) ||
      location.protocol !== 'https:' || location.hostname !== 'casadesam.org') return null;
  const path = location.pathname === '/' ? '/index.html' : location.pathname;
  const key = path.endsWith('.html') ? path : `${path}.html`;
  if (!Object.hasOwn(config.pages, key)) return null;
  if (controllers.has(win)) return controllers.get(win);

  const id = config.measurementId;
  const disableKey = `ga-disable-${id}`;
  const page = config.pages[key];
  const metadata = {
    page_location: `https://casadesam.org${page.path}`,
    page_title: page.title,
    page_referrer: ''
  };
  const adsDenied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  const safeConfig = {
    ...metadata,
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'none',
    cookie_path: '/',
    cookie_expires: LIFETIME / 1000,
    cookie_update: false,
    cookie_flags: 'SameSite=Lax;Secure',
    // Avoid attribution from query parameters as well as overriding page_location.
    campaign_id: '', campaign_source: '', campaign_medium: '',
    campaign_name: '', campaign_term: '', campaign_content: ''
  };
  let current = { choice: 'unknown', expiresAt: 0 };
  let sessionOnly = false;
  let script = null;
  let loaded = false;
  let failed = false;
  let counted = false;
  let timer;
  let render = () => {};
  win[disableKey] = true;

  function validRecord(raw) {
    try {
      const value = JSON.parse(raw);
      const remaining = value?.expiresAt - win.Date.now();
      return value?.version === 1 && ['granted', 'denied'].includes(value.choice) &&
        Number.isFinite(value.expiresAt) && remaining > 0 && remaining <= LIFETIME ? value : null;
    } catch { return null; }
  }
  function savedChoice() {
    try { return validRecord(win.localStorage.getItem(STORAGE_KEY)); }
    catch { sessionOnly = true; return null; }
  }
  function remember(choice) {
    current = { version: 1, choice, expiresAt: win.Date.now() + LIFETIME };
    try { win.localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); }
    catch {
      sessionOnly = true;
      // A failed denial write must not leave a removable old grant behind.
      if (choice === 'denied') {
        try { win.localStorage.removeItem(STORAGE_KEY); } catch { /* Warn in the notice. */ }
      }
    }
  }
  function clearCookies() {
    // Only cookies used by this stream, never contact/chat/other application storage.
    for (const name of ['_ga', `_ga_${id.slice(2)}`]) {
      for (const domain of ['', '; Domain=casadesam.org', '; Domain=.casadesam.org']) {
        doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain}`;
      }
    }
  }
  function disable(next) {
    win[disableKey] = true; // Must precede all other revocation effects.
    current = next || { choice: 'unknown', expiresAt: 0 };
    win.clearTimeout(timer);
    if (win.casaAnalyticsLayer) win.casaAnalyticsLayer.length = 0;
    clearCookies();
    render();
  }
  function scheduleExpiry() {
    win.clearTimeout(timer);
    if (current.choice !== 'granted') return;
    const remaining = current.expiresAt - win.Date.now();
    if (remaining <= 0) { disable(); return; }
    timer = win.setTimeout(scheduleExpiry, Math.min(remaining, MAX_TIMEOUT));
  }
  function granted() {
    if (current.choice !== 'granted') return false;
    if (current.expiresAt <= win.Date.now()) { disable(); return false; }
    return true;
  }
  function command() { win.casaAnalyticsLayer.push(arguments); }
  function initialize() {
    recheck(); // Storage events may arrive after this async response.
    if (!loaded || !granted()) return;
    // Configure privacy and fixed metadata before any measurement command.
    command('consent', 'default', { ...adsDenied, analytics_storage: 'denied' });
    command('set', { ...safeConfig, ads_data_redaction: true, url_passthrough: false });
    command('consent', 'update', { ...adsDenied, analytics_storage: 'granted' });
    win[disableKey] = false;
    command('js', new Date());
    command('config', id, safeConfig);
    if (!counted) {
      command('event', 'page_view', { send_to: id, ...metadata });
      counted = true;
    }
  }
  function enable() {
    if (!granted() || failed) return;
    scheduleExpiry();
    if (loaded) { initialize(); return; }
    if (script) return;
    win.casaAnalyticsLayer = [];
    command('consent', 'default', { ...adsDenied, analytics_storage: 'denied' });
    command('set', { ...safeConfig, ads_data_redaction: true, url_passthrough: false });
    script = doc.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}&l=casaAnalyticsLayer`;
    script.onload = () => { loaded = true; initialize(); };
    script.onerror = () => {
      failed = true;
      disable({ choice: 'denied', expiresAt: 0 });
      remember('denied');
      render();
    };
    doc.head.append(script);
  }
  const controller = {
    accept() {
      if (failed) return; // No automatic retry loop if blocked/offline.
      if (granted()) return;
      remember('granted'); enable(); render();
    },
    reject() {
      disable({ choice: 'denied', expiresAt: 0 });
      remember('denied'); render();
    },
    choice() { return current.choice; }
  };
  controllers.set(win, controller);
  current = savedChoice() || current;

  const stylesheet = doc.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/css/analytics-consent.css';
  doc.head.append(stylesheet);
  const notice = doc.createElement('section');
  notice.id = 'casa-analytics-notice';
  notice.className = 'casa-analytics-notice';
  notice.setAttribute('role', 'region');
  notice.setAttribute('aria-labelledby', 'casa-analytics-heading');
  const heading = doc.createElement('h2');
  heading.id = 'casa-analytics-heading';
  heading.tabIndex = -1;
  heading.textContent = 'Optional traffic statistics';
  const explanation = doc.createElement('p');
  explanation.textContent = 'May we use Google Analytics to understand visits to our public pages? It uses analytics cookies after you accept. Google receives basic browser, device and page-usage data. We do not send your Gustavo messages or form entries. Advertising features are off. Your choice is optional, and you can change it in Analytics settings.';
  const information = doc.createElement('p');
  const privacyLink = doc.createElement('a');
  privacyLink.href = 'https://policies.google.com/technologies/partner-sites';
  privacyLink.textContent = 'How Google uses site information';
  privacyLink.rel = 'noreferrer';
  const cookieLink = doc.createElement('a');
  cookieLink.href = 'https://support.google.com/analytics/answer/11397207';
  cookieLink.textContent = 'Google Analytics cookie details';
  cookieLink.rel = 'noreferrer';
  information.className = 'casa-analytics-information';
  information.append(privacyLink, cookieLink);
  const status = doc.createElement('p');
  status.className = 'casa-analytics-status';
  status.setAttribute('aria-live', 'polite');
  const actions = doc.createElement('div');
  actions.className = 'casa-analytics-actions';
  function button(label, callback) {
    const element = doc.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.addEventListener('click', callback);
    return element;
  }
  const choose = action => {
    action();
    if (notice.hidden) settings.focus({ preventScroll: true });
  };
  const accept = button('Accept analytics', () => choose(controller.accept));
  const reject = button('Reject analytics', () => choose(controller.reject));
  const settings = button('Analytics settings', () => {
    notice.hidden = false;
    settings.setAttribute('aria-expanded', 'true');
    heading.focus();
  });
  settings.className = 'casa-analytics-settings';
  settings.setAttribute('aria-controls', notice.id);
  const close = button('Close settings', () => {
    notice.hidden = true;
    settings.setAttribute('aria-expanded', 'false');
    settings.focus();
  });
  actions.append(accept, reject, close);
  notice.append(heading, explanation, information, status, actions);
  doc.body.insertBefore(notice, doc.body.children[0] || null);
  (doc.querySelector('.sam-footer') || doc.body).append(settings);
  render = () => {
    notice.hidden = current.choice !== 'unknown' && !sessionOnly;
    close.hidden = current.choice === 'unknown';
    accept.disabled = failed;
    reject.textContent = current.choice === 'granted' ? 'Turn analytics off' : 'Reject analytics';
    settings.setAttribute('aria-expanded', String(!notice.hidden));
    status.textContent = failed ? 'Analytics could not load and remains off. You can try again on another page.' :
      `Analytics is ${current.choice === 'granted' ? 'on' : 'off'}. ${sessionOnly ? 'Your browser could not save this choice; it applies only to this page. An earlier saved choice may return on another page. Clear the saved data for this site in your browser to remove it.' : 'We remember your choice for up to 90 days.'}`;
  };
  render();
  // React to rejection/deletion in other tabs, never treat an incoming grant as a click here.
  function recheck() {
    if (current.choice === 'granted' && !granted()) return;
    if (sessionOnly) return;
    const saved = savedChoice();
    if (!saved || saved.choice !== 'granted') disable(saved);
  }
  win.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) recheck();
  });
  win.addEventListener('pageshow', recheck);
  if (current.choice === 'granted') enable();
  else clearCookies();
  return controller;
}

if (typeof window !== 'undefined') startAnalytics(window);
