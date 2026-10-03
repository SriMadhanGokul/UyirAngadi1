import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    contactMethod: { type: String, enum: ['CALL', 'WHATSAPP'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);
