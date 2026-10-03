import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    profileImage: { type: String },
    location: {
      district: { type: String, trim: true },
      taluk: { type: String, trim: true },
      village: { type: String, trim: true },
    },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
