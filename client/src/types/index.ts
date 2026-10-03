export type Role = 'USER' | 'ADMIN';

export type ListingStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD';

export type Gender = 'Male' | 'Female' | 'Other';

export type ReportReason =
  | 'FAKE'
  | 'WRONG_INFO'
  | 'SOLD'
  | 'SUSPICIOUS'
  | 'INAPPROPRIATE'
  | 'DUPLICATE'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export type ContactMethod = 'CALL' | 'WHATSAPP';

export interface LocationInput {
  district?: string;
  taluk?: string;
  village?: string;
  pincode?: string;
}

export interface ApproximateLocation {
  lat?: number;
  lng?: number;
}

export interface User {
  _id: string;
  name?: string;
  phone: string;
  role: Role;
  profileImage?: string;
  location?: LocationInput;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithStats extends User {
  listingsCount: number;
}

export interface ListingSeller {
  _id: string;
  name?: string;
  phone: string;
  createdAt: string;
}

export interface ListingLocation extends LocationInput {
  district: string;
  taluk: string;
  village: string;
  pincode: string;
  approximateLocation?: ApproximateLocation;
}

export interface ListingAge {
  years?: number;
  months?: number;
}

export interface Listing {
  _id: string;
  seller: ListingSeller | string;
  category: string;
  breed?: string;
  title: string;
  slug?: string;
  description: string;
  gender?: Gender;
  age?: ListingAge;
  price: number;
  isNegotiable: boolean;
  phone?: string;
  whatsapp?: string;
  location: ListingLocation;
  photos: string[];
  video?: string;
  categorySpecificDetails?: Record<string, unknown>;
  healthInfo?: string;
  vaccinationInfo?: string;
  status: ListingStatus;
  rejectionReason?: string;
  isFeatured: boolean;
  featuredUntil?: string;
  views: number;
  soldAt?: string;
  soldPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBreed {
  key: string;
  nameEn: string;
  nameTa: string;
}

export interface Category {
  _id: string;
  key: string;
  nameEn: string;
  nameTa: string;
  icon?: string;
  breeds: CategoryBreed[];
  active: boolean;
}

export interface Favourite {
  _id: string;
  user: string;
  listing: Listing;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporter: User | string;
  listing: Listing | string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Enquiry {
  _id: string;
  buyer?: Pick<User, '_id' | 'name' | 'phone' | 'location'> | null;
  seller: string;
  listing: Listing;
  contactMethod: ContactMethod;
  createdAt: string;
}

export interface ListingFilters {
  category?: string;
  breed?: string;
  district?: string;
  taluk?: string;
  village?: string;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  gender?: Gender | '';
  q?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'random';
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ApiError {
  status: string;
  message: string;
}

export interface SellerStats {
  activeListingsCount: number;
  pendingListingsCount: number;
  soldListingsCount: number;
  rejectedListingsCount: number;
  totalEnquiriesCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  soldListings: number;
  rejectedListings: number;
  reportedListings: number;
}

/** Payload for creating/updating a listing (multipart-friendly) */
export interface ListingFormValues {
  category: string;
  breed: string;
  title: string;
  description: string;
  gender: Gender | '';
  ageYears: string;
  ageMonths: string;
  price: string;
  isNegotiable: boolean;
  phone: string;
  whatsapp: string;
  district: string;
  taluk: string;
  village: string;
  pincode: string;
  healthInfo: string;
  vaccinationInfo: string;
  /** category-specific answers keyed by field name */
  details: Record<string, string>;
  photos: File[];
  video: File | null;
}
