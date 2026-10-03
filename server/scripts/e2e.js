/**
 * End-to-end API test against a running server + local MongoDB.
 * Start the server first (npm run dev), then: node scripts/e2e.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const NEW_PHONE = '9000000003';
const TEST_OTP = '123456';

let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? ` :: ${detail}` : ''}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`);
  }
  return ok;
}

async function api(method, path, { body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* raw */
  }
  return { status: res.status, body: data };
}

// 1x1 transparent PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[e2e] connected to MongoDB for test fixtures');

  // ---- Fixture: a known OTP so we can exercise the real verify endpoint ----
  await Otp.deleteMany({ phone: NEW_PHONE });
  await Otp.create({
    phone: NEW_PHONE,
    otpHash: await bcrypt.hash(TEST_OTP, 10),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // ---------- AUTH (single-page OTP flow) ----------
  const badOtp = await api('POST', '/api/v1/auth/otp/verify', {
    body: { phone: NEW_PHONE, otp: '000000' },
  });
  check('POST /auth/otp/verify wrong OTP -> 400', badOtp.status === 400, `status ${badOtp.status}`);

  const verify = await api('POST', '/api/v1/auth/otp/verify', {
    body: {
      phone: NEW_PHONE,
      otp: TEST_OTP,
      name: 'Selvi Devi',
      location: { district: 'Coimbatore', taluk: 'Pollachi', village: 'Anaimalai' },
    },
  });
  check('POST /auth/otp/verify valid OTP -> 200', verify.status === 200, `status ${verify.status}`);
  check('verify returns token', Boolean(verify.body?.token), 'token present');
  check('verify flags new user', verify.body?.isNewUser === true, `isNewUser=${verify.body?.isNewUser}`);

  const userToken = verify.body?.token;
  const userId = verify.body?.user?._id;

  const me = await api('GET', '/api/v1/users/me', { token: userToken });
  check('GET /users/me with token -> 200', me.status === 200, `status ${me.status}`);
  check('GET /users/me returns new user name', me.body?.user?.name === 'Selvi Devi', me.body?.user?.name);

  const meNoToken = await api('GET', '/api/v1/users/me');
  check('GET /users/me without token -> 401', meNoToken.status === 401, `status ${meNoToken.status}`);

  // ---------- SELL (create listing, multipart upload) ----------
  const form = new FormData();
  form.append('category', 'goat');
  form.append('breed', 'Kodi Aadu');
  form.append('title', 'E2E Test Kodi Aadu');
  form.append('description', 'Listing created by the automated end-to-end test to verify the sell flow works.');
  form.append('gender', 'Female');
  form.append('age', JSON.stringify({ years: 1, months: 3 }));
  form.append('price', '15000');
  form.append('isNegotiable', 'true');
  form.append('phone', NEW_PHONE);
  form.append('location', JSON.stringify({ district: 'Coimbatore', taluk: 'Pollachi', village: 'Anaimalai', pincode: '642104' }));
  form.append('categorySpecificDetails', JSON.stringify({ weightKg: 22, pregnant: true }));
  form.append('healthInfo', 'Healthy, active');
  form.append('vaccinationInfo', 'PPR done');
  form.append('photos', new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }), 'goat.png');

  const created = await api('POST', '/api/v1/listings', { token: userToken, form });
  check('POST /listings with photo -> 201', created.status === 201, `status ${created.status}`);
  check('new listing status is PENDING', created.body?.data?.status === 'PENDING', created.body?.data?.status);
  check('new listing has photo url', Boolean(created.body?.data?.photos?.[0]), created.body?.data?.photos?.[0]);
  check('new listing has slug', Boolean(created.body?.data?.slug), created.body?.data?.slug);
  check('new listing stores pincode', created.body?.data?.location?.pincode === '642104', created.body?.data?.location?.pincode);

  const listingId = created.body?.data?._id;

  const noPhotoForm = new FormData();
  noPhotoForm.append('category', 'goat');
  noPhotoForm.append('breed', 'Kodi Aadu');
  noPhotoForm.append('gender', 'Female');
  noPhotoForm.append('title', 'No Photo Listing');
  noPhotoForm.append('description', 'This should be rejected because no photo was supplied.');
  noPhotoForm.append('price', '100');
  noPhotoForm.append('phone', NEW_PHONE);
  noPhotoForm.append('location', JSON.stringify({ district: 'Coimbatore', taluk: 'Pollachi', village: 'Anaimalai', pincode: '642104' }));
  const noPhoto = await api('POST', '/api/v1/listings', { token: userToken, form: noPhotoForm });
  check('POST /listings without photo -> 400', noPhoto.status === 400, `status ${noPhoto.status}`);



  // ---------- Public browse: pending listing must NOT be visible ----------
  const publicList = await api('GET', '/api/v1/listings?category=goat', { token: userToken });
  const pendingVisible = (publicList.body?.data || []).some((l) => l._id === listingId);
  check('pending listing hidden from public search', !pendingVisible, `visible=${pendingVisible}`);

  // ---------- ADMIN ----------
  const admin = await User.findOne({ role: 'ADMIN' });
  const adminToken = signToken(admin);

  const adminStatsUnauthed = await api('GET', '/api/v1/admin/stats', { token: userToken });
  check('GET /admin/stats as normal user -> 403', adminStatsUnauthed.status === 403, `status ${adminStatsUnauthed.status}`);

  const adminStats = await api('GET', '/api/v1/admin/stats', { token: adminToken });
  check('GET /admin/stats as admin -> 200', adminStats.status === 200, `status ${adminStats.status}`);
  check(
    'admin stats exposes counters',
    typeof adminStats.body?.data?.pendingListings === 'number',
    `pending=${adminStats.body?.data?.pendingListings}`
  );

  const pendingQueue = await api('GET', '/api/v1/admin/listings?status=PENDING', { token: adminToken });
  check('GET /admin/listings?status=PENDING -> 200', pendingQueue.status === 200, `status ${pendingQueue.status}`);

  const approved = await api('PATCH', `/api/v1/admin/listings/${listingId}/approve`, { token: adminToken });
  check('PATCH /admin/listings/:id/approve -> 200', approved.status === 200, `status ${approved.status}`);
  check('approved listing status is APPROVED', approved.body?.data?.status === 'APPROVED', approved.body?.data?.status);

  // ---------- Public browse after approval ----------
  const detail = await api('GET', `/api/v1/listings/${listingId}`, { token: userToken });
  check('GET /listings/:id after approval -> 200', detail.status === 200, `status ${detail.status}`);
  check('detail exposes seller info', Boolean(detail.body?.data?.seller?.phone), detail.body?.data?.seller?.phone);

  const detail2 = await api('GET', `/api/v1/listings/${listingId}`, { token: userToken });
  check(
    'views increment on detail view',
    detail2.body?.data?.views > detail.body?.data?.views,
    `${detail.body?.data?.views} -> ${detail2.body?.data?.views}`
  );

  const filtered = await api(
    'GET',
    '/api/v1/listings?category=goat&district=Coimbatore&minPrice=10000&maxPrice=20000',
    { token: userToken }
  );
  const found = (filtered.body?.data || []).some((l) => l._id === listingId);
  check('listing appears in filtered search', found, `results=${filtered.body?.results}`);


  // ---------- Favourites ----------
  const favAdd = await api('POST', '/api/v1/favourites', { token: userToken, body: { listingId } });
  check('POST /favourites -> 201', favAdd.status === 201, `status ${favAdd.status}`);

  const favDup = await api('POST', '/api/v1/favourites', { token: userToken, body: { listingId } });
  check('POST /favourites duplicate is idempotent', favDup.status === 200, `status ${favDup.status}`);

  const favList = await api('GET', '/api/v1/favourites', { token: userToken });
  check('GET /favourites returns saved item', favList.body?.results >= 1, `results=${favList.body?.results}`);

  const favRemove = await api('DELETE', `/api/v1/favourites/${listingId}`, { token: userToken });
  check('DELETE /favourites/:listingId -> 204', favRemove.status === 204, `status ${favRemove.status}`);

  // ---------- Reports ----------
  const report = await api('POST', '/api/v1/reports', {
    token: userToken,
    body: { listingId, reason: 'WRONG_INFO', description: 'Price looks incorrect' },
  });
  check('POST /reports -> 201', report.status === 201, `status ${report.status}`);

  const badReport = await api('POST', '/api/v1/reports', {
    token: userToken,
    body: { listingId, reason: 'NOT_A_REASON' },
  });
  check('POST /reports invalid reason -> 422', badReport.status === 422, `status ${badReport.status}`);

  const myReports = await api('GET', '/api/v1/reports/my', { token: userToken });
  check('GET /reports/my -> 200', myReports.status === 200, `status ${myReports.status}`);

  const adminReports = await api('GET', '/api/v1/admin/reports', { token: adminToken });
  check('GET /admin/reports -> 200', adminReports.status === 200, `status ${adminReports.status}`);

  if (adminReports.body?.data?.[0]?._id) {
    const resolved = await api('PATCH', `/api/v1/admin/reports/${adminReports.body.data[0]._id}`, {
      token: adminToken,
      body: { status: 'RESOLVED' },
    });
    check('PATCH /admin/reports/:id -> 200', resolved.status === 200, resolved.body?.data?.status);
  }

  // ---------- Enquiries (buyer -> seller) ----------
  const seller = await User.findById(detail.body.data.seller._id);
  const sellerToken = signToken(seller);

  const enquiry = await api('POST', '/api/v1/enquiries', {
    token: userToken,
    body: { listingId, contactMethod: 'WHATSAPP' },
  });
  check('POST /enquiries -> 201', enquiry.status === 201, `status ${enquiry.status}`);

  const sellerEnquiries = await api('GET', '/api/v1/seller/enquiries', { token: sellerToken });
  check('GET /seller/enquiries -> 200', sellerEnquiries.status === 200, `status ${sellerEnquiries.status}`);
  check(
    'seller sees the enquiry with buyer info',
    sellerEnquiries.body?.data?.[0]?.buyer?.name === 'Selvi Devi',
    sellerEnquiries.body?.data?.[0]?.buyer?.name
  );

  const myEnquiries = await api('GET', '/api/v1/enquiries/my', { token: userToken });
  check('GET /enquiries/my -> 200', myEnquiries.status === 200, `status ${myEnquiries.status}`);

  // ---------- Seller dashboard ----------
  const sellerStats = await api('GET', '/api/v1/seller/stats', { token: sellerToken });
  check('GET /seller/stats -> 200', sellerStats.status === 200, `status ${sellerStats.status}`);
  check(
    'seller stats has expected keys',
    ['activeListingsCount', 'pendingListingsCount', 'soldListingsCount', 'totalEnquiriesCount'].every(
      (k) => typeof sellerStats.body?.data?.[k] === 'number'
    ),
    JSON.stringify(sellerStats.body?.data)
  );

  const sellerListings = await api('GET', '/api/v1/seller/listings', { token: sellerToken });
  check('GET /seller/listings -> 200', sellerListings.status === 200, `status ${sellerListings.status}`);
  check(
    'seller only sees own listings',
    (sellerListings.body?.data || []).every((l) => l.seller === String(seller._id)),
    `count=${sellerListings.body?.results}`
  );

  const sold = await api('PATCH', `/api/v1/seller/listings/${listingId}/sold`, { token: sellerToken });
  check('PATCH /seller/listings/:id/sold -> 200', sold.status === 200, `status ${sold.status}`);
  check(
    'listing marked SOLD with soldAt',
    sold.body?.data?.status === 'SOLD' && Boolean(sold.body?.data?.soldAt),
    `status=${sold.body?.data?.status}`
  );

  const soldDetail = await api('GET', `/api/v1/listings/${listingId}`, { token: sellerToken });
  check('sold listing reports isSold flag', soldDetail.body?.isSold === true, `isSold=${soldDetail.body?.isSold}`);

  // ---------- Admin moderation + user management ----------
  const rejected = await api('PATCH', `/api/v1/admin/listings/${listingId}/reject`, {
    token: adminToken,
    body: { rejectionReason: 'Photos not clear enough' },
  });
  check('PATCH /admin/listings/:id/reject -> 200', rejected.status === 200, `status ${rejected.status}`);
  check(
    'reject stores reason',
    rejected.body?.data?.rejectionReason === 'Photos not clear enough',
    rejected.body?.data?.rejectionReason
  );

  const noReason = await api('PATCH', `/api/v1/admin/listings/${listingId}/reject`, {
    token: adminToken,
    body: {},
  });
  check('reject without reason -> 422', noReason.status === 422, `status ${noReason.status}`);

  const users = await api('GET', '/api/v1/admin/users', { token: adminToken });
  check('GET /admin/users -> 200', users.status === 200, `status ${users.status}`);
  check(
    'admin users list includes listingsCount',
    typeof users.body?.data?.[0]?.listingsCount === 'number',
    `count=${users.body?.data?.[0]?.listingsCount}`
  );

  const suspended = await api('PATCH', `/api/v1/admin/users/${userId}/suspend`, {
    token: adminToken,
    body: { isSuspended: true },
  });
  check('PATCH /admin/users/:id/suspend -> 200', suspended.status === 200, `status ${suspended.status}`);

  const suspendedAccess = await api('GET', '/api/v1/users/me', { token: userToken });
  check('suspended user blocked -> 403', suspendedAccess.status === 403, `status ${suspendedAccess.status}`);

  await api('PATCH', `/api/v1/admin/users/${userId}/suspend`, {
    token: adminToken,
    body: { isSuspended: false },
  });

  // ---------- Categories (i18n reference data) ----------
  const cats = await api('GET', '/api/v1/categories');
  check('GET /categories returns seeded categories', (cats.body?.results || 0) >= 9, `results=${cats.body?.results}`);
  check(
    'categories include Tamil names',
    Boolean(cats.body?.data?.find((c) => c.key === 'cow')?.nameTa),
    cats.body?.data?.find((c) => c.key === 'cow')?.nameTa
  );

  // ---------- Cleanup ----------
  await api('DELETE', `/api/v1/admin/listings/${listingId}`, { token: adminToken });
  await User.findByIdAndDelete(userId);
  await mongoose.connection.close();

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('[e2e] crashed:', err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});


