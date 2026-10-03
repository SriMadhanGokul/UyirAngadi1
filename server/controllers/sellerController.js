import Listing from '../models/Listing.js';
import Enquiry from '../models/Enquiry.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getSellerStats = catchAsync(async (req, res) => {
  const sellerId = req.user._id;

  const [activeListingsCount, pendingListingsCount, soldListingsCount, rejectedListingsCount, totalEnquiriesCount] =
    await Promise.all([
      Listing.countDocuments({ seller: sellerId, status: 'APPROVED' }),
      Listing.countDocuments({ seller: sellerId, status: 'PENDING' }),
      Listing.countDocuments({ seller: sellerId, status: 'SOLD' }),
      Listing.countDocuments({ seller: sellerId, status: 'REJECTED' }),
      Enquiry.countDocuments({ seller: sellerId }),
    ]);

  res.status(200).json({
    status: 'success',
    data: {
      activeListingsCount,
      pendingListingsCount,
      soldListingsCount,
      rejectedListingsCount,
      totalEnquiriesCount,
    },
  });
});

export const getSellerListings = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = { seller: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [listings, total] = await Promise.all([
    Listing.find(filter)
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

export const markSellerListingSold = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(new AppError('Listing not found', 404));
  if (listing.seller.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to modify this listing.', 403));
  }

  listing.status = 'SOLD';
  listing.soldAt = new Date();
  if (req.body.soldPrice !== undefined) listing.soldPrice = req.body.soldPrice;
  await listing.save();

  res.status(200).json({ status: 'success', data: listing });
});

export const getSellerEnquiries = catchAsync(async (req, res) => {
  const enquiries = await Enquiry.find({ seller: req.user._id })
    .populate('listing', 'title photos price location status')
    .populate('buyer', 'name phone location')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: enquiries.length, data: enquiries });
});
