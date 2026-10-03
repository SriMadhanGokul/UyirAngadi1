import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  },
  { timestamps: true }
);

favouriteSchema.index({ user: 1, listing: 1 }, { unique: true });

export default mongoose.model('Favourite', favouriteSchema);
