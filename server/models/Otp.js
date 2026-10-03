import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index: auto-delete documents 10 minutes after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model('Otp', otpSchema);
