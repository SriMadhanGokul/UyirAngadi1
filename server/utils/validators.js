import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/; // Indian 10-digit mobile numbers

export const requestOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().min(2).max(80).optional(),
  location: z
    .object({
      district: z.string().optional(),
      taluk: z.string().optional(),
      village: z.string().optional(),
    })
    .optional(),
});

export const listingCreateSchema = z.object({
  category: z.string().min(1),
  breed: z.string().trim().min(1),
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(3000).optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  age: z
    .object({
      years: z.coerce.number().min(0).optional(),
      months: z.coerce.number().min(0).max(11).optional(),
    })
    .optional(),
  price: z.coerce.number().min(0),
  isNegotiable: z.coerce.boolean().optional(),
  phone: z.string().regex(phoneRegex),
  whatsapp: z.string().regex(phoneRegex).optional(),
  location: z.object({
    district: z.string().min(1),
    taluk: z.string().trim().min(1),
    village: z.string().trim().min(1),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  }),
  categorySpecificDetails: z.record(z.string(), z.any()).optional(),
  healthInfo: z.string().optional(),
  vaccinationInfo: z.string().optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial();

export const reportSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(['FAKE', 'WRONG_INFO', 'SOLD', 'SUSPICIOUS', 'INAPPROPRIATE', 'DUPLICATE', 'OTHER']),
  description: z.string().max(500).optional(),
});

export const enquirySchema = z.object({
  listingId: z.string().min(1),
  contactMethod: z.enum(['CALL', 'WHATSAPP']),
});

export const favouriteSchema = z.object({
  listingId: z.string().min(1),
});

export const markSoldSchema = z.object({
  soldPrice: z.coerce.number().min(0).optional(),
});

export const rejectListingSchema = z.object({
  rejectionReason: z.string().min(3).max(500),
});

export const suspendUserSchema = z.object({
  isSuspended: z.coerce.boolean(),
});

export const listingQuerySchema = z.object({
  category: z.string().optional(),
  breed: z.string().optional(),
  district: z.string().optional(),
  taluk: z.string().optional(),
  village: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  q: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'random']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
