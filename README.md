# UyirAngadi (உயிர்அங்காடி)

**Tamil Nadu's animal buying & selling marketplace.**

UyirAngadi is a **classifieds platform only**. It does not buy, own, store, transport, or sell
animals. It connects sellers directly with buyers — deals happen offline. Sellers create listings,
buyers browse/search/filter and contact sellers by phone or WhatsApp.

> **Current status:** the full stack is in place and running. The backend API is verified, and the
> React + Vite frontend in `client/` is implemented with the live OTP auth, listing discovery,
> seller dashboard, and admin moderation flow already wired up.

---

## Tech stack

| Layer      | Technology                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Backend    | Node.js + Express 5 (ES modules)                                                                       |
| Database   | MongoDB + Mongoose 9                                                                                   |
| Auth       | Phone + OTP, bcrypt-hashed OTPs, JWT access tokens                                                     |
| Validation | Zod                                                                                                    |
| Media      | Cloudinary (with local `/uploads` fallback for dev)                                                    |
| Security   | Helmet, CORS allow-list, rate limiting, NoSQL-injection guard, input validation, file-type/size checks |

---

## Project structure

```
uyirangadi/
├── client/                     # React + Vite + TypeScript app with the marketplace UI
├── server/
│   ├── config/                 # db.js (Mongo connection), cloudinary.js
│   ├── models/                 # User, Otp, Listing, Favourite, Report, Enquiry, Category
│   ├── controllers/            # auth, listing, favourite, report, enquiry, seller, admin, user
│   ├── routes/                 # versioned routers (mounted at /api/v1)
│   ├── middleware/             # auth, role guard, validation, upload, rate limits, errors
│   ├── services/               # otpService, uploadService
│   ├── utils/                  # AppError, catchAsync, jwt, zod validators
│   ├── scripts/                # seed + verification scripts
│   ├── uploads/                # local dev media fallback (gitignored)
│   ├── server.js               # entry point
│   └── .env.example
├── package.json                # convenience scripts for both apps
└── .gitignore
```

---

## Prerequisites

- Node.js 20+ (verified on Node 22)
- MongoDB 6+ running locally, **or** a free MongoDB Atlas cluster

---

## Current app flow

The live app flow is:

1. User opens `/` and is redirected to `/login` if not authenticated.
2. On the OTP login page, a user enters a phone number, requests an OTP, and verifies it.
3. After login, authenticated buyers are sent to `/listings` and can browse approved listings,
   filter by category/breed/location/price, favourite items, and open listing details.
4. Sellers can go to `/sell` to create or edit listings, upload photos/video, and publish them for
   moderation.
5. Admin users review `/admin` listings, approve/reject submissions, manage reports, and moderate
   users/categories.
6. Seller dashboards show stats, active listings, and enquiries received for their own listings.

The app uses route guards so private pages, seller flows, and admin screens are only accessible when
the user session and role match the route.

## Full-stack startup

```bash
# 1. Install both app dependencies
npm run install:all

# 2. Create server env file
cd server
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# 3. Edit .env values, then seed reference data
npm run seed

# 4. Start the API
npm run dev                 # http://localhost:5000
```

Then in a second terminal:

```bash
# Start the frontend
npm run dev:client          # http://localhost:5173
```

From the repository root you can also use `npm run build:client`, `npm run dev:server`,
`npm run start:server`.

### Environment variables

