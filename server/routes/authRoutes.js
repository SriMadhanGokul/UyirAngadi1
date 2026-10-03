import express from 'express';
import { requestOtpHandler, verifyOtpHandler, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { requestOtpSchema, verifyOtpSchema } from '../utils/validators.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/otp/request', otpRequestLimiter, validateBody(requestOtpSchema), requestOtpHandler);
router.post('/otp/verify', otpVerifyLimiter, validateBody(verifyOtpSchema), verifyOtpHandler);
router.get('/me', protect, getMe);

export default router;
