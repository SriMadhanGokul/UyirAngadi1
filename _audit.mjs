// Temporary audit script for the login-first rebuild.
import { readFileSync, existsSync } from 'node:fs';

const root = 'C:/Users/ASUS/Desktop/UyirAngadi02/';
const read = (p) => readFileSync(root + p, 'utf8');

// --- server ---
const upload = read('server/middleware/upload.js');
console.log('upload 3gp:', /3gp/i.test(upload));

const seed = read('server/scripts/seed.js');
const seedCatKeys = [...seed.matchAll(/key: '([a-z]+)',\s*\r?\n\s*nameEn/g)].map((m) => m[1]);
console.log('seed categories:', seedCatKeys.join(','));
console.log('seed lowercase migration:', seed.includes('$toLower'));

// --- client pages ---
for (const p of [
  'client/src/pages/LoginPage.tsx',
  'client/src/pages/SoldHistoryPage.tsx',
  'client/src/pages/HomePage.tsx',
  'client/src/pages/VerifyOtpPage.tsx',
]) {
  console.log(p, existsSync(root + p) ? 'EXISTS' : 'MISSING');
}

// --- LoginPage: is it single-page (inline OTP)? ---
const login = read('client/src/pages/LoginPage.tsx');
console.log('login has inline OTP state:', login.includes("step: 'phone'") || login.includes('otpSent'));
console.log('login imports VerifyOtp/uses navigate(/verify-otp):', login.includes('/verify-otp'));

// --- App.tsx routes ---
const app = read('client/src/App.tsx');
console.log('App has /listings route:', app.includes('path="listings"'));
console.log('App has sold-history route:', app.includes('sold-history'));
console.log('App still uses HomePage:', app.includes('HomePage'));
console.log('App still uses verify-otp:', app.includes('verify-otp'));

// --- SearchPage ---
const search = read('client/src/pages/SearchPage.tsx');
console.log('Search has AddAnimal btn:', search.includes('/sell') && /Add Animal|addAnimal/i.test(search));
console.log('Search has SoldHistory btn:', search.includes('/sold-history'));
console.log('Search has taluk filter:', search.includes("taluk"));
console.log('Search has age filter:', search.includes('minAge'));
console.log('Search default random:', search.includes("'random'"));

// --- i18n ta parity for new keys ---
const en = JSON.parse(read('client/src/i18n/locales/en.json'));
const ta = JSON.parse(read('client/src/i18n/locales/ta.json'));
const keys = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, p ? `${p}.${k}` : k) : [p ? `${p}.${k}` : k]
  );
const enKeys = keys(en);
const taKeys = keys(ta);
console.log('en keys:', enKeys.length, 'ta keys:', taKeys.length);
console.log('only in en:', enKeys.filter((k) => !taKeys.includes(k)).join(',') || '(none)');
console.log('only in ta:', taKeys.filter((k) => !enKeys.includes(k)).join(',') || '(none)');