| Variable                | Required | Description                                                    |
| ----------------------- | -------- | -------------------------------------------------------------- |
| `NODE_ENV`              | yes      | `development` or `production`                                  |
| `PORT`                  | no       | API port (default `5000`)                                      |
| `MONGODB_URI`           | yes      | Mongo connection string                                        |
| `JWT_SECRET`            | yes      | Long random string used to sign tokens                         |
| `JWT_EXPIRES_IN`        | no       | Token lifetime (default `30d`)                                 |
| `FRONTEND_URL`          | yes      | Comma-separated CORS allow-list (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | no       | If all three Cloudinary vars are set, media goes to Cloudinary |
| `CLOUDINARY_API_KEY`    | no       | The API key must have upload ("create") permission             |
| `CLOUDINARY_API_SECRET` | no       |                                                                |
| `CLOUDINARY_FOLDER`     | no       | Cloudinary folder for uploads (default `uyirangadi`)           |
| `SMS_API_KEY`           | no       | If unset, OTPs are printed to the server console (dev mode)    |
| `ADMIN_PHONE`           | no       | Phone number promoted to ADMIN by the seed script              |
| `ADMIN_NAME`            | no       | Display name for the seeded admin                              |

---

## Creating an initial admin user

Admins log in through the **same OTP flow** as everyone else — there is no separate admin login.
The seed script promotes a phone number to `ADMIN`:

```bash
# server/.env
ADMIN_PHONE=9999999999
ADMIN_NAME=Admin
```

```bash
cd server
npm run seed
```

Then log in with that phone number (the OTP is printed to the server console in dev) and you get
access to every `/api/v1/admin/*` route. To promote an existing user later, update the `role` field
in MongoDB:

```js
db.users.updateOne({ phone: "9876543210" }, { $set: { role: "ADMIN" } });
```

### What the seed script creates

- 9 categories with English + Tamil names and breeds (cow, bull, goat, sheep, chicken, dog, rabbit, pigeon, lovebird)
- 1 admin user
- 1 demo seller (`9000000002`) with 4 sample listings (3 approved, 1 pending)
- Clears stale OTP records

---

## API reference

Base path: **`/api/v1`** · Auth header: `Authorization: Bearer <token>`

### Health

| Method | Endpoint  | Access | Notes                                              |
| ------ | --------- | ------ | -------------------------------------------------- |
| GET    | `/health` | public | Outside `/api/v1`; returns `{ status: 'success' }` |

### Auth (single-page OTP flow)

| Method | Endpoint            | Access | Notes                                                                                                    |
| ------ | ------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/otp/request` | public | Body `{ phone }`. Rate limited (10 / 15 min). Console-logs OTP in dev                                    |
| POST   | `/auth/otp/verify`  | public | Body `{ phone, otp, name?, location? }` → `{ token, user, isNewUser }`. Creates the user on first verify |
| GET    | `/auth/me`          | auth   | Current user                                                                                             |

### Users

| Method | Endpoint           | Access | Notes                                         |
| ------ | ------------------ | ------ | --------------------------------------------- |
| GET    | `/users/me`        | auth   | Current user profile                          |
| PATCH  | `/users/me`        | auth   | Update `name`, `location`                     |
| POST   | `/users/me/avatar` | auth   | `multipart/form-data`, field `image` (≤ 5 MB) |

### Listings

| Method | Endpoint             | Access      | Notes                                                                                                                                                                                                                                                                  |
| ------ | -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/listings`          | public      | Filters: `category, breed, district, taluk, village, minPrice, maxPrice, minAge, maxAge, gender, q, sort, page, limit`. Only `APPROVED` listings                                                                                                                       |
| GET    | `/listings/:id`      | public      | Detail + `isSold` flag; increments `views` for approved listings                                                                                                                                                                                                       |
| POST   | `/listings`          | auth        | `multipart/form-data`. Fields: `category, breed, title, description, gender, age, price, isNegotiable, phone, whatsapp, location, categorySpecificDetails, healthInfo, vaccinationInfo`; files `photos[]` (required, ≤ 8) and `video` (optional). Created as `PENDING` |
| PUT    | `/listings/:id`      | owner/admin | Edit; owner edits re-enter `PENDING`                                                                                                                                                                                                                                   |
| DELETE | `/listings/:id`      | owner/admin | Delete                                                                                                                                                                                                                                                                 |
| PATCH  | `/listings/:id/sold` | owner/admin | Sets `status: SOLD` and `soldAt`                                                                                                                                                                                                                                       |

`location`, `age` and `categorySpecificDetails` are sent as **JSON strings** in multipart requests.

### Favourites, reports, enquiries

| Method | Endpoint                 | Access        | Notes                                                     |
| ------ | ------------------------ | ------------- | --------------------------------------------------------- |
| GET    | `/favourites`            | auth          | Saved listings (populated)                                |
| POST   | `/favourites`            | auth          | Body `{ listingId }`; idempotent                          |
| DELETE | `/favourites/:listingId` | auth          | Remove                                                    |
| POST   | `/reports`               | auth          | Body `{ listingId, reason, description? }`                |
| GET    | `/reports/my`            | auth          | Reports raised by me                                      |
| POST   | `/enquiries`             | optional auth | Body `{ listingId, contactMethod: 'CALL' \| 'WHATSAPP' }` |
| GET    | `/enquiries/my`          | auth          | Enquiries I made                                          |

### Seller dashboard

| Method | Endpoint                    | Access | Notes                                                                                                      |
| ------ | --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/seller/stats`             | auth   | `activeListingsCount, pendingListingsCount, soldListingsCount, rejectedListingsCount, totalEnquiriesCount` |
| GET    | `/seller/listings`          | auth   | Own listings; optional `status, page, limit`                                                               |
| PATCH  | `/seller/listings/:id/sold` | auth   | Mark own listing sold                                                                                      |
| GET    | `/seller/enquiries`         | auth   | Enquiries received (buyer info when logged in)                                                             |

### Admin (`role: 'ADMIN'` required)

| Method | Endpoint                               | Notes                                                                                                                                     |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/stats`                         | `totalUsers, totalSellers, totalBuyers, totalListings, activeListings, pendingListings, soldListings, rejectedListings, reportedListings` |
| GET    | `/admin/listings?status=&page=&limit=` | Moderation queue                                                                                                                          |
| PATCH  | `/admin/listings/:id/approve`          | Publish listing                                                                                                                           |
| PATCH  | `/admin/listings/:id/reject`           | Body `{ rejectionReason }`                                                                                                                |
| PATCH  | `/admin/listings/:id/feature`          | Body `{ days }` — sets `isFeatured` + `featuredUntil` (monetization hook)                                                                 |
| DELETE | `/admin/listings/:id`                  | Remove listing                                                                                                                            |
| GET    | `/admin/reports`                       | All reports with listing + reporter                                                                                                       |
| PATCH  | `/admin/reports/:id`                   | Body `{ status: 'OPEN' \| 'IN_REVIEW' \| 'RESOLVED' }`                                                                                    |
| GET    | `/admin/users`                         | Users with `listingsCount`                                                                                                                |
| PATCH  | `/admin/users/:id/suspend`             | Body `{ isSuspended }` (admin accounts are protected)                                                                                     |
| GET    | `/admin/categories`                    | List                                                                                                                                      |
| POST   | `/admin/categories`                    | Create                                                                                                                                    |
| PUT    | `/admin/categories/:id`                | Update (including `breeds[]`)                                                                                                             |
| DELETE | `/admin/categories/:id`                | Delete                                                                                                                                    |

### Public reference data

| Method | Endpoint      | Notes                                                |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | `/categories` | Active categories with breeds, English + Tamil names |

---

## Data models

| Model       | Purpose                      | Key fields                                                                                                                                               |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`      | Buyers + sellers + admins    | `phone` (unique), `role`, `location`, `isVerified`, `isSuspended`                                                                                        |
| `Otp`       | Short-lived OTP records      | `phone`, `otpHash` (bcrypt), `expiresAt` (TTL index), `attempts`                                                                                         |
| `Listing`   | Animal listings              | `seller, category, breed, title, slug, price, age, location, photos[], video, categorySpecificDetails, status, isFeatured, featuredUntil, views, soldAt` |
| `Favourite` | Saved listings               | unique `(user, listing)` compound index                                                                                                                  |
| `Report`    | Abuse/accuracy reports       | `reason` enum, `status` enum                                                                                                                             |
| `Enquiry`   | Contact attempts (analytics) | `buyer?`, `seller`, `listing`, `contactMethod`                                                                                                           |
| `Category`  | Admin-managed taxonomy       | `key`, `nameEn`, `nameTa`, `icon`, `breeds[]`                                                                                                            |

`Listing.status` flows: `DRAFT → PENDING → APPROVED → SOLD`, with `REJECTED` (+ `rejectionReason`)
for moderation failures. Only `APPROVED` listings are publicly searchable.

---

## Security notes

- OTPs are **bcrypt-hashed** and expire in 5 minutes; max 5 wrong attempts then the record is destroyed. A MongoDB TTL index auto-purges them.
- JWT access tokens carry `id`, `role`, `phone`; `protect` re-checks the user exists and is not suspended on every request.
- Role guard (`restrictTo('ADMIN')`) on all admin routes — verified to return **403** for normal users.
- Zod validation on every write endpoint; invalid input returns **422** with field-level messages.
- `sanitizeRequest` strips `$`-prefixed and dotted keys from bodies/params (defense-in-depth against NoSQL operator injection); listing query params are whitelisted by schema.
- Uploads restricted by MIME type (JPG/PNG/WEBP images, MP4/MOV/WEBM video) and size (50 MB cap; 5 MB for avatars).
- Helmet, strict CORS allow-list (unknown origins get a clean **403**), and rate limiting on OTP + write endpoints.
- No secrets are ever exposed to the client; media lives in Cloudinary (or `/uploads` in dev), only URLs are stored in MongoDB.

---

## Verification

Every script below was run against a live server + local MongoDB. Scripts live in `server/scripts`
and are exposed as npm scripts.

| Command                  | What it does                                                                                                                                                              | Result         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `npm run check:modules`  | Boots the module graph, asserts every controller/model/router export resolves                                                                                             | **PASS**       |
| `npm run check:smoke`    | Hits public + protected routes, asserts 200/401/404/422 behaviour                                                                                                         | **8/8 PASS**   |
| `npm run check:e2e`      | Full flow: OTP login → sell (multipart upload) → admin approve → filtered search → favourites → reports → enquiries → seller stats → mark sold → reject/suspend → cleanup | **52/52 PASS** |
| `npm run check:security` | Helmet headers, CORS allow-list + rejection, upload type rejection, body-size limit, static uploads, injection guard                                                      | **9/9 PASS**   |

The server must be running (`npm run dev`) for `check:smoke`, `check:e2e` and `check:security`.

Rate limiting was verified manually: 10 requests to `/auth/otp/request` succeed, the 11th returns
**429**.

---

## Development notes

- **OTP in development:** without `SMS_API_KEY`, the OTP is written to the server console:
  `[dev-otp] OTP for 9xxxxxxxxx is: 123456 (expires in 5 min)`. Swap in MSG91/Twilio inside
  `server/services/otpService.js` for production.
- **Media in development:** without Cloudinary credentials, uploads are written to `server/uploads`
  and served from `/uploads/<file>`. Set the `CLOUDINARY_*` variables for production.
- **API versioning:** all business routes hang off `/api/v1`, so a future `/api/v2` can ship
  without breaking clients.

---

## Current roadmap / implemented flow

**Backend — verified and complete.** Auth, listings + moderation, favourites, reports, enquiries,
seller dashboard, admin dashboard, categories, i18n reference data (English + Tamil), seed data,
and security hardening are all in place.

**Frontend — implemented.** The Vite + React app in `client/` now includes:

- Single-page OTP auth at `/login` and `/admin/login` with phone + OTP verification
- Redirect logic for unauthenticated users, admin users, and signed-in buyers/sellers
- Listing discovery with search, filters, product cards, favourites, and detail pages
- Sell flow with photo/video upload, dynamic category metadata, and editing of existing listings
- Seller dashboard with stats, sold history, own listings, and enquiries
- Admin dashboard for moderation, reports, users, and category management
- Multi-language UI via `react-i18next` (`en.json` / `ta.json`), plus static pages for About, Terms,
  Privacy, and Safety

**Current product scope:** classifieds only; no payments, delivery coordination, live chat, or auction workflows.
Monetization hooks such as `isFeatured` and `featuredUntil` remain available for future work.
