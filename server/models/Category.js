import mongoose from 'mongoose';

const breedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    nameEn: { type: String, required: true },
    nameTa: { type: String, required: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true, trim: true, lowercase: true },
    nameEn: { type: String, required: true },
    nameTa: { type: String, required: true },
    icon: { type: String },
    breeds: [breedSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
