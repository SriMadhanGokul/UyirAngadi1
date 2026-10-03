import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    reason: {
      type: String,
      enum: ['FAKE', 'WRONG_INFO', 'SOLD', 'SUSPICIOUS', 'INAPPROPRIATE', 'DUPLICATE', 'OTHER'],
      required: true,
    },
    description: { type: String },
    status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED'], default: 'OPEN' },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
