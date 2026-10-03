import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Report from '../models/Report.js';
import Enquiry from '../models/Enquiry.js';
import Favourite from '../models/Favourite.js';
import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getAdminStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalListings,
    activeListings,
    pendingListings,
    soldListings,
    rejectedListings,
    reportedListings,
  ] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'APPROVED' }),
    Listing.countDocuments({ status: 'PENDING' }),
    Listing.countDocuments({ status: 'SOLD' }),
    Listing.countDocuments({ status: 'REJECTED' }),
    Report.countDocuments({ status: { $ne: 'RESOLVED' } }),
  ]);

  const sellerIds = await Listing.distinct('seller');
  const buyerIds = [
    ...(await Enquiry.distinct('buyer')),
    ...(await Favourite.distinct('user')),
  ].filter(Boolean);
  const uniqueBuyerIds = new Set(buyerIds.map((id) => id.toString()));

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      totalSellers: sellerIds.length,
      totalBuyers: uniqueBuyerIds.size,
      totalListings,
      activeListings,
      pendingListings,
      soldListings,
      rejectedListings,
      reportedListings,
    },
  });
});

export const getAdminListings = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', 'name phone')
      .sort({ createdAt: -1 })
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

export const approveListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  listing.status = 'APPROVED';
  listing.rejectionReason = undefined;
  await listing.save();

  res.status(200).json({ status: 'success', data: listing });
});

export const rejectListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  listing.status = 'REJECTED';
  listing.rejectionReason = req.body.rejectionReason;
  await listing.save();

  res.status(200).json({ status: 'success', data: listing });
});

export const featureListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  const days = Number(req.body.days) || 7;
  listing.isFeatured = true;
  listing.featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await listing.save();

  res.status(200).json({ status: 'success', data: listing });
});

export const getAdminReports = catchAsync(async (req, res) => {
  const reports = await Report.find()
    .populate('listing', 'title photos price location status')
    .populate('reporter', 'name phone')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: reports.length, data: reports });
});

export const updateReportStatus = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found', 404));

  if (req.body.status) report.status = req.body.status;
  await report.save();

  res.status(200).json({ status: 'success', data: report });
});

export const getAdminUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(500).lean();

  const listingCounts = await Listing.aggregate([
    { $group: { _id: '$seller', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(listingCounts.map((c) => [c._id.toString(), c.count]));

  const data = users.map((u) => ({
    ...u,
    listingsCount: countMap.get(u._id.toString()) || 0,
  }));

  res.status(200).json({ status: 'success', results: data.length, data });
});

export const suspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'ADMIN') {
    return next(new AppError('Admin accounts cannot be suspended.', 400));
  }

  user.isSuspended = req.body.isSuspended;
  await user.save();

  res.status(200).json({ status: 'success', data: user });
});

export const deleteListingAsAdmin = catchAsync(async (req, res, next) => {
  const listing = await Listing.findByIdAndDelete(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));
  res.status(204).json({ status: 'success', data: null });
});

export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ key: 1 });
  res.status(200).json({ status: 'success', results: categories.length, data: categories });
});

export const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', data: category });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!category) return next(new AppError('Category not found', 404));
  res.status(200).json({ status: 'success', data: category });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));
  res.status(204).json({ status: 'success', data: null });
});
