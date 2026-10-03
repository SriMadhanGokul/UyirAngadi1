import rateLimit from 'express-rate-limit';

const devOtpLimit = process.env.NODE_ENV === 'production' ? 10 : 1000;
const devOtpVerifyLimit = process.env.NODE_ENV === 'production' ? 20 : 1000;

export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: devOtpLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many OTP requests. Please try again later.' },
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: devOtpVerifyLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many verification attempts. Please try again later.' },
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please slow down.' },
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
