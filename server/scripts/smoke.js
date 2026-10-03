/**
 * Smoke test: boots the Express app, asserts every route module loaded and
 * that public + protected endpoints respond correctly.
 * Requires a reachable MongoDB (set MONGODB_URI or run against in-memory).
 * Run: node scripts/smoke.js
 */
import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            /* keep raw */
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function main() {
  const health = await request('GET', '/health');
  check('GET /health', health.status === 200, `status ${health.status}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const smokeUser = await User.findOne({ role: 'USER', isVerified: true });
  const listingsToken = smokeUser ? signToken(smokeUser) : null;

  const protectListingsNoToken = await request('GET', '/api/v1/listings');
  check(
    'GET /api/v1/listings without token -> 401',
    protectListingsNoToken.status === 401,
    `status ${protectListingsNoToken.status}`
  );

  const protectListings = await request('GET', '/api/v1/listings', null, listingsToken);
  check(
    'GET /api/v1/listings with token -> 200',
    protectListings.status === 200,
    `status ${protectListings.status}`
  );

  const protectFav = await request('GET', '/api/v1/favourites');
  check('GET /api/v1/favourites without token -> 401', protectFav.status === 401, `status ${protectFav.status}`);

  const protectAdmin = await request('GET', '/api/v1/admin/stats');
  check('GET /api/v1/admin/stats without token -> 401', protectAdmin.status === 401, `status ${protectAdmin.status}`);

  const cats = await request('GET', '/api/v1/categories');
  check('GET /api/v1/categories', cats.status === 200, `status ${cats.status}`);

  const badPhone = await request('POST', '/api/v1/auth/otp/request', { phone: '12345' });
  check('POST /auth/otp/request invalid phone -> 422', badPhone.status === 422, `status ${badPhone.status}`);

  const okPhone = await request('POST', '/api/v1/auth/otp/request', { phone: '9000000002' });
  check('POST /auth/otp/request valid phone -> 200', okPhone.status === 200, `status ${okPhone.status}`);

  const notFound = await request('GET', '/api/v1/does-not-exist');
  check('unknown route -> 404', notFound.status === 404, `status ${notFound.status}`);

  const failed = results.filter((r) => !r.ok);
  await mongoose.connection.close().catch(() => {});
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
