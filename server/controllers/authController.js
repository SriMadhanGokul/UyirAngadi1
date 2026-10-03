import User from '../models/User.js';
import { requestOtp, verifyOtp } from '../services/otpService.js';
import { signToken } from '../utils/jwt.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const requestOtpHandler = catchAsync(async (req, res) => {
  const { phone } = req.body;
  await requestOtp(phone);
  res.status(200).json({ status: 'success', message: 'OTP sent' });
});

export const verifyOtpHandler = catchAsync(async (req, res, next) => {
  const { phone, otp, name, location } = req.body;

  const result = await verifyOtp(phone, otp);
  if (!result.valid) {
    return next(new AppError(result.reason, 400));
  }

  let user = await User.findOne({ phone });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      phone,
      name: name || '',
      location: location || {},
      isVerified: true,
    });
  } else if (!user.isVerified) {
    user.isVerified = true;
    if (name) user.name = name;
    if (location) user.location = { ...user.location, ...location };
    await user.save();
  }

  if (user.isSuspended) {
    return next(new AppError('Your account has been suspended. Contact support.', 403));
  }

  const token = signToken(user);
  res.status(200).json({
    status: 'success',
    token,
    user,
    isNewUser,
  });
});

export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', user: req.user });
});
