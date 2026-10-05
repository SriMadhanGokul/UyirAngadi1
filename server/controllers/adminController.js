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
    suspendedUsers,
    userAccounts,
    sellerIds,
    unresolvedReportListings,
  ] = await Promise.all([
    User.countDocuments(),
    Listing.countDocuments(),
    Listing.countDocuments({ status: 'APPROVED' }),
    Listing.countDocuments({ status: 'PENDING' }),
    Listing.countDocuments({ status: 'SOLD' }),
    Listing.countDocuments({ status: 'REJECTED' }),
    User.countDocuments({ isSuspended: true, role: { $ne: 'ADMIN' } }),
    User.find({ role: 'USER' }).select('_id isSuspended').lean(),
    Listing.distinct('seller'),
    Report.distinct('listing', { status: { $ne: 'RESOLVED' } }),
  ]);

  const sellerIdSet = new Set(sellerIds.map((id) => id.toString()));
  const activeUsers = userAccounts.filter((user) => !user.isSuspended);
  const activeSellers = activeUsers.filter((user) => sellerIdSet.has(user._id.toString())).length;
  const activeBuyers = activeUsers.length - activeSellers;

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      totalSellers: sellerIds.length,
      totalBuyers: activeBuyers,
      activeSellers,
      activeBuyers,
      totalListings,
      activeListings,
      pendingListings,
      soldListings,
      rejectedListings,
      reportedListings: unresolvedReportListings.length,
      suspendedUsers,
    },
  });
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getAdminListings = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const page = query.page || 1;
  const limit = query.limit || 20;

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category.toLowerCase();
  if (query.district) filter['location.district'] = new RegExp(`^${escapeRegex(query.district)}$`, 'i');
  if (query.seller) {
    if (/^[a-f\d]{24}$/i.test(query.seller)) {
      filter.seller = query.seller;
    } else {
      const sellerSearch = new RegExp(escapeRegex(query.seller), 'i');
      const sellerMatches = await User.find({ $or: [{ name: sellerSearch }, { phone: sellerSearch }] }).select('_id').lean();
      filter.seller = { $in: sellerMatches.map((user) => user._id) };
    }
  }
  if (query.q) {
    const search = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: search }, { breed: search }, { phone: search }];
  }
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = query.dateFrom;
    if (query.dateTo) filter.createdAt.$lt = new Date(query.dateTo.getTime() + 24 * 60 * 60 * 1000);
  }

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('seller', 'name phone profileImage location createdAt isSuspended')
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

  if (req.body.isFeatured === false) {
    listing.isFeatured = false;
    listing.featuredUntil = undefined;
  } else {
    const days = Number(req.body.days) || 7;
    listing.isFeatured = true;
    listing.featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  await listing.save();
  await listing.populate('seller', 'name phone profileImage location createdAt isSuspended');

  res.status(200).json({ status: 'success', data: listing });
});

export const updateAdminListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  const editableFields = [
    'category', 'breed', 'title', 'description', 'gender', 'age', 'price',
    'isNegotiable', 'phone', 'whatsapp', 'location', 'categorySpecificDetails',
    'healthInfo', 'vaccinationInfo',
  ];
  for (const field of editableFields) {
    if (req.body[field] !== undefined) listing[field] = req.body[field];
  }
  if (req.body.category !== undefined) listing.category = req.body.category.toLowerCase();

  await listing.save();
  await listing.populate('seller', 'name phone profileImage location createdAt isSuspended');
  res.status(200).json({ status: 'success', data: listing });
});

export const updateAdminListingStatus = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  listing.status = req.body.status;
  if (req.body.status === 'REJECTED') {
    listing.rejectionReason = req.body.rejectionReason;
  } else {
    listing.rejectionReason = undefined;
  }
  if (req.body.status === 'SOLD') {
    listing.soldAt = new Date();
    if (req.body.soldPrice !== undefined) listing.soldPrice = req.body.soldPrice;
  } else {
    listing.soldAt = undefined;
    listing.soldPrice = undefined;
  }

  await listing.save();
  await listing.populate('seller', 'name phone profileImage location createdAt isSuspended');
  res.status(200).json({ status: 'success', data: listing });
});

