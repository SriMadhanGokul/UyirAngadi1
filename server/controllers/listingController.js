import Listing from '../models/Listing.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { uploadMedia } from '../services/uploadService.js';

const MAX_LISTINGS_PER_USER = 20;

function buildFilterQuery(query) {
  const filter = { status: 'APPROVED' };
  if (query.category) filter.category = query.category.toLowerCase();
  if (query.breed) filter.breed = new RegExp(query.breed, 'i');
  if (query.district) filter['location.district'] = new RegExp(`^${query.district}$`, 'i');
  if (query.taluk) filter['location.taluk'] = new RegExp(`^${query.taluk}$`, 'i');
  if (query.village) filter['location.village'] = new RegExp(`^${query.village}$`, 'i');
  if (query.gender) filter.gender = query.gender;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }
  if (query.minAge || query.maxAge) {
    filter['age.years'] = {};
    if (query.minAge) filter['age.years'].$gte = query.minAge;
    if (query.maxAge) filter['age.years'].$lte = query.maxAge;
  }
  if (query.q) {
    filter.$text = { $search: query.q };
  }
  return filter;
}

function buildSort(sort) {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'newest':
    default:
      return { isFeatured: -1, createdAt: -1 };
  }
}

export const getListings = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const limit = query.limit || 20;
  const filter = buildFilterQuery(query);

  if (query.sort === 'random') {
    const total = await Listing.countDocuments(filter);
    const skip = Math.floor(Math.random() * Math.max(0, total - limit));
    const listings = await Listing.find(filter)
      .populate('seller', 'name phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.status(200).json({
      status: 'success',
      results: listings.length,
      total,
      page: 1,
      pages: Math.ceil(total / limit),
      data: listings,
    });
  }

  const page = query.page || 1;
  const sort = buildSort(query.sort);

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', 'name phone createdAt')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: listings.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: listings,
  });
});

export const getSoldHistory = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const filter = { status: 'SOLD' };
  if (query.category) filter.category = query.category.toLowerCase();
  if (query.district) filter['location.district'] = new RegExp(`^${query.district}$`, 'i');

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', 'name createdAt')
      .sort({ soldAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: listings.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: listings,
  });
});

export const getListingById = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id).populate('seller', 'name phone createdAt');
  if (!listing) return next(new AppError('Listing not found', 404));

  // Only increment views for approved, publicly visible listings
  if (listing.status === 'APPROVED') {
    listing.views += 1;
    await listing.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
    data: listing,
    isSold: listing.status === 'SOLD',
  });
});


export const createListing = catchAsync(async (req, res, next) => {
  const files = req.files || {};
  const photoFiles = files.photos || [];
  const videoFile = files.video ? files.video[0] : null;

  let location = req.body.location;
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch {
      return next(new AppError('Invalid location data', 400));
    }
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /^\d{6}$/;
  if (!req.body.category || !req.body.breed?.trim() || !['Male', 'Female', 'Other'].includes(req.body.gender)) {
    return next(new AppError('Category, breed, and gender are required.', 400));
  }
  if (!phoneRegex.test(req.body.phone || '')) {
    return next(new AppError('Enter a valid 10-digit contact phone number.', 400));
  }
  if (!location?.district?.trim() || !location?.taluk?.trim() || !location?.village?.trim()) {
    return next(new AppError('District, taluk, and village are required.', 400));
  }
  if (!pincodeRegex.test(location?.pincode || '')) {
    return next(new AppError('Enter a valid 6-digit pincode.', 400));
  }

  if (req.user.role !== 'ADMIN') {
    const listingCount = await Listing.countDocuments({ seller: req.user._id });
    if (listingCount >= MAX_LISTINGS_PER_USER) {
      return next(new AppError(`You can add up to ${MAX_LISTINGS_PER_USER} animals only.`, 400));
    }
  }

  if (photoFiles.length < 1) {
    return next(new AppError('At least one photo is required.', 400));
  }

  const photos = await Promise.all(photoFiles.map((f) => uploadMedia(f, 'image')));
  const video = videoFile ? await uploadMedia(videoFile, 'video') : undefined;

  let categorySpecificDetails = req.body.categorySpecificDetails;
  if (typeof categorySpecificDetails === 'string') {
    try {
      categorySpecificDetails = JSON.parse(categorySpecificDetails);
    } catch {
      categorySpecificDetails = {};
    }
  }

  let age = req.body.age;
  if (typeof age === 'string') {
    try {
      age = JSON.parse(age);
    } catch {
      age = undefined;
    }
  }

  const listing = await Listing.create({
    seller: req.user._id,
    category: req.body.category,
    breed: req.body.breed,
    title: req.body.title,
    description: req.body.description,
    gender: req.body.gender,
    age,
    price: req.body.price,
    isNegotiable: req.body.isNegotiable === 'true' || req.body.isNegotiable === true,
    phone: req.body.phone || req.user.phone,
    whatsapp: req.body.whatsapp,
    location,
    photos,
    video,
    categorySpecificDetails,
    healthInfo: req.body.healthInfo,
    vaccinationInfo: req.body.vaccinationInfo,
    status: 'PENDING',
  });

  res.status(201).json({
    status: 'success',
    message: 'Your listing is under review. It will be published after admin approval.',
    data: listing,
  });
});


async function findOwnedListing(req, next) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    next(new AppError('Listing not found', 404));
    return null;
  }
  if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
    next(new AppError('You do not have permission to modify this listing.', 403));
    return null;
  }
  return listing;
}

export const updateListing = catchAsync(async (req, res, next) => {
  const listing = await findOwnedListing(req, next);
  if (!listing) return;

  const editableFields = [
    'category', 'breed', 'title', 'description', 'gender', 'age', 'price',
    'isNegotiable', 'phone', 'whatsapp', 'location', 'categorySpecificDetails',
    'healthInfo', 'vaccinationInfo',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) listing[field] = req.body[field];
  });

  // Re-submit for review after edits unless an admin is editing
  if (req.user.role !== 'ADMIN') {
    listing.status = 'PENDING';
  }

  await listing.save();
  res.status(200).json({ status: 'success', data: listing });
});

export const updateListingMedia = catchAsync(async (req, res, next) => {
  const listing = await findOwnedListing(req, next);
  if (!listing) return;

  const files = req.files || {};
  const photoFiles = files.photos || [];
  const videoFile = files.video?.[0];

  if (photoFiles.length > 0) {
    listing.photos = await Promise.all(photoFiles.map((file) => uploadMedia(file, 'image')));
  }
  if (videoFile) {
    listing.video = await uploadMedia(videoFile, 'video');
  } else if (req.body.removeVideo === 'true') {
    listing.video = undefined;
  }

  if (req.user.role !== 'ADMIN') listing.status = 'PENDING';
  await listing.save();
  res.status(200).json({ status: 'success', data: listing });
});

export const deleteListing = catchAsync(async (req, res, next) => {
  const listing = await findOwnedListing(req, next);
  if (!listing) return;
  await listing.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});

export const markAsSold = catchAsync(async (req, res, next) => {
  const listing = await findOwnedListing(req, next);
  if (!listing) return;
  listing.status = 'SOLD';
  listing.soldAt = new Date();
  if (req.body.soldPrice !== undefined) listing.soldPrice = req.body.soldPrice;
  await listing.save();
  res.status(200).json({ status: 'success', data: listing });
});
