import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Favourite from '../models/Favourite.js';
import Report from '../models/Report.js';
import Enquiry from '../models/Enquiry.js';

// Removes e2e fixture leftovers so `isNewUser` style checks see a clean DB.
const PHONE = process.env.E2E_PHONE || '9000000003';

await connectDB();
const user = await User.findOne({ phone: PHONE });
if (user) {
  await Listing.deleteMany({ seller: user._id });
  await Favourite.deleteMany({ user: user._id });
  await Report.deleteMany({ reporter: user._id });
  await Enquiry.deleteMany({ buyer: user._id });
  await user.deleteOne();
  console.log(`[cleanup] removed fixture user ${PHONE} and their data`);
} else {
  console.log(`[cleanup] no fixture user ${PHONE} found`);
}
await mongoose.connection.close();
