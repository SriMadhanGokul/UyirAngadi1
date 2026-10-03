import { readFileSync } from 'node:fs';

// Ad-hoc verification of the new login-first browse contract.
const BASE = 'http://127.0.0.1:5000/api/v1';
const API_LOG = 'C:/Users/ASUS/Desktop/UyirAngadi02/api.log';

async function req(method, path, { body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

const checks = [];
const check = (name, ok, detail = '') => checks.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);

// 1. Browsing without login must be refused.
const noAuth = await req('GET', '/listings');
check('GET /listings without token -> 401', noAuth.status === 401, `status=${noAuth.status}`);

const noAuthSold = await req('GET', '/listings/sold-history');
check('GET /sold-history without token -> 401', noAuthSold.status === 401, `status=${noAuthSold.status}`);

// 2. Log in with the dev OTP flow.
const phone = '9000000007';
await req('POST', '/auth/otp/request', { body: { phone } });
// In dev the OTP is printed to the API console — read it back from the log file.
await new Promise((r) => setTimeout(r, 400));
const log = readFileSync(API_LOG, 'utf8');
const devMatch = new RegExp(`\\[dev-otp\\] OTP for ${phone} is: (\\d{6})`, 'g');
const matches = [...log.matchAll(devMatch)];
const devOtp = matches.at(-1)?.[1];
let token = null;
for (const candidate of devOtp ? [devOtp] : ['123456']) {
  const v = await req('POST', '/auth/otp/verify', { body: { phone, otp: candidate } });
  if (v.status === 200) {
    token = v.json?.token;
    break;
  }
}
check('OTP login obtains a token', Boolean(token), token ? 'token present' : 'no token (dev OTP unknown)');

if (token) {
  const list = await req('GET', '/listings?sort=random&limit=6', { token });
  check('GET /listings?sort=random -> 200', list.status === 200, `status=${list.status}, results=${list.json?.results}`);

  const filtered = await req('GET', '/listings?minAge=1&maxAge=10&taluk=Palayamkottai', { token });
  check('age+taluk filters accepted -> 200', filtered.status === 200, `status=${filtered.status}`);

  const sold = await req('GET', '/listings/sold-history', { token });
  check('GET /sold-history -> 200', sold.status === 200, `status=${sold.status}, total=${sold.json?.total}`);

  // Sold history must not leak contact numbers.
  const leaked = (sold.json?.data || []).some((l) => l.phone || l.whatsapp);
  check('sold history hides phone/whatsapp', !leaked, `leaked=${leaked}`);

  // Only APPROVED appear in active browse; SOLD only in history.
  const activeHasSold = (list.json?.data || []).some((l) => l.status === 'SOLD');
  check('active browse excludes SOLD', !activeHasSold, `hasSold=${activeHasSold}`);
}

const categories = await req('GET', '/categories');
const keys = (categories.json?.data || []).map((c) => c.key);
check('GET /categories is public + has 14 keys', categories.status === 200 && keys.length === 14, `count=${keys.length}`);

check(
  'new categories present',
  ['buffalo', 'rooster', 'cat', 'otherbirds', 'otheranimals'].every((k) => keys.includes(k)),
  keys.join(',')
);

console.log(checks.join('\n'));
const failed = checks.filter((c) => c.startsWith('FAIL')).length;
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
