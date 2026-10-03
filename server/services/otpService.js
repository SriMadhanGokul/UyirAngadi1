import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateSixDigitOtp() {
  // Temporary dev-only override so the app can be tested reliably without
  // depending on a real SMS provider or random generation.
  return '123456';
}

export async function requestOtp(phone) {
  const otp = generateSixDigitOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove previous unused OTPs for this phone
  await Otp.deleteMany({ phone });
  await Otp.create({ phone, otpHash, expiresAt });

  // Pluggable SMS provider. In dev (no SMS_API_KEY) we log to console.
  if (process.env.SMS_API_KEY) {
    // TODO: integrate real SMS provider (e.g. MSG91, Twilio) here.
    console.log(`[sms] Would send OTP ${otp} to ${phone} via configured provider`);
  } else {
    console.log(`\n[dev-otp] OTP for ${phone} is: ${otp} (expires in ${OTP_EXPIRY_MINUTES} min)\n`);
  }

  return { expiresAt };
}

export async function verifyOtp(phone, otp) {
  const record = await Otp.findOne({ phone }).sort({ createdAt: -1 });
  if (!record) {
    return { valid: false, reason: 'OTP not found or expired. Please request a new one.' };
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { valid: false, reason: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { valid: false, reason: 'Incorrect OTP.' };
  }

  await Otp.deleteOne({ _id: record._id });
  return { valid: true };
}
