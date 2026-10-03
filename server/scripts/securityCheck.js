import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const BASE = 'http://127.0.0.1:5000';
await mongoose.connect(process.env.MONGODB_URI);
const user = await User.findOne({ role: 'ADMIN' });
const token = signToken(user);
let fails = 0;
const check = (n, ok, d = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ` :: ${d}` : ''}`);
  if (!ok) fails += 1;
};

// helmet headers
const h = await fetch(`${BASE}/health`);
check('helmet sets x-content-type-options', h.headers.get('x-content-type-options') === 'nosniff',
  h.headers.get('x-content-type-options'));
check('helmet sets x-frame-options', Boolean(h.headers.get('x-frame-options')), h.headers.get('x-frame-options'));
check('helmet hides x-powered-by', !h.headers.get('x-powered-by'), h.headers.get('x-powered-by') || 'absent');

// CORS: disallowed origin
const badOrigin = await fetch(`${BASE}/health`, { headers: { Origin: 'http://evil.example.com' } });
check('CORS rejects unknown origin', badOrigin.status >= 400, `status ${badOrigin.status}`);

const goodOrigin = await fetch(`${BASE}/api/v1/listings`, {
  headers: { Origin: 'http://localhost:5173', Authorization: `Bearer ${token}` },
});
check('CORS allows configured frontend origin',
  goodOrigin.headers.get('access-control-allow-origin') === 'http://localhost:5173',
  goodOrigin.headers.get('access-control-allow-origin'));

// Upload validation: wrong file type
const badForm = new FormData();
badForm.append('category', 'goat');
badForm.append('title', 'Bad Upload');
badForm.append('description', 'Testing that non-image uploads are rejected by the server.');
badForm.append('price', '100');
badForm.append('location', JSON.stringify({ district: 'Madurai' }));
badForm.append('photos', new Blob(['not an image'], { type: 'text/plain' }), 'evil.txt');
const badUpload = await fetch(`${BASE}/api/v1/listings`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: badForm,
});
const badBody = await badUpload.json();
check('non-image photo rejected -> 400', badUpload.status === 400, `status ${badUpload.status} ${badBody.message}`);

// Oversized JSON body
const bigBody = JSON.stringify({ phone: '9000000005', pad: 'x'.repeat(3 * 1024 * 1024) });
const big = await fetch(`${BASE}/api/v1/auth/otp/request`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: bigBody,
});
check('oversized JSON body rejected', big.status >= 400, `status ${big.status}`);

// Static uploads served
const up = await fetch(`${BASE}/uploads/does-not-exist.png`);
check('static /uploads route responds', up.status === 404, `status ${up.status}`);

// NoSQL injection attempt in query (authenticated browse)
const inj = await fetch(`${BASE}/api/v1/listings?district[$ne]=null`, {
  headers: { Authorization: `Bearer ${token}` },
});
check('NoSQL injection in query handled safely', inj.status === 200, `status ${inj.status}`);

await mongoose.connection.close();
console.log(`\n${fails === 0 ? 'ALL SECURITY CHECKS PASSED' : `${fails} CHECK(S) FAILED`}`);
process.exit(fails === 0 ? 0 : 1);