export const getAdminReports = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const filter = query.status ? { status: query.status } : {};
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate({ path: 'listing', populate: { path: 'seller', select: 'name phone profileImage location createdAt isSuspended' } })
      .populate('reporter', 'name phone location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: reports.length,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    data: reports,
  });
});

export const updateReportStatus = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found', 404));

  if (req.body.status) report.status = req.body.status;
  await report.save();
  await report.populate([
    { path: 'listing', populate: { path: 'seller', select: 'name phone profileImage location createdAt isSuspended' } },
    { path: 'reporter', select: 'name phone location' },
  ]);

  res.status(200).json({ status: 'success', data: report });
});

export const getAdminUsers = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.isSuspended = query.status === 'SUSPENDED';
  if (query.district) filter['location.district'] = new RegExp(`^${escapeRegex(query.district)}$`, 'i');
  if (query.q) {
    const search = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: search }, { phone: search }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const userIds = users.map((user) => user._id);
  const [listingCounts, enquiryCounts] = userIds.length
    ? await Promise.all([
        Listing.aggregate([
          { $match: { seller: { $in: userIds } } },
          { $group: { _id: '$seller', count: { $sum: 1 } } },
        ]),
        Enquiry.aggregate([
          { $match: { buyer: { $in: userIds } } },
          { $group: { _id: '$buyer', count: { $sum: 1 } } },
        ]),
      ])
    : [[], []];
  const listingCountMap = new Map(listingCounts.map((item) => [item._id.toString(), item.count]));
  const enquiryCountMap = new Map(enquiryCounts.map((item) => [item._id.toString(), item.count]));

  const data = users.map((u) => ({
    ...u,
    listingsCount: listingCountMap.get(u._id.toString()) || 0,
    enquiriesCount: enquiryCountMap.get(u._id.toString()) || 0,
  }));

  res.status(200).json({
    status: 'success', results: data.length, total, page,
    pages: Math.max(1, Math.ceil(total / limit)), data,
  });
});

export const suspendUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'ADMIN') {
    return next(new AppError('Admin accounts cannot be suspended.', 400));
  }

  // Soft suspension preserves listing/report/enquiry references and is reversible.
  user.isSuspended = req.body.isSuspended;
  await user.save();

  res.status(200).json({ status: 'success', data: user });
});

export const deleteUserAsAdmin = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'ADMIN') {
    return next(new AppError('Admin accounts cannot be deleted.', 400));
  }

  const userId = user._id;
  const sellerListings = await Listing.find({ seller: userId }, '_id').lean();
  const listingIds = sellerListings.map((listing) => listing._id);

  await Promise.all([
    Listing.deleteMany({ seller: userId }),
    Favourite.deleteMany({ $or: [{ user: userId }, { listing: { $in: listingIds } }] }),
    Enquiry.deleteMany({ $or: [{ buyer: userId }, { seller: userId }, { listing: { $in: listingIds } }] }),
    Report.deleteMany({ $or: [{ reporter: userId }, { listing: { $in: listingIds } }] }),
  ]);

  await user.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});

export const deleteListingAsAdmin = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));

  // Remove dependent records first so no report, enquiry, or favourite points at a deleted listing.
  await Promise.all([
    Report.deleteMany({ listing: listing._id }),
    Enquiry.deleteMany({ listing: listing._id }),
    Favourite.deleteMany({ listing: listing._id }),
  ]);
  await listing.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});

export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ active: true }).sort({ key: 1 });
  res.status(200).json({ status: 'success', results: categories.length, data: categories });
});

export const getAdminCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ key: 1 });
  res.status(200).json({ status: 'success', results: categories.length, data: categories });
});

export const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', data: category });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const existing = await Category.findById(req.params.id);
  if (!existing) return next(new AppError('Category not found', 404));
  if (req.body.key && req.body.key.toLowerCase() !== existing.key && await Listing.exists({ category: existing.key })) {
    return next(new AppError('This category is used by listings. Its key cannot be changed.', 409));
  }
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!category) return next(new AppError('Category not found', 404));
  res.status(200).json({ status: 'success', data: category });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));
  if (await Listing.exists({ category: category.key })) {
    return next(new AppError('This category is used by listings. Deactivate it instead of deleting it.', 409));
  }
  await category.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});
