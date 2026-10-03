import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, index: true, lowercase: true, trim: true },
    breed: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    slug: { type: String, index: true },
    description: { type: String },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    age: {
      years: { type: Number, min: 0 },
      months: { type: Number, min: 0, max: 11 },
    },
    price: { type: Number, required: true, min: 0 },
    isNegotiable: { type: Boolean, default: false },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    whatsapp: { type: String, trim: true },
    location: {
      district: { type: String, required: true, index: true, trim: true },
      taluk: { type: String, required: true, trim: true },
      village: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, match: /^\d{6}$/ },
      approximateLocation: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    photos: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: 'At least one photo is required',
      },
    },
    video: { type: String },
    categorySpecificDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    healthInfo: { type: String },
    vaccinationInfo: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SOLD'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String },
    isFeatured: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date },
    views: { type: Number, default: 0 },
    soldAt: { type: Date },
    soldPrice: { type: Number, min: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', breed: 'text' });

listingSchema.pre('validate', function generateSlug() {
  if (this.title && this.location?.district) {
    const base = `${this.title}-${this.location.district}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
});

export default mongoose.model('Listing', listingSchema);
