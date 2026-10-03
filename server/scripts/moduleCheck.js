import 'dotenv/config';
import express from 'express';
import apiRoutes from '../routes/index.js';
import { getListings } from '../controllers/listingController.js';
import { requestOtpHandler, verifyOtpHandler } from '../controllers/authController.js';
import { getAdminStats, approveListing, rejectListing } from '../controllers/adminController.js';
import { getSellerStats, getSellerEnquiries } from '../controllers/sellerController.js';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { addFavourite, removeFavourite, getMyFavourites } from '../controllers/favouriteController.js';
import { createEnquiry, getMyEnquiries } from '../controllers/enquiryController.js';
import { updateMe } from '../controllers/userController.js';
import { signToken } from '../utils/jwt.js';
import User from '../models/User.js';

const expectedExports = {
  listingController: { getListings },
  authController: { requestOtpHandler, verifyOtpHandler },
  adminController: { getAdminStats, approveListing, rejectListing },
  sellerController: { getSellerStats, getSellerEnquiries },
  reportController: { createReport, getMyReports },
  favouriteController: { addFavourite, removeFavourite, getMyFavourites },
  enquiryController: { createEnquiry, getMyEnquiries },
  userController: { updateMe },
  utilsJwt: { signToken },
  modelsUser: { User },
};

let failures = 0;
for (const [group, fns] of Object.entries(expectedExports)) {
  for (const [name, fn] of Object.entries(fns)) {
    const ok = fn !== undefined && fn !== null;
    if (!ok) {
      console.error(`[module-check] FAIL: ${group}.${name} is not exported`);
      failures += 1;
    }
  }
}

const layerCount = apiRoutes.stack ? apiRoutes.stack.length : 0;
console.log(`[module-check] apiRoutes is an express Router: ${apiRoutes instanceof Function}`);
console.log(`[module-check] mounted layer count: ${layerCount}`);

if (layerCount < 9) {
  console.error(`[module-check] FAIL: expected >= 9 mounted layers, got ${layerCount}`);
  failures += 1;
}

if (failures > 0) {
  console.error(`[module-check] FAILED with ${failures} problem(s)`);
  process.exit(1);
}

console.log('[module-check] PASS: all controllers, models and routers load correctly');
process.exit(0);
